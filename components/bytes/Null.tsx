import { forwardRef } from 'react';

/**
 * A utility component that accepts any props and returns null. Handy for when the component to
 * render is conditional, but you want to constrain the prop types elsewhere or do not want to
 * delare a new anonymous component.
 *
 * @example Const Component = isValid ? Real : Null; return <Component foo="foo" bar={7} />;
 */
// eslint-disable-next-line
export function Null(..._: any[]): null {
  return null;
}

/**
 * A utility component that accepts any props + ref and returns null. Handy for when the component
 * to render is conditional, but you want to constrain the prop types elsewhere or do not want to
 * delare a new anonymous component.
 *
 * @example Const Component = isValid ? Real : Null; return <Component ref={compRef} foo="foo"
 * bar={7} />;
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const NullRef = forwardRef((_props, _ref) => null);
NullRef.displayName = 'VoidRef';
