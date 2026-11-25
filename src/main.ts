/**
 * Entry point. Once the router (#3) and the renderer (#7) exist, this file
 * registers the routes and starts the router.
 */

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app container not found');

app.textContent = 'Algo Framework: project set up. Pages are coming soon.';
