/**
 * A minimal fake of the DOM the renderer uses (`document.createElement`,
 * `createTextNode`, attributes, children, events), so it can be tested with
 * `node --test` without a browser.
 *
 * `toHTML(node)` serializes a fake node, to compare whole trees in one assert.
 */

export class FakeText extends EventTarget {
  readonly nodeType = 3;
  parentNode: FakeElement | null = null;
  data: string;
  constructor(data: string) {
    super();
    this.data = data;
  }
  get textContent(): string {
    return this.data;
  }
  set textContent(value: string) {
    this.data = value;
  }
}

export class FakeElement extends EventTarget {
  readonly nodeType = 1;
  readonly tagName: string;
  parentNode: FakeElement | null = null;
  childNodes: (FakeElement | FakeText)[] = [];
  readonly attributes = new Map<string, string>();
  /** DOM properties written by the renderer (`value`, `checked`, …). */
  [property: string]: unknown;

  constructor(tag: string) {
    super();
    this.tagName = tag.toUpperCase();
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, String(value));
  }
  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }
  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }
  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  appendChild<T extends FakeElement | FakeText>(child: T): T {
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }
  replaceChild<T extends FakeElement | FakeText>(
    newChild: T,
    oldChild: FakeElement | FakeText,
  ): FakeElement | FakeText {
    const index = this.childNodes.indexOf(oldChild);

    if (index === -1) {
      throw new Error('Child not found');
    }

    oldChild.parentNode = null;
    newChild.parentNode = this;
    this.childNodes[index] = newChild;

    return oldChild;
  }

  removeChild<T extends FakeElement | FakeText>(child: T): T {
    const index = this.childNodes.indexOf(child);

    if (index === -1) {
      throw new Error('Child not found');
    }

    this.childNodes.splice(index, 1);
    child.parentNode = null;

    return child;
  }

  insertBefore<T extends FakeElement | FakeText>(
    newChild: T,
    referenceChild: FakeElement | FakeText | null,
  ): T {
    if (referenceChild === null) {
      return this.appendChild(newChild);
    }

    const index = this.childNodes.indexOf(referenceChild);

    if (index === -1) {
      throw new Error('Reference child not found');
    }

    newChild.parentNode = this;
    this.childNodes.splice(index, 0, newChild);

    return newChild;
  }
  replaceChildren(...nodes: (FakeElement | FakeText)[]): void {
    for (const old of this.childNodes) old.parentNode = null;
    this.childNodes = [];
    for (const node of nodes) this.appendChild(node);
  }

  get textContent(): string {
    return this.childNodes.map((c) => c.textContent).join('');
  }

  /** Number of listeners per event, to check none are leaked. */
  readonly listenerCount = new Map<string, number>();
  override addEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    super.addEventListener(type, listener);
    this.listenerCount.set(type, (this.listenerCount.get(type) ?? 0) + 1);
  }
  override removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    super.removeEventListener(type, listener);
    this.listenerCount.set(type, (this.listenerCount.get(type) ?? 0) - 1);
  }
}

/** Serializes a fake node to HTML (attributes in insertion order). */
export function toHTML(node: unknown): string {
  if (node instanceof FakeText) return node.data;
  if (!(node instanceof FakeElement)) throw new Error(`not a fake node: ${String(node)}`);
  const tag = node.tagName.toLowerCase();
  const attrs = [...node.attributes].map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${v}"`)).join('');
  return `<${tag}${attrs}>${node.childNodes.map(toHTML).join('')}</${tag}>`;
}

/** Installs a fake `document` on globalThis. Returns a function that removes it. */
export function installFakeDom(): () => void {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const document = {
    createElement: (tag: string) => new FakeElement(tag),
    createTextNode: (data: string) => new FakeText(data),
  };
  Object.defineProperty(globalThis, 'document', { value: document, configurable: true, writable: true });
  return () => {
    if (saved) Object.defineProperty(globalThis, 'document', saved);
    else delete (globalThis as Record<string, unknown>).document;
  };
}
