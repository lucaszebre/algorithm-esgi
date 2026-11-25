/**
 * Virtual DOM diffing and patching (Session 3, bonus). Implemented in #8.
 */
import type { VNode } from '../types';

/** One change to apply to the real DOM. Shape to be defined in #8. */
export interface Patch {}

/** Recursively compares two virtual trees and lists the changes. */
export function diff(_oldVNode: VNode, _newVNode: VNode): Patch[] {
  throw new Error('diff: not implemented (#8)');
}

/** Applies the patches produced by `diff` to `dom`. */
export function patch(_dom: Node, _patches: Patch[]): void {
  throw new Error('patch: not implemented (#8)');
}
