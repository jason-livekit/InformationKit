import type { ReactNode } from 'react';

/**
 * A utility component that accepts any props, optionally with children, and returns a fragment with
 * those children. Handy for when the children should be conditionally wrapped, but you want to
 * chose the wrapper before instantiation. Appeases the typechecker when passing arbitrary props,
 * compared to using {@link Fragment} directly.
 *
 * @example Const MaybeWrapped = shouldWrap ? Wrapper : Children; return ( <MaybeWrapped some="prop"
 * value={42}> {children} </MaybeWrapped> );
 */
export function Children<C extends ReactNode, P extends { children: C }>({
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ..._
}: P): C {
  return children;
}
