import { getToken } from './auth';
import { isFixedMode } from './demoMode';
import { Task, Status, Priority } from './types';

const BASE = '/api';

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(pathname: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Toggle: fixed mode tells the server to disable the intentional bugs.
  if (isFixedMode()) headers['X-Demo-Fixed'] = '1';

  const res = await fetch(`${BASE}${pathname}`, { ...options, headers });
  const body = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || !body.success) {
    throw new ApiError(body.error?.message ?? 'Request failed', res.status);
  }
  return body.data as T;
}

export function login(email: string, password: string): Promise<{ token: string }> {
  return request<{ token: string }>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getTasks(status?: string): Promise<Task[]> {
  const q = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  return request<Task[]>(`/tasks${q}`);
}

export interface TaskInput {
  title: string;
  description: string;
  priority: Priority;
}

export function createTask(input: TaskInput): Promise<Task> {
  return request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) });
}

export function updateTask(id: number, input: TaskInput & { status?: Status }): Promise<Task> {
  return request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export function changeStatus(id: number, status: Status): Promise<Task> {
  return request<Task>(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteTask(id: number): Promise<{ id: number }> {
  return request<{ id: number }>(`/tasks/${id}`, { method: 'DELETE' });
}
