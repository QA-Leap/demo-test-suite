import { Task } from '../types';

export default function DeleteConfirm({
  task,
  onConfirm,
  onCancel,
}: {
  task: Task;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div
        className="modal modal-sm"
        data-testid="delete-dialog"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Delete task</h2>
        <p className="modal-text">
          Are you sure you want to delete <strong>{task.title}</strong>? This can’t be undone.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-ghost"
            data-testid="delete-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            data-testid="delete-confirm"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
