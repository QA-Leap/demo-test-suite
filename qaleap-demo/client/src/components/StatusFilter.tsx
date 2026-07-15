import { Status, STATUS_LABELS } from '../types';

export type FilterValue = 'all' | Status;

const OPTIONS: FilterValue[] = ['all', 'todo', 'in_progress', 'done'];

export default function StatusFilter({
  value,
  onChange,
}: {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  return (
    <div className="filter" data-testid="status-filter" role="tablist">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`filter-tab ${value === opt ? 'is-active' : ''}`}
          data-testid={`status-filter-${opt}`}
          role="tab"
          aria-selected={value === opt}
          onClick={() => onChange(opt)}
        >
          {opt === 'all' ? 'All' : STATUS_LABELS[opt]}
        </button>
      ))}
    </div>
  );
}
