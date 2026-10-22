# Algo Framework — ESGI Algorithmics Exam

A frontend framework written in TypeScript **from scratch** (no React, Vue or any external library) that applies the algorithms from the course: stack, recursion, searching and sorting.

The only tool allowed is **Vite.js** as the bundler. No external Node.js modules.

The full assignment is in [`Sujet.pdf`](./Sujet.pdf).

## Team

| Member | GitHub |
| ------ | ------ |
| Lucas  | [@lucaszebre](https://github.com/lucaszebre) |
| Sorya  | [@Paulineente](https://github.com/Paulineente) |

Work is tracked in issues on the [project board](https://github.com/lucaszebre/algorithm-esgi/projects).

## Pages

| Page            | Route          | Description                       |
| --------------- | -------------- | --------------------------------- |
| Home            | `/`            | App presentation + links          |
| Product list    | `/products`    | Table with search + sorting       |
| Product detail  | `/product/:id` | Full product sheet                |

## Patterns

| Pattern                          | File                          | Course session        |
| -------------------------------- | ----------------------------- | --------------------- |
| Stack navigation (History API)   | `src/router/stackRouter.ts`   | Session 2 (Stack)     |
| Virtual DOM (hyperscript `h`)    | `src/framework/vdom.ts`       | Session 3 (Recursion) |
| Renderer (VNode → DOM)           | `src/framework/renderer.ts`   | Session 3 (Recursion) |
| Diffing / Patching               | `src/algorithms/diff.ts`      | Session 3 (Recursion) |
| Insertion / quick / merge sort   | `src/algorithms/sorting.ts`   | Session 5 (Sorting)   |
| Linear / binary search           | `src/algorithms/search.ts`    | Session 4 (Search)    |

## Project structure

```
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts
    ├── types/index.ts
    ├── data/products.ts
    ├── algorithms/
    │   ├── sorting.ts
    │   ├── search.ts
    │   └── diff.ts
    ├── framework/
    │   ├── vdom.ts
    │   └── renderer.ts
    ├── router/stackRouter.ts
    └── pages/
        ├── home.ts
        ├── productList.ts
        └── productDetail.ts
```

## Getting started

```bash
npm install

# Dev server
npx vite

# Type check
npx tsc --noEmit

# Production build
npx vite build
```

## Workflow

1. Pick an issue assigned to you and move it to **In Progress** on the board.
2. Create a branch from `main`: `feat/<issue-number>-short-name`.
3. Open a pull request that references the issue (`Closes #<n>`), and ask the other member to review it.
4. Before merging, make sure `npx tsc --noEmit` passes.
