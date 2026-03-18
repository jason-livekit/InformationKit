import * as React from 'react';
import { AnimatePresence, m } from 'motion/react';

export function FieldErrors(props: { errors: ({ message: string } | string)[] }) {
  const errors: string[] = props.errors.map((err) => {
    if (typeof err === 'string') {
      return err;
    }
    return err.message;
  });

  return (
    <AnimatePresence>
      {errors.length > 0 && (
        <m.ul className="flex flex-col gap-2 overflow-hidden">
          {errors.map((error, index) => (
            <m.li
              key={`${index}-${error}`}
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.2 }}
              className="text-fgSerious1 peer-invalid:text-fgSerious1 text-xs"
            >
              {error}
            </m.li>
          ))}
        </m.ul>
      )}
    </AnimatePresence>
  );
}
