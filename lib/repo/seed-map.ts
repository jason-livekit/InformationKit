import type { MapCell, MapPage, MapRow } from './schemas';

let counter = 0;
function cell(text: string, opts?: Partial<MapCell>): MapCell {
  counter += 1;
  return {
    id: `seedmc_${counter}`,
    colSpan: 1,
    text,
    bold: false,
    italic: false,
    strike: false,
    align: 'center',
    hue: null,
    ...opts,
  };
}

function row(now: number, cells: MapCell[]): MapRow {
  counter += 1;
  return { id: `seedmr_${now}_${counter}`, height: 56, cells };
}

/**
 * A demo onboarding journey map. Five phases across the top (header), with a
 * couple of merged cells to show the OKLCH hue cascade, plus rows for the
 * customer's actions, touchpoints, and emotional state.
 */
export function DEMO_MAP(now: number): MapPage[] {
  counter = 0;
  const COLS = 5;
  const widths = [180, 180, 180, 180, 180];

  const rows: MapRow[] = [
    // Header — the five journey phases
    row(now, [
      cell('Discover', { bold: true }),
      cell('Sign up', { bold: true }),
      cell('Onboard', { bold: true }),
      cell('Activate', { bold: true }),
      cell('Retain', { bold: true }),
    ]),
    // Customer actions — a merged cell spans Sign up + Onboard
    row(now, [
      cell('Reads a blog post'),
      cell('Creates an account, then completes the guided setup', { colSpan: 2 }),
      cell('Runs first project'),
      cell('Invites teammates'),
    ]),
    // Touchpoints
    row(now, [
      cell('Search, ads'),
      cell('Landing page'),
      cell('Welcome email'),
      cell('In-app checklist'),
      cell('Usage digest'),
    ]),
    // Emotion — a wide merged "frustration" span across Onboard + Activate
    row(now, [
      cell('Curious'),
      cell('Hopeful'),
      cell('Overwhelmed at first, then confident once it clicks', { colSpan: 2 }),
      cell('Proud'),
    ]),
    // Opportunities
    row(now, [
      cell('Clearer value prop'),
      cell('Fewer form fields'),
      cell('Inline tips'),
      cell('Sample data'),
      cell('Referral nudge'),
    ]),
  ];

  return [
    {
      id: `seedmp_${now}`,
      name: 'Onboarding',
      table: {
        columnCount: COLS,
        columnWidths: widths,
        headerRows: 1,
        textSize: 'small',
        rows,
      },
    },
  ];
}
