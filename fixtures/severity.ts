import { allure } from 'allure-playwright';

/**
 * Allure severity derived from the test-case priority (see artifacts/test-cases.md):
 * P1 → critical, P2 → normal, P3 → minor. Tests without a documented TC default to normal.
 */
const SEVERITY_BY_TC: Record<string, string> = {
  'TC-001': 'critical',
  'TC-002': 'critical',
  'TC-003': 'normal',
  'TC-004': 'minor',
  'TC-005': 'critical',
  'TC-006': 'normal',
  'TC-007': 'critical',
  'TC-008': 'normal',
  'TC-009': 'normal',
  'TC-010': 'minor',
  'TC-011': 'critical',
  'TC-API-001': 'critical',
  'TC-API-002': 'critical',
  'TC-API-003': 'normal',
  'TC-API-004': 'normal',
};

/** Tag the current test's Allure severity from the `[TC-xxx]` id in its title. */
export function applySeverity(title: string): void {
  const m = title.match(/\[(TC-[A-Za-z0-9-]+)\]/);
  allure.severity((m && SEVERITY_BY_TC[m[1]]) || 'normal');
}
