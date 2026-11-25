import { defineConfig } from 'vite';

// Only Vite is allowed: no plugins. The default `appType: 'spa'` already
// serves index.html for every route, which the History API router relies on.
export default defineConfig({});
