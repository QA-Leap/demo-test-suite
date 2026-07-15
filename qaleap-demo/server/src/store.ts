import { Task, Status, Priority } from './types';

// Fixed seed data — deterministic ids (1..7) and fixed ISO dates so the app is a
// stable test target (no random ids, no shifting "Created" values between restarts).
const seedTasks: Task[] = [
  {
    id: 1,
    title: 'Set up staging environment',
    description: 'Provision a staging server that mirrors production for QA runs.',
    status: 'done',
    priority: 'high',
    createdAt: '2026-01-05T09:00:00.000Z',
  },
  {
    id: 2,
    title: 'Write smoke test suite',
    description: 'Cover login and the core task CRUD flows with Playwright.',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2026-01-08T11:30:00.000Z',
  },
  {
    id: 3,
    title: 'Design bug report template',
    description: 'Standard template: steps, expected, actual, severity, evidence.',
    status: 'done',
    priority: 'medium',
    createdAt: '2026-01-10T14:15:00.000Z',
  },
  {
    id: 4,
    title: 'Add API contract tests',
    description: 'Validate status codes and the response envelope for every endpoint.',
    status: 'todo',
    priority: 'high',
    createdAt: '2026-01-12T08:45:00.000Z',
  },
  {
    id: 5,
    title: 'Configure visual regression',
    description: 'Baseline screenshots for the tasks page across breakpoints.',
    status: 'todo',
    priority: 'medium',
    createdAt: '2026-01-14T16:20:00.000Z',
  },
  {
    id: 6,
    title: 'Triage flaky tests',
    description: 'Investigate intermittent failures in the checkout journey.',
    status: 'in_progress',
    priority: 'low',
    createdAt: '2026-01-16T10:05:00.000Z',
  },
  {
    id: 7,
    title: 'Document onboarding runbook',
    description: 'How a new QA engineer sets up the project and runs the suite.',
    status: 'todo',
    priority: 'low',
    createdAt: '2026-01-18T13:40:00.000Z',
  },
];

// In-memory store. Resets on server restart (no database — by design).
let tasks: Task[] = seedTasks.map((t) => ({ ...t }));
let nextId = 8;

export function resetStore(): void {
  tasks = seedTasks.map((t) => ({ ...t }));
  nextId = 8;
}

export function list(status?: string, fixed = false): Task[] {
  const sorted = [...tasks].sort((a, b) => a.id - b.id);
  if (!status) return sorted;

  // BUG-108 (secondary): status filter is a case-sensitive exact match. Stored
  // values are lowercase, so `?status=DONE` returns [] instead of the done tasks.
  // The UI only ever sends lowercase, so the UI path looks fine — API tests with an
  // uppercase value catch the contract break. Fixed mode normalizes case on both sides.
  if (fixed) {
    return sorted.filter((t) => t.status.toLowerCase() === status.toLowerCase());
  }
  return sorted.filter((t) => t.status === status);
}

export function get(id: number): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export interface CreateInput {
  title: string;
  description: string;
  priority: Priority;
}

export function create(input: CreateInput): Task {
  const task: Task = {
    id: nextId++,
    title: input.title,
    description: input.description,
    priority: input.priority,
    status: 'todo',
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  return task;
}

export interface UpdateInput {
  title: string;
  description: string;
  priority: Priority;
  status?: Status;
}

export function update(id: number, input: UpdateInput): Task | undefined {
  const task = tasks.find((t) => t.id === id);
  if (!task) return undefined;
  task.title = input.title;
  task.description = input.description;
  task.priority = input.priority;
  if (input.status) task.status = input.status;
  return task;
}

export function setStatus(id: number, status: Status): Task | undefined {
  const task = tasks.find((t) => t.id === id);
  if (!task) return undefined;
  task.status = status;
  return task;
}

export function remove(id: number): boolean {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  tasks.splice(idx, 1);
  return true;
}
