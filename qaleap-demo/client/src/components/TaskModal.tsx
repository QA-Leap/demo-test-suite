import { useState, useRef } from 'react';
import { Task, Priority, PRIORITY_LABELS } from '../types';
import * as api from '../api';
import { isFixedMode } from '../demoMode';

export default function TaskModal({
  task,
  onSaved,
  onCancel,
}: {
  task: Task | null; // null = create, otherwise edit
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = task !== null;
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);

  const fixed = isFixedMode();

  async function handleSubmit() {
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    // BUG-107 (flagship): in the default (buggy) mode there is NO in-flight guard,
    // so a fast double-click on "Create task" fires the request twice → two
    // identical tasks (the server has no idempotency). Fixed mode adds the guard
    // below (a ref so it's immune to React's async state batching).
    if (fixed && inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);

    try {
      if (isEdit && task) {
        await api.updateTask(task.id, { title: title.trim(), description, priority });
      } else {
        await api.createTask({ title: title.trim(), description, priority });
      }
      onSaved();
    } catch (err) {
      const message = err instanceof api.ApiError ? err.message : 'Could not save the task.';
      setError(message);
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div className="modal" data-testid="task-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{isEdit ? 'Edit task' : 'Create task'}</h2>

        <label className="field">
          <span className="field-label">Title</span>
          <input
            className="input"
            data-testid="task-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Write regression suite"
          />
        </label>

        <label className="field">
          <span className="field-label">Description</span>
          <textarea
            className="input textarea"
            data-testid="task-desc-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional details…"
          />
        </label>

        <label className="field">
          <span className="field-label">Priority</span>
          <select
            className="input select"
            data-testid="task-priority-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <div className="alert-error" data-testid="task-form-error" role="alert">
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" data-testid="task-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            data-testid="task-submit"
            onClick={handleSubmit}
            disabled={fixed && submitting}
          >
            {isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </div>
    </div>
  );
}
