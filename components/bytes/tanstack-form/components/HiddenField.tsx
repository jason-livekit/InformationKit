import * as React from 'react';

import { useFieldContext } from '../hooks/form-context';

export default function HiddenField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const field = useFieldContext<string>();

  return (
    <input
      id={field.name}
      name={field.name}
      className="hidden"
      readOnly
      value={field.state.value === undefined ? '' : field.state.value}
      //   onChange={(event) => field.handleChange(event.target.value)}
      {...props}
    />
  );
}
