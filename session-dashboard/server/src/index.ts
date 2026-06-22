import express from 'express';
import cors from 'cors';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import './db.js'; // initialize DB + schema on boot
import { projects } from './routes/projects.js';
import { commands } from './routes/commands.js';
import { sessions } from './routes/sessions.js';
import { terminal } from './routes/terminal.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4317;

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'fleetdeck' }));
app.use('/api/projects', projects);
app.use('/api/commands', commands);
app.use('/api/sessions', sessions);
app.use('/api', terminal); // /api/launch/*, /api/detect, /api/env

// Serve the built client in production (client builds to ../../client/dist).
const clientDist = join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(join(clientDist, 'index.html')));
}

app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
);

app.listen(PORT, () => {
  console.log(`\n  FleetDeck server → http://localhost:${PORT}\n`);
});
