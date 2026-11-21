/**
 * Custom reporter for `node --test`: a coloured tree of the tests, then a
 * summary and a detailed list of the failures (input / expected / received).
 *
 * Used by `npm test` via `--test-reporter=./tests/reporter.ts`.
 * Fully-passing suites are folded; run with VERBOSE=1 to list every test.
 */
import { styleText } from 'node:util';

type Color = Parameters<typeof styleText>[0];
const paint = (color: Color, text: string) => styleText(color, text);

interface TestEvent {
  type: string;
  data: {
    name: string;
    nesting: number;
    skip?: string | boolean;
    todo?: string | boolean;
    details?: { duration_ms?: number; type?: string; error?: { cause?: unknown; message?: string } };
  };
}

interface Node {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  skipReason?: string;
  isSuite: boolean;
  durationMs: number;
  error?: unknown;
  children: Node[];
}

function errorText(error: unknown): string {
  const err = (error as { cause?: unknown })?.cause ?? error;
  if (err instanceof Error) {
    if (err.name !== 'AssertionError') return `${err.name}: ${err.message}`;
    // Our own messages already show expected / received: drop Node's extra diff.
    return err.message.split('\n+ actual - expected')[0].replace(/\n\n[^\n]* !== [^\n]*\n*$/, '').trimEnd();
  }
  return String(err);
}

function line(node: Node, depth: number, out: string[]) {
  const indent = '  '.repeat(depth);

  if (node.isSuite) {
    const leaves = countLeaves(node);
    // A suite whose tests were all skipped is collapsed into one line.
    if (leaves.total > 0 && leaves.skip === leaves.total) {
      out.push(`${indent}${paint('yellow', '○')} ${paint('bold', node.name)} ${paint('yellow', `(${leaves.total} skipped${node.children[0]?.skipReason ? `: ${node.children[0].skipReason}` : ''})`)}`);
      return;
    }
    const icon = leaves.fail > 0 ? paint('red', '✖') : paint('green', '✔');
    const count = paint(leaves.fail > 0 ? 'red' : 'gray', `(${leaves.pass}/${leaves.total - leaves.skip} passed)`);
    out.push(`${indent}${icon} ${paint('bold', node.name)} ${count}`);
    // Suites where everything passed stay folded; set VERBOSE=1 to unfold them.
    if (leaves.fail === 0 && depth > 0 && !process.env.VERBOSE) return;
    for (const child of node.children) line(child, depth + 1, out);
    return;
  }

  if (node.status === 'pass') out.push(`${indent}${paint('green', '✔')} ${node.name}`);
  else if (node.status === 'skip') out.push(`${indent}${paint('yellow', '○')} ${paint('gray', node.name)}`);
  else out.push(`${indent}${paint('red', '✖')} ${paint('red', node.name)}`);
}

function countLeaves(node: Node): { total: number; pass: number; fail: number; skip: number } {
  if (!node.isSuite) {
    return { total: 1, pass: +(node.status === 'pass'), fail: +(node.status === 'fail'), skip: +(node.status === 'skip') };
  }
  const sum = { total: 0, pass: 0, fail: 0, skip: 0 };
  for (const child of node.children) {
    const c = countLeaves(child);
    sum.total += c.total; sum.pass += c.pass; sum.fail += c.fail; sum.skip += c.skip;
  }
  return sum;
}

function failures(node: Node, path: string[], out: { path: string; error: unknown }[]) {
  const here = [...path, node.name];
  if (!node.isSuite && node.status === 'fail') out.push({ path: here.join(' › '), error: node.error });
  for (const child of node.children) failures(child, here, out);
}

export default async function* reporter(source: AsyncIterable<TestEvent>) {
  // Children finish before their parent, so we keep the finished nodes of
  // each nesting level until the parent arrives.
  const pending: Node[][] = [];
  const roots: Node[] = [];
  const started = Date.now();

  for await (const event of source) {
    if (event.type !== 'test:pass' && event.type !== 'test:fail') continue;
    const { name, nesting, skip, todo, details } = event.data;
    const children = pending[nesting + 1] ?? [];
    pending[nesting + 1] = [];
    const node: Node = {
      name,
      status: event.type === 'test:fail' ? 'fail' : skip || todo ? 'skip' : 'pass',
      skipReason: typeof skip === 'string' ? skip : undefined,
      isSuite: details?.type === 'suite' || children.length > 0,
      durationMs: details?.duration_ms ?? 0,
      error: details?.error,
      children,
    };
    if (nesting === 0) roots.push(node);
    else (pending[nesting] ??= []).push(node);
  }

  const out: string[] = [''];
  for (const root of roots) line(root, 0, out);

  const total = { total: 0, pass: 0, fail: 0, skip: 0 };
  for (const root of roots) {
    const c = countLeaves(root);
    total.total += c.total; total.pass += c.pass; total.fail += c.fail; total.skip += c.skip;
  }

  const failed: { path: string; error: unknown }[] = [];
  for (const root of roots) failures(root, [], failed);

  if (failed.length > 0) {
    out.push('', paint(['bgRed', 'white', 'bold'], ` ${failed.length} FAILED `), '');
    failed.forEach((f, i) => {
      out.push(paint(['red', 'bold'], `${i + 1}) ${f.path}`));
      for (const l of errorText(f.error).split('\n')) out.push(`   ${l}`);
      out.push('');
    });
  }

  const parts = [
    paint('green', `${total.pass} passed`),
    total.fail ? paint('red', `${total.fail} failed`) : paint('gray', '0 failed'),
    total.skip ? paint('yellow', `${total.skip} skipped`) : paint('gray', '0 skipped'),
  ];
  const badge = total.fail === 0 && total.skip === 0
    ? paint(['bgGreen', 'black', 'bold'], ' ALL PASS ')
    : paint(['bgRed', 'white', 'bold'], ' NOT YET ');
  out.push('', `${badge}  ${parts.join(paint('gray', ' · '))}  ${paint('gray', `of ${total.total} tests, ${Date.now() - started} ms`)}`, '');

  yield out.join('\n') + '\n';
}
