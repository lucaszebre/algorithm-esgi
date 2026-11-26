import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { h } from '../src/framework/vdom.ts';
import { diff, patch } from '../src/algorithms/diff.ts';
import { render } from '../src/framework/renderer.ts';
import { installFakeDom, toHTML } from './fakeDom.ts';

describe('diff', () => {
  it('detects a text change', () => {
    const oldVNode = h('p', null, 'Bonjour');
    const newVNode = h('p', null, 'Bonsoir');

    const patches = diff(oldVNode, newVNode);

    assert.equal(patches.length, 1);
    assert.equal(patches[0].type, 'TEXT');
  });

  it('detects an element replacement', () => {
    const oldVNode = h('p', null, 'Bonjour');
    const newVNode = h('div', null, 'Bonjour');

    const patches = diff(oldVNode, newVNode);

    assert.equal(patches.length, 1);
    assert.equal(patches[0].type, 'REPLACE');
  });

  it('detects a property update', () => {
    const oldVNode = h('p', { class: 'old' });
    const newVNode = h('p', { class: 'new' });

    const patches = diff(oldVNode, newVNode);

    assert.equal(patches.length, 1);
    assert.equal(patches[0].type, 'PROPS');
  });

  it('detects a new child', () => {
    const oldVNode = h('ul', null, h('li', null, 'A'));
    const newVNode = h(
      'ul',
      null,
      h('li', null, 'A'),
      h('li', null, 'B'),
    );

    const patches = diff(oldVNode, newVNode);

    assert.ok(patches.some((item) => item.type === 'INSERT'));
  });

  it('detects a removed child', () => {
    const oldVNode = h(
      'ul',
      null,
      h('li', null, 'A'),
      h('li', null, 'B'),
    );
    const newVNode = h('ul', null, h('li', null, 'A'));

    const patches = diff(oldVNode, newVNode);

    assert.ok(patches.some((item) => item.type === 'REMOVE'));
  });
});

describe('patch', () => {
  it('updates text in the real DOM', () => {
    installFakeDom();

    const oldVNode = h('p', null, 'Bonjour');
    const newVNode = h('p', null, 'Bonsoir');

    const dom = render(oldVNode);
    const patches = diff(oldVNode, newVNode);

    patch(dom, patches);

    assert.equal(toHTML(dom), '<p>Bonsoir</p>');
  });

  it('replaces an element in the DOM', () => {
    installFakeDom();

    const oldVNode = h('div', null, h('p', null, 'Ancien'));
    const newVNode = h('div', null, h('span', null, 'Nouveau'));

    const dom = render(oldVNode);
    patch(dom, diff(oldVNode, newVNode));

    assert.equal(toHTML(dom), '<div><span>Nouveau</span></div>');
  });

  it('inserts a child in the DOM', () => {
    installFakeDom();

    const oldVNode = h('div', null, h('p', null, 'A'));
    const newVNode = h('div', null, h('p', null, 'A'), h('p', null, 'B'));

    const dom = render(oldVNode);
    patch(dom, diff(oldVNode, newVNode));

    assert.equal(toHTML(dom), '<div><p>A</p><p>B</p></div>');
  });

  it('removes a child from the DOM', () => {
    installFakeDom();

    const oldVNode = h('div', null, h('p', null, 'A'), h('p', null, 'B'));
    const newVNode = h('div', null, h('p', null, 'A'));

    const dom = render(oldVNode);
    patch(dom, diff(oldVNode, newVNode));

    assert.equal(toHTML(dom), '<div><p>A</p></div>');
  });
});