import path from 'path';
import express from 'express';
import { login, requireAuth } from './auth';
import tasksRouter from './tasks';
import { err } from './types';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// --- API (mounted first so the SPA catch-all can never shadow it) ---
const api = express.Router();
api.post('/login', login);
api.use('/tasks', requireAuth, tasksRouter);

// Terminal API 404: unknown /api/* paths return JSON, never index.html.
api.use((_req, res) => {
  res.status(404).json(err('Not found'));
});

app.use('/api', api);

// --- Static client build ---
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// SPA fallback (Express 4 wildcard — safe because /api is already handled above).
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  const fixed = process.env.DEMO_FIXED === '1';
  console.log('');
  console.log(`  QA Leap demo · Task Manager`);
  console.log(`  App:      http://localhost:${PORT}`);
  console.log(`  API base: http://localhost:${PORT}/api`);
  console.log(`  Login:    demo@qaleap.com / Demo123`);
  console.log(
    fixed
      ? '  Mode:     FIXED (DEMO_FIXED=1) — intentional bugs disabled'
      : '  Mode:     BUGGY (default) — BUG-107 & BUG-108 active · add ?fixed=1 to disable'
  );
  console.log('');
});
