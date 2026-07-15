/**
 * Central test data & helpers.
 *
 * Anything a test needs to "know" (credentials, routes, expected seed values) lives here
 * so the specs stay declarative and readable — no magic strings scattered across files.
 */
import type { APIRequestContext } from '@playwright/test';

/** Where the authenticated browser session is persisted (see tests/auth.setup.ts). */
export const STORAGE_STATE = 'playwright/.auth/user.json';

/**
 * Credentials come from the environment (loaded from `.env` — see `.env.example`), with
 * safe fallbacks to the demo's public sandbox login so the suite still runs out of the box.
 * In a real engagement these would be injected from a secrets manager / CI secrets and the
 * fallbacks removed.
 */
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@qaleap.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo123';

export const credentials = {
  valid: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  wrongPassword: { email: DEMO_EMAIL, password: 'WrongPass1' },
  invalidEmail: { email: 'not-an-email', password: DEMO_PASSWORD },
  empty: { email: '', password: '' },
} as const;

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

/** The demo seeds 7 tasks with fixed ids 1..7 on every fresh start. */
export const seed = {
  count: 7,
  ids: [1, 2, 3, 4, 5, 6, 7],
  todoCount: 3,
  inProgressCount: 2,
  doneCount: 2,
} as const;

/** A representative payload for create/update tests. */
export const newTask = {
  title: 'Automated regression pass',
  description: 'Created by the QA Leap example suite.',
  priority: 'high' as TaskPriority,
};

export const apiRoutes = {
  login: '/api/login',
  tasks: '/api/tasks',
  task: (id: number | string) => `/api/tasks/${id}`,
  status: (id: number | string) => `/api/tasks/${id}/status`,
} as const;

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
}

/** Authenticate against the API and return a bearer token. */
export async function apiLogin(request: APIRequestContext): Promise<string> {
  const res = await request.post(apiRoutes.login, { data: credentials.valid });
  const body = await res.json();
  return body.data.token as string;
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

/** Create a task via the API and return it (used to set up mutation tests). */
export async function createTaskViaApi(
  request: APIRequestContext,
  token: string,
  data: Partial<typeof newTask> = {},
): Promise<Task> {
  const res = await request.post(apiRoutes.tasks, {
    headers: authHeader(token),
    data: { ...newTask, ...data },
  });
  return (await res.json()).data as Task;
}

/** Delete a task via the API — used to keep the shared store at its seeded baseline. */
export async function deleteTaskViaApi(
  request: APIRequestContext,
  token: string,
  id: number,
): Promise<void> {
  await request.delete(apiRoutes.task(id), { headers: authHeader(token) });
}
