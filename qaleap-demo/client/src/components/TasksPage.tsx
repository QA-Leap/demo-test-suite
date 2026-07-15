import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { clearToken } from '../auth';
import { isFixedMode, setFixedMode } from '../demoMode';
import { Task, Status } from '../types';
import StatusFilter, { FilterValue } from './StatusFilter';
import TaskTable from './TaskTable';
import TaskModal from './TaskModal';
import DeleteConfirm from './DeleteConfirm';

export default function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [fixed, setFixed] = useState(isFixedMode());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getTasks(filter);
      setTasks(data);
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) {
        clearToken();
        navigate('/login', { replace: true });
        return;
      }
      setError('Could not load tasks.');
    } finally {
      setLoading(false);
    }
  }, [filter, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  function handleLogout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  function handleToggleMode() {
    const next = !fixed;
    setFixed(next);
    setFixedMode(next);
    load(); // re-fetch so the mode change takes effect immediately
  }

  async function handleStatusChange(task: Task, status: Status) {
    try {
      await api.changeStatus(task.id, status);
      load();
    } catch {
      setError('Could not change status.');
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    try {
      await api.deleteTask(target.id);
      load();
    } catch {
      setError('Could not delete task.');
    }
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function handleSaved() {
    closeModal();
    load();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <img className="brand-logo" src="/logo-frog.png" alt="" />
            <span className="brand-name">QA Leap</span>
            <span className="brand-divider">/</span>
            <span className="brand-app">Task Manager</span>
          </div>
          <div className="topbar-actions">
            <label
              className="mode-toggle"
              data-testid="mode-toggle"
              title="Toggle the intentional demo bugs on/off"
            >
              <input type="checkbox" checked={fixed} onChange={handleToggleMode} />
              <span className="switch" aria-hidden="true" />
              <span className="mode-toggle-label">{fixed ? 'Fixed mode' : 'Bug mode'}</span>
            </label>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              data-testid="nav-logout"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="page-head">
          <div>
            <h1 className="page-title">Tasks</h1>
            <p className="page-sub" data-testid="task-count">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            data-testid="create-task-btn"
            onClick={openCreate}
          >
            + Create task
          </button>
        </div>

        <div className="toolbar">
          <StatusFilter value={filter} onChange={setFilter} />
        </div>

        {error && (
          <div className="alert-error" data-testid="tasks-error">
            {error}
          </div>
        )}

        <TaskTable
          tasks={tasks}
          loading={loading}
          onEdit={openEdit}
          onDelete={setDeleting}
          onStatusChange={handleStatusChange}
        />
      </main>

      {modalOpen && <TaskModal task={editing} onSaved={handleSaved} onCancel={closeModal} />}
      {deleting && (
        <DeleteConfirm task={deleting} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
      )}
    </div>
  );
}
