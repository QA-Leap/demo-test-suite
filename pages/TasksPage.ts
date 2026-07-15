import { Locator } from '@playwright/test';
import { TaskModal, TaskFormData } from './TaskModal';
import type { TaskStatus } from '../fixtures/test-data';
import { BasePage } from './BasePage';
import { settle } from '../fixtures/pacing';

type FilterValue = 'all' | TaskStatus;

/**
 * Page Object for the main tasks screen.
 *
 * Row-level actions are located *within the row* (by title) using `data-testid`
 * prefixes, so they work for freshly created tasks whose id isn't known up front.
 */
export class TasksPage extends BasePage {
  readonly table = this.page.getByTestId('task-table');
  readonly rows = this.table.locator('tbody tr[data-testid^="task-row-"]');
  readonly createButton = this.page.getByTestId('create-task-btn');
  readonly taskCount = this.page.getByTestId('task-count');
  readonly logoutButton = this.page.getByTestId('nav-logout');
  readonly modeToggle = this.page.getByTestId('mode-toggle');

  async goto(): Promise<void> {
    await this.page.goto('/tasks');
    await this.table.waitFor();
  }

  /** A single task row located by its (unique) title. */
  row(title: string): Locator {
    return this.rows.filter({ hasText: title });
  }

  priorityCell(title: string): Locator {
    return this.row(title).locator('[data-testid^="task-priority-"]');
  }

  statusCell(title: string): Locator {
    return this.row(title).locator('[data-testid^="task-status-"]');
  }

  async openCreateModal(): Promise<TaskModal> {
    await this.createButton.click();
    const modal = new TaskModal(this.page);
    await modal.waitUntilOpen();
    return modal;
  }

  async createTask(data: TaskFormData): Promise<void> {
    const modal = await this.openCreateModal();
    await modal.save(data);
  }

  async editTask(title: string, data: TaskFormData): Promise<void> {
    await this.row(title).locator('[data-testid^="edit-task-"]').click();
    const modal = new TaskModal(this.page);
    await modal.waitUntilOpen();
    await modal.save(data);
  }

  async deleteTask(title: string): Promise<void> {
    await this.row(title).locator('[data-testid^="delete-task-"]').click();
    const dialog = this.page.getByTestId('delete-dialog');
    await dialog.waitFor();
    await settle(this.page, 400); // show the confirm dialog
    await this.page.getByTestId('delete-confirm').click();
    await dialog.waitFor({ state: 'hidden' });
    await settle(this.page); // show the row gone
  }

  async changeStatus(title: string, status: TaskStatus): Promise<void> {
    await this.row(title).locator('[data-testid^="status-select-"]').selectOption(status);
    await settle(this.page); // show the updated status badge
  }

  async filterBy(value: FilterValue): Promise<void> {
    await this.page.getByTestId(`status-filter-${value}`).click();
    await settle(this.page); // show the filtered list
  }

  /** The number shown in the "N tasks" counter. */
  async count(): Promise<number> {
    const text = (await this.taskCount.textContent()) ?? '';
    return Number.parseInt(text, 10);
  }

  /** Ids of all currently listed rows, in display order. */
  async ids(): Promise<number[]> {
    return this.rows.evaluateAll((els) =>
      els.map((el) => Number((el.getAttribute('data-testid') ?? '').replace('task-row-', ''))),
    );
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
