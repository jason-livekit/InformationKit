import { AnalyticsUnit_Type } from '@/components/charts/types';
import { cleanupByteFraction, cleanupFractionUnits } from './readable-fractions';

const DEFAULT_LOCALES: readonly string[] = [];

export interface NumberFormattingOptions {
  locales?: Intl.LocalesArgument;
  unit?: AnalyticsUnit_Type | undefined;
  /**
   * A restricted version of the Intl.NumberFormatOptions interface.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat | Intl.NumberFormat()}
   */
  formatOptions?: RestrictedNumberFormattingOptions;
}

interface RestrictedNumberFormattingOptions extends Intl.NumberFormatOptions {
  notation?: Intl.NumberFormatOptions['notation'];
  unitDisplay?: Intl.NumberFormatOptions['unitDisplay'];
  unit?: Intl.NumberFormatOptions['unit'];
}

type NumberFormattingOptionsInternal = Required<
  Pick<NumberFormattingOptions, 'locales' | 'formatOptions'>
> &
  Omit<NumberFormattingOptions, 'locales' | 'formatOptions'>;

/** Plain replacement for the proto `AnalyticsScalarData_Custom_Fraction` type. */
export type ReadableFraction = { count: bigint; total: bigint };

export type FormattableNumber = number | bigint | ReadableFraction;

/**
 * Turn a number into a string for display to end users with support for various units and
 * formatting options.
 */
export function readableNumber(
  number: FormattableNumber,
  options: NumberFormattingOptions = {},
): string {
  return readableNumberAsParts(number, options)
    .map((part) => part.value)
    .join('');
}

export function readableNumberAsParts(
  number: FormattableNumber,
  options: NumberFormattingOptions = {},
): Intl.NumberFormatPart[] {
  const locales = options.locales || DEFAULT_LOCALES;
  const unit = options.unit;
  const formatOptions = {
    notation: 'compact',
    unitDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    ...options.formatOptions,
  } satisfies NumberFormattingOptionsInternal['formatOptions'];

  const preProcessedNumber = ((fraction_number) => {
    switch (options.unit) {
      case AnalyticsUnit_Type.Percent: {
        return numberToPercent(fraction_number);
      }
      default: {
        return fraction_number;
      }
    }
  })(number);

  if (typeof preProcessedNumber === 'number' || typeof preProcessedNumber === 'bigint') {
    return _readableNumberAsParts(preProcessedNumber, { locales, unit, formatOptions });
  } else {
    const countParts = _readableNumberAsParts(preProcessedNumber.count, {
      locales,
      unit: preProcessedNumber.count === 0n ? AnalyticsUnit_Type.Quantity : unit,
      formatOptions,
    });
    const totalParts = _readableNumberAsParts(preProcessedNumber.total, {
      locales,
      unit: preProcessedNumber.total === 0n ? AnalyticsUnit_Type.Quantity : unit,
      formatOptions,
    });
    const fractionParts = [
      ...countParts,
      { type: 'unknown', value: '/' } satisfies Intl.NumberFormatPart,
      ...totalParts,
    ];

    if (unit === AnalyticsUnit_Type.Percent) {
      return cleanupFractionUnits(fractionParts, 'percentSign');
    } else if (unit === AnalyticsUnit_Type.Bytes) {
      return cleanupByteFraction(fractionParts);
    } else {
      return cleanupFractionUnits(fractionParts, 'unit');
    }
  }
}

