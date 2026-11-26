/**
 * Tests for the Virtual DOM: `h()` (src/framework/vdom.ts) and the renderer
 * (src/framework/renderer.ts).
 *
 * Run:   npm test
 *
 * The renderer runs against a fake DOM (./fakeDom.ts): no browser needed.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { h, text } from '../src/framework/vdom.ts';
import { mount, removeProp, render, setProp } from '../src/framework/renderer.ts';
import { FakeElement, installFakeDom, toHTML } from './fakeDom.ts';

describe('h', () => {
  it('creates an element node', () => {
    assert.deepEqual(h('div', { class: 'card' }), { kind: 'element', tag: 'div', props: { class: 'card' }, children: [] });
  });

  it('accepts null props', () => {
    assert.deepEqual(h('br', null).props, {});
  });

  it('turns strings and numbers into text nodes', () => {
    assert.deepEqual(h('p', null, 'Price: ', 42).children, [text('Price: '), text(42)]);
    assert.deepEqual(text(0), { kind: 'text', text: '0' });
  });

  it('flattens nested arrays of children', () => {
    const items = ['a', 'b'];
    const node = h('ul', null, h('li', null, 'first'), items.map((i) => h('li', null, i)), [[['deep']]]);
    assert.deepEqual(
      node.children.map((c) => (c.kind === 'text' ? c.text : c.children[0])),
      [text('first'), text('a'), text('b'), 'deep'],
    );
  });

  it('skips null, undefined and booleans so `cond && h(...)` works', () => {
    const show = false;
    const node = h('div', null, null, undefined, true, false, show && h('span', null), 'kept');
    assert.deepEqual(node.children, [text('kept')]);
  });

  it('keeps 0 and the empty string', () => {
    assert.deepEqual(h('p', null, 0, '').children, [text(0), text('')]);
  });

  it('moves `key` out of the props', () => {
    const node = h('li', { key: 7, class: 'row' });
    assert.equal(node.key, 7);
    assert.deepEqual(node.props, { class: 'row' });
    assert.equal('key' in h('li', null), false);
  });

  it('does not mutate the props object it is given', () => {
    const props = { key: 'x', id: 'a' };
    h('div', props);
    assert.deepEqual(props, { key: 'x', id: 'a' });
  });
});

describe('render', () => {
  let uninstall: () => void;
  before(() => {
    uninstall = installFakeDom();
  });
  after(() => uninstall());

  it('renders a text node', () => {
    assert.equal(toHTML(render(text('hello'))), 'hello');
  });

  it('renders nested elements recursively', () => {
    const tree = h('table', null,
      h('tr', null, h('td', null, 'Lamp'), h('td', null, 29.9)),
      h('tr', null, h('td', null, 'Book'), h('td', null, 12)),
    );
    assert.equal(
      toHTML(render(tree)),
      '<table><tr><td>Lamp</td><td>29.9</td></tr><tr><td>Book</td><td>12</td></tr></table>',
    );
  });

  it('sets attributes, class and style as strings', () => {
    const el = render(h('a', { href: '/product/1', class: 'link primary', style: 'color: red', tabindex: 0 }));
    assert.equal(toHTML(el), '<a href="/product/1" class="link primary" style="color: red" tabindex="0"></a>');
  });

  it('true sets an empty attribute, false / null / undefined leave it out', () => {
    const el = render(h('button', { disabled: true, hidden: false, title: null, id: undefined }));
    assert.equal(toHTML(el), '<button disabled></button>');
  });

  it('does not render `key` as an attribute', () => {
    assert.equal(toHTML(render(h('li', { key: 3 }, 'x'))), '<li>x</li>');
  });

  it('sets value / checked as DOM properties', () => {
    const input = render(h('input', { value: 'lamp', checked: true })) as unknown as FakeElement;
    assert.equal(input.value, 'lamp');
    assert.equal(input.checked, true);
  });

  it('attaches event listeners: onClick → click', () => {
    let clicks = 0;
    const el = render(h('button', { onClick: () => clicks++ }, 'Go')) as unknown as FakeElement;
    el.dispatchEvent(new Event('click'));
    el.dispatchEvent(new Event('click'));
    assert.equal(clicks, 2);
    assert.equal(el.hasAttribute('onClick'), false, 'handlers are not attributes');
  });

  it('works for multi-word events: onKeyDown → keydown', () => {
    let calls = 0;
    const el = render(h('input', { onKeyDown: () => calls++ })) as unknown as FakeElement;
    el.dispatchEvent(new Event('keydown'));
    assert.equal(calls, 1);
  });
});

describe('setProp / removeProp (used by patch)', () => {
  let uninstall: () => void;
  before(() => {
    uninstall = installFakeDom();
  });
  after(() => uninstall());

  it('replaces an event handler instead of adding a second one', () => {
    const calls: string[] = [];
    const el = render(h('button', { onClick: () => calls.push('old') })) as unknown as FakeElement;
    setProp(el as unknown as Element, 'onClick', () => calls.push('new'));
    el.dispatchEvent(new Event('click'));
    assert.deepEqual(calls, ['new']);
    assert.equal(el.listenerCount.get('click'), 1);
  });

  it('removes an event handler', () => {
    let clicks = 0;
    const el = render(h('button', { onClick: () => clicks++ })) as unknown as FakeElement;
    removeProp(el as unknown as Element, 'onClick');
    el.dispatchEvent(new Event('click'));
    assert.equal(clicks, 0);
  });

  it('updates and removes attributes', () => {
    const el = render(h('div', { class: 'a', title: 't' })) as unknown as Element;
    setProp(el, 'class', 'b');
    removeProp(el, 'title');
    setProp(el, 'hidden', false);
    assert.equal(toHTML(el), '<div class="b"></div>');
  });

  it('resets the value property when removed', () => {
    const input = render(h('input', { value: 'x' })) as unknown as FakeElement;
    removeProp(input as unknown as Element, 'value');
    assert.equal(input.value, '');
  });
});

describe('mount', () => {
  let uninstall: () => void;
  before(() => {
    uninstall = installFakeDom();
  });
  after(() => uninstall());

  it('replaces the content of the container', () => {
    const container = new FakeElement('div');
    container.appendChild(new FakeElement('p'));
    mount(h('h1', null, 'Home'), container as unknown as Element);
    assert.equal(toHTML(container), '<div><h1>Home</h1></div>');
    mount(h('h1', null, 'Products'), container as unknown as Element);
    assert.equal(toHTML(container), '<div><h1>Products</h1></div>');
  });
  it('updates the existing DOM node without replacing it', () => {
    const container = new FakeElement('div');

    mount(h('h1', null, 'Home'), container as unknown as Element);

    const originalNode = container.childNodes[0];

    mount(h('h1', null, 'Products'), container as unknown as Element);

    assert.equal(container.childNodes[0], originalNode);
    assert.equal(toHTML(container), '<div><h1>Products</h1></div>');
  });
});
