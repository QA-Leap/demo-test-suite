const KEY = 'qaleap_fixed_mode';

// "Fixed mode" disables the two intentional bugs. Off by default, so the app stays a
// stable, buggy-by-design test target. Enabled via `?fixed=1` (persisted) or the
// header toggle. `?fixed=0` forces it back off.
export function isFixedMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.has('fixed')) {
    const on = params.get('fixed') === '1';
    localStorage.setItem(KEY, on ? '1' : '0');
    return on;
  }
  return localStorage.getItem(KEY) === '1';
}

export function setFixedMode(on: boolean): void {
  localStorage.setItem(KEY, on ? '1' : '0');
}
