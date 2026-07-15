import type { TaskPriority } from '../fixtures/test-data';
import { BasePage } from './BasePage';
import { settle, type } from '../fixtures/pacing';

export interface TaskFormData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
}

/**
 * Page Object for the create / edit task modal. The same component backs both flows,
 * so a single object serves both.
 */
export class TaskModal extends BasePage {
  readonly root = this.page.getByTestId('task-modal');
  readonly titleInput = this.page.getByTestId('task-title-input');
  readonly descriptionInput = this.page.getByTestId('task-desc-input');
  readonly prioritySelect = this.page.getByTestId('task-priority-select');
  readonly submitButton = this.page.getByTestId('task-submit');
  readonly cancelButton = this.page.getByTestId('task-cancel');

  async waitUntilOpen(): Promise<void> {
    await this.root.waitFor({ state: 'visible' });
    await settle(this.page, 400); // let the opened modal register in the recording
  }

  async fill(data: TaskFormData): Promise<void> {
    if (data.title !== undefined) await type(this.titleInput, data.title);
    if (data.description !== undefined) await type(this.descriptionInput, data.description);
    if (data.priority !== undefined) await this.prioritySelect.selectOption(data.priority);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** Fill the form, submit, and wait for the modal to close. */
  async save(data: TaskFormData): Promise<void> {
    await this.fill(data);
    await settle(this.page); // show the completed form before submitting
    await this.submit();
    await this.root.waitFor({ state: 'hidden' });
    await settle(this.page); // show the resulting row
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.root.waitFor({ state: 'hidden' });
  }
}
