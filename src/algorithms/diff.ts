import type { VNode, PropValue } from '../types';
import { render, setProp, removeProp } from '../framework/renderer.ts';

export type Patch =
  | {
      type: 'REPLACE';
      path: number[];
      vnode: VNode;
    }
  | {
      type: 'TEXT';
      path: number[];
      text: string;
    }
  | {
      type: 'PROPS';
      path: number[];
      updates: Record<string, PropValue>;
      removals: string[];
    }
  | {
      type: 'INSERT';
      path: number[];
      index: number;
      vnode: VNode;
    }
  | {
      type: 'REMOVE';
      path: number[];
      index: number;
    };

export function diff(oldVNode: VNode, newVNode: VNode): Patch[] {
  const patches: Patch[] = [];

  function compare(oldNode: VNode, newNode: VNode, path: number[]): void {
    // 1. Les types de nœuds sont différents
    if (oldNode.kind !== newNode.kind) {
      patches.push({ type: 'REPLACE', path, vnode: newNode });
      return;
    }

    // 2. Comparaison des nœuds texte
    if (oldNode.kind === 'text' && newNode.kind === 'text') {
      if (oldNode.text !== newNode.text) {
        patches.push({
          type: 'TEXT',
          path,
          text: newNode.text,
        });
      }
      return;
    }

    // À partir d'ici, les deux nœuds sont des éléments
    if (oldNode.kind !== 'element' || newNode.kind !== 'element') {
      return;
    }

    // 3. La balise ou la clé a changé : on remplace l'élément
    if (
      oldNode.tag !== newNode.tag ||
      oldNode.key !== newNode.key
    ) {
      patches.push({ type: 'REPLACE', path, vnode: newNode });
      return;
    }

    // 4. Comparaison des propriétés
    const updates: Record<string, PropValue> = {};
    const removals: string[] = [];

    for (const name of Object.keys(newNode.props)) {
      if (
        !Object.prototype.hasOwnProperty.call(oldNode.props, name) ||
        oldNode.props[name] !== newNode.props[name]
      ) {
        updates[name] = newNode.props[name];
      }
    }

    for (const name of Object.keys(oldNode.props)) {
      if (!Object.prototype.hasOwnProperty.call(newNode.props, name)) {
        removals.push(name);
      }
    }

    if (Object.keys(updates).length > 0 || removals.length > 0) {
      patches.push({
        type: 'PROPS',
        path,
        updates,
        removals,
      });
    }

    // 5. Comparaison récursive des enfants communs
    const commonLength = Math.min(
      oldNode.children.length,
      newNode.children.length,
    );

    for (let i = 0; i < commonLength; i++) {
      compare(oldNode.children[i], newNode.children[i], [...path, i]);
    }

    // 6. Suppression des enfants en trop (du dernier au premier)
    for (let i = oldNode.children.length - 1; i >= newNode.children.length; i--) {
      patches.push({ type: 'REMOVE', path, index: i });
    }

    // 7. Ajout des nouveaux enfants
    for (let i = oldNode.children.length; i < newNode.children.length; i++) {
      patches.push({
        type: 'INSERT',
        path,
        index: i,
        vnode: newNode.children[i],
      });
    }
  }

  compare(oldVNode, newVNode, []);

  return patches;
}

export function patch(dom: Node, patches: Patch[]): void {
  function getNode(path: number[]): Node {
    let current = dom;

    for (const index of path) {
      const child = current.childNodes[index];

      if (!child) {
        throw new Error(`patch: node not found at path ${path.join('.')}`);
      }

      current = child;
    }

    return current;
  }

  // Les patchs structurels sont appliqués après les autres.
  const structuralPatches = patches.filter(
    (item) => item.type === 'INSERT' || item.type === 'REMOVE',
  );

  const regularPatches = patches.filter(
    (item) => item.type !== 'INSERT' && item.type !== 'REMOVE',
  );

  for (const item of regularPatches) {
    const target = getNode(item.path);

    switch (item.type) {
      case 'REPLACE': {
        const parent = target.parentNode;

        if (!parent) {
          throw new Error('patch: cannot replace the root node');
        }

        parent.replaceChild(render(item.vnode), target);
        break;
      }

      case 'TEXT': {
        if (target.nodeType === 3) {
          (target as Text).data = item.text;
        } else {
          target.textContent = item.text;
        }
        break;
      }

      case 'PROPS': {
        if (target.nodeType !== 1) {
          throw new Error('patch: cannot update props on a non-element');
        }

        const element = target as Element;

        for (const name of item.removals) {
          removeProp(element, name);
        }

        for (const [name, value] of Object.entries(item.updates)) {
          setProp(element, name, value);
        }

        break;
      }
    }
  }

  // Regrouper les opérations structurelles par parent.
  const groups = new Map<string, {
    path: number[];
    operations: typeof structuralPatches;
  }>();

  for (const item of structuralPatches) {
    const key = JSON.stringify(item.path);
    const group = groups.get(key);

    if (group) {
      group.operations.push(item);
    } else {
      groups.set(key, {
        path: item.path,
        operations: [item],
      });
    }
  }

  for (const group of groups.values()) {
    const parent = getNode(group.path);

    // Supprimer du dernier index au premier.
    const removals = group.operations
      .filter((item) => item.type === 'REMOVE')
      .sort((a, b) => {
        if (a.type !== 'REMOVE' || b.type !== 'REMOVE') return 0;
        return b.index - a.index;
      });

    for (const item of removals) {
      if (item.type === 'REMOVE') {
        const child = parent.childNodes[item.index];

        if (child) {
          parent.removeChild(child);
        }
      }
    }

    // Ajouter les enfants à leur position finale.
    const insertions = group.operations
      .filter((item) => item.type === 'INSERT')
      .sort((a, b) => {
        if (a.type !== 'INSERT' || b.type !== 'INSERT') return 0;
        return a.index - b.index;
      });

    for (const item of insertions) {
      if (item.type === 'INSERT') {
        const newNode = render(item.vnode);
        const reference = parent.childNodes[item.index] ?? null;
        parent.insertBefore(newNode, reference);
      }
    }
  }
}