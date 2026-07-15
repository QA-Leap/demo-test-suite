import { Task, Status, STATUS_LABELS, PRIORITY_LABELS } from '../types';
import StatusBadge from './StatusBadge';

const STATUS_ORDER: Status[] = ['todo', 'in_progress', 'done'];

function formatDate(iso: string): string {
  // Deterministic YYYY-MM-DD — never locale/timezone dependent.
  return iso.slice(0, 10);
}

export default function TaskTable({
  tasks,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  tasks: Task[];
  loading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: Status) => void;
}) {
  return (
    <div className="card table-card">
      <table className="table" data-testid="task-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Created</th>
            <th className="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="table-empty">
                Loading…
              </td>
            </tr>
          ) : tasks.length === 0 ? (
            <tr>
              <td colSpan={5} className="table-empty" data-testid="empty-state">
                No tasks to show.
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task.id} data-testid={`task-row-${task.id}`}>
                <td>
                  <div className="cell-title" data-testid={`task-title-${task.id}`}>
                    {task.title}
                  </div>
                  {task.description && <div className="cell-desc">{task.description}</div>}
                </td>
                <td data-testid={`task-status-${task.id}`}>
                  <StatusBadge status={task.status} />
                </td>
                <td>
                  <span className={`pill pill-${task.priority}`} data-testid={`task-priority-${task.id}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </td>
                <td className="cell-date" data-testid={`task-created-${task.id}`}>
                  {formatDate(task.createdAt)}
                </td>
                <td className="col-actions">
                  <div className="row-actions">
                    <select
                      className="input select select-sm"
                      data-testid={`status-select-${task.id}`}
                      value={task.status}
                      onChange={(e) => onStatusChange(task, e.target.value as Status)}
                      aria-label="Change status"
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      data-testid={`edit-task-${task.id}`}
                      onClick={() => onEdit(task)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-danger-ghost"
                      data-testid={`delete-task-${task.id}`}
                      onClick={() => onDelete(task)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
