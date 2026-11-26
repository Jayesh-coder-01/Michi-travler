import { createApp } from './app.js';
import { getConfig } from './config.js';
import { initDatabase } from './db.js';

const cfg = getConfig();
const db = initDatabase();
const app = createApp(db);

app.listen(cfg.port, () => {
  console.log(`MICHI full-stack server listening on http://localhost:${cfg.port}`);
});
