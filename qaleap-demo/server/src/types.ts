export type Status = 'todo' | 'in_progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  createdAt: string; // ISO 8601
}

export function isStatus(x: unknown): x is Status {
  return x === 'todo' || x === 'in_progress' || x === 'done';
}

export function isPriority(x: unknown): x is Priority {
  return x === 'low' || x === 'medium' || x === 'high';
}

// Response envelope helpers — every endpoint uses these.
export function ok<T>(data: T) {
  return { success: true as const, data };
}

export function err(message: string) {
  return { success: false as const, error: { message } };
}
