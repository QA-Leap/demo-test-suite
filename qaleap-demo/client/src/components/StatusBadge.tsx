import { Status, STATUS_LABELS } from '../types';

export default function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>;
}