export function _readableNumberAsParts(
  number: number | bigint,
  options: NumberFormattingOptionsInternal,
): Intl.NumberFormatPart[] {
  const formatOptions = options.formatOptions;
  const unitDisplay = formatOptions.unitDisplay || 'short';

  const valueAsParts = ((unitType, value) => {
    switch (unitType) {
      case AnalyticsUnit_Type.Percent: {
        const percentValue = typeof value === 'bigint' ? Number(value) / 100 : value;
        return _formatNumber(percentValue, {
          ...options,
          formatOptions: {
            ...options.formatOptions,
            style: 'percent',
            notation: 'standard',
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          },
        });
      }
      case AnalyticsUnit_Type.Milliseconds:
        return _formatNumber(value, {
          ...options,
          formatOptions: {
            ...options.formatOptions,
            notation: 'standard',
            style: 'unit',
            unit: 'millisecond',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          },
        });
      case AnalyticsUnit_Type.Seconds: {
        if (value < 60 && value > -60) {
          return _formatNumber(value, {
            ...options,
            formatOptions: {
              ...options.formatOptions,
              notation: 'standard',
              style: 'unit',
              unit: 'second',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            },
          });
        } else {
          const minutes = numberToMinutes(value);
          return _formatNumber(minutes, {
            ...options,
            formatOptions: {
              ...options.formatOptions,
              notation: 'standard',
              style: 'unit',
              unit: 'minute',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            },
          });
        }
      }
      case AnalyticsUnit_Type.FramesPerSecond: {
        return _formatNumber(value, {
          ...options,
          formatOptions: {
            ...options.formatOptions,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            useGrouping: false,
            notation: 'standard',
          },
        });
      }
      case AnalyticsUnit_Type.Pixels: {
        return _formatNumber(value, {
          ...options,
          formatOptions: {
            ...options.formatOptions,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            useGrouping: false,
            notation: 'standard',
          },
        });
      }
      case AnalyticsUnit_Type.BitsPerSecond: {
        const parts = _formatNumber(value, {
          ...options,
          locales: 'en-US',
          formatOptions: {
            ...options.formatOptions,
            notation: 'compact',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: false,
          },
        });
        return unitBillionToGiga(parts);
      }
      case AnalyticsUnit_Type.Bytes: {
        const parts = _formatNumber(value, {
          ...options,
          locales: 'en-US',
          formatOptions: {
            ...options.formatOptions,
            unitDisplay:
              value < 1e3 && value > -1e3
                ? options.formatOptions.unitDisplay || 'narrow'
                : 'narrow',
            notation: 'compact',
            style: 'unit',
            unit: 'byte',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: false,
          },
        });
        return unitBillionToGiga(parts);
      }
      case AnalyticsUnit_Type.Quantity: {
        return _formatNumber(value, {
          ...options,
          formatOptions: {
            ...options.formatOptions,
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          },
        });
      }
      case undefined:
        return _formatNumber(value, {
          ...options,
          formatOptions: { ...options.formatOptions },
        });
    }
  })(options.unit, number);

  const unitAsParts: Intl.NumberFormatPart[] = ((unitType) => {
    const parts: Intl.NumberFormatPart[] = [];
    switch (unitType) {
      case AnalyticsUnit_Type.FramesPerSecond: {
        parts.push({ type: 'unit', value: 'fps' });
        return parts;
      }
      case AnalyticsUnit_Type.Pixels: {
        parts.push({ type: 'unit', value: 'px' });
        return parts;
      }
      case AnalyticsUnit_Type.BitsPerSecond: {
        if (unitDisplay !== 'narrow') {
          parts.push({ type: 'literal', value: ' ' });
        }
        parts.push({ type: 'unit', value: 'bps' });
        return parts;
      }
      case AnalyticsUnit_Type.Milliseconds:
      case AnalyticsUnit_Type.Seconds:
      case AnalyticsUnit_Type.Percent:
      case AnalyticsUnit_Type.Bytes:
      case AnalyticsUnit_Type.Quantity:
      default:
        return parts;
    }
  })(options.unit);

  const valueAndUnitParts = [...(valueAsParts ?? []), ...unitAsParts];
  return unitDisplay !== 'narrow'
    ? addSpaceBeforeCompactSymbol(valueAndUnitParts)
    : valueAndUnitParts;
}

export function _formatNumber(
  number: FormattableNumber,
  options: NumberFormattingOptionsInternal,
): Intl.NumberFormatPart[] {
  const formatter = new Intl.NumberFormat(options.locales, options.formatOptions);

  if (typeof number === 'number' || typeof number === 'bigint') {
    return formatter.formatToParts(number);
  } else {
    const countParts = formatter.formatToParts(number.count);
    const totalParts = formatter.formatToParts(number.total);
    return [
      ...countParts,
      { type: 'unknown', value: '/' } satisfies Intl.NumberFormatPart,
      ...totalParts,
    ];
  }
}

function numberToMinutes(number: FormattableNumber): FormattableNumber {
  if (typeof number === 'number' || typeof number === 'bigint') {
    return Math.round(Number(number) / 60);
  } else {
    const countAsMinutes = Math.round(Number(number.count) / 60);
    const totalAsMinutes = Math.round(Number(number.total) / 60);
    return { ...number, count: BigInt(countAsMinutes), total: BigInt(totalAsMinutes) };
  }
}

function numberToPercent(number: FormattableNumber): FormattableNumber {
  if (typeof number === 'number') {
    return number;
  } else if (typeof number === 'bigint') {
    return number;
  } else {
    console.warn(
      'Percentage values should not be represened as fractions. Use scalar values with unit percentage instead.',
    );
    const countAsPercentage = (Number(number.count) / Number(number.total)) * 100;
    return { ...number, count: BigInt(Math.round(countAsPercentage)), total: 100n };
  }
}

function unitBillionToGiga(parts: Intl.NumberFormatPart[]): Intl.NumberFormatPart[] {
  return parts.map((part) => {
    if (part.type === 'compact' && part.value === 'B') {
      return { ...part, value: 'G' };
    } else {
      return part;
    }
  });
}

function addSpaceBeforeCompactSymbol(parts: Intl.NumberFormatPart[]): Intl.NumberFormatPart[] {
  return parts.reduce<{ result: Intl.NumberFormatPart[]; compactPosition: number }>(
    (acc, part, index, all) => {
      if (part.type === 'compact') {
        const hasUnit = all.slice(index + 1).some((p) => p.type === 'unit');
        if (hasUnit) {
          return {
            ...acc,
            result: [...acc.result, { type: 'literal', value: ' ' }, part],
            compactPosition: index,
          };
        } else {
          return {
            ...acc,
            result: [...acc.result, part],
            compactPosition: index,
          };
        }
      } else if (
        acc.compactPosition + 1 === index &&
        part.type === 'literal' &&
        part.value === ' '
      ) {
        return acc;
      } else {
        return { ...acc, result: [...acc.result, part] };
      }
    },
    { result: [], compactPosition: -Infinity },
  ).result;
}
