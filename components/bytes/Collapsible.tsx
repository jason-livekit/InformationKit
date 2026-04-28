'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

/**
 * @example
 *
 * ```tsx
 * <Collapsible>
 *   <CollapsibleTrigger>Can I use this in my project?</CollapsibleTrigger>
 *   <CollapsibleContent>Collapsible content</CollapsibleContent>
 * </Collapsible>;
 * ```
 *
 * @see {@link https://www.radix-ui.com/primitives/docs/components/collapsible#root}
 */
const Collapsible = CollapsiblePrimitive.Root;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/collapsible#trigger} */
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/collapsible#content} */
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
