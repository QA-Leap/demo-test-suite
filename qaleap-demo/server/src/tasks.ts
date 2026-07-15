import { Router, Request, Response } from 'express';
import { ok, err, isStatus, isPriority, Priority } from './types';
import * as store from './store';

const router = Router();

// "Fixed mode" (bugs disabled) is on when the request carries the X-Demo-Fixed:1
// header (set by the client toggle) OR the server was started with DEMO_FIXED=1.
function isFixed(req: Request): boolean {
  return req.header('x-demo-fixed') === '1' || process.env.DEMO_FIXED === '1';
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) ? id : null;
}

// GET /api/tasks?status=
router.get('/', (req: Request, res: Response) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  return res.status(200).json(ok(store.list(status, isFixed(req))));
});

// GET /api/tasks/:id
router.get('/:id', (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json(err('Task not found'));
  const task = store.get(id);
  if (!task) return res.status(404).json(err('Task not found'));
  return res.status(200).json(ok(task));
});

// POST /api/tasks
router.post('/', (req: Request, res: Response) => {
  const body = req.body ?? {};
  const { title, description, priority } = body;

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json(err('Title is required'));
  }
  if (priority !== undefined && !isPriority(priority)) {
    return res.status(400).json(err('Invalid priority'));
  }

  const task = store.create({
    title: title.trim(),
    description: typeof description === 'string' ? description : '',
    priority: (isPriority(priority) ? priority : 'medium') as Priority,
  });
  return res.status(201).json(ok(task));
});

// PUT /api/tasks/:id
router.put('/:id', (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json(err('Task not found'));

  const body = req.body ?? {};
  const { title, description, priority, status } = body;

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json(err('Title is required'));
  }
  if (!isPriority(priority)) {
    return res.status(400).json(err('Invalid priority'));
  }
  if (status !== undefined && !isStatus(status)) {
    return res.status(400).json(err('Invalid status'));
  }

  const task = store.update(id, {
    title: title.trim(),
    description: typeof description === 'string' ? description : '',
    priority,
    status: isStatus(status) ? status : undefined,
  });
  if (!task) return res.status(404).json(err('Task not found'));
  return res.status(200).json(ok(task));
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json(err('Task not found'));

  const status = (req.body ?? {}).status;
  if (!isStatus(status)) {
    return res.status(400).json(err('Invalid status'));
  }

  const task = store.setStatus(id, status);
  if (!task) return res.status(404).json(err('Task not found'));
  return res.status(200).json(ok(task));
});

// DELETE /api/tasks/:id
router.delete('/:id', (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json(err('Task not found'));
  const removed = store.remove(id);
  if (!removed) return res.status(404).json(err('Task not found'));
  return res.status(200).json(ok({ id }));
});

export default router;
