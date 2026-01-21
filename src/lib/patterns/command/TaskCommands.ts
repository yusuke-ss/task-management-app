import { Task as PrismaTask } from "@prisma/client";
import { ITaskRepository } from "../repository/TaskRepository";
import { ValidationResult } from "../strategy/ValidationStrategy";

/**
 * Command Pattern
 * リクエストをオブジェクトとしてカプセル化します。
 * これにより、リクエストのパラメータ化、キューイング、ロギング、
 * アンドゥ操作などが可能になります。
 */

export interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ICommand<T = unknown> {
  execute(): Promise<CommandResult<T>>;
}

/**
 * AbstractTaskCommand
 * タスクコマンドの基底クラス
 */
export abstract class AbstractTaskCommand<T = unknown> implements ICommand<T> {
  constructor(protected repository: ITaskRepository) {}

  abstract execute(): Promise<CommandResult<T>>;

  protected createSuccessResult<R>(data: R): CommandResult<R> {
    return { success: true, data };
  }

  protected createErrorResult(error: string): CommandResult<T> {
    return { success: false, error };
  }
}

/**
 * GetAllTasksCommand
 * すべてのタスクを取得するコマンド
 */
export class GetAllTasksCommand extends AbstractTaskCommand<PrismaTask[]> {
  async execute(): Promise<CommandResult<PrismaTask[]>> {
    try {
      const tasks = await this.repository.findAll();
      return this.createSuccessResult(tasks);
    } catch (error) {
      return this.createErrorResult("タスクの取得に失敗しました");
    }
  }
}

/**
 * GetTaskByIdCommand
 * IDでタスクを取得するコマンド
 */
export class GetTaskByIdCommand extends AbstractTaskCommand<PrismaTask> {
  constructor(
    repository: ITaskRepository,
    private taskId: number
  ) {
    super(repository);
  }

  async execute(): Promise<CommandResult<PrismaTask>> {
    try {
      const task = await this.repository.findById(this.taskId);
      if (!task) {
        return this.createErrorResult("タスクが見つかりません");
      }
      return this.createSuccessResult(task);
    } catch (error) {
      return this.createErrorResult("タスクの取得に失敗しました");
    }
  }
}

/**
 * CreateTaskCommand
 * 新しいタスクを作成するコマンド
 */
export class CreateTaskCommand extends AbstractTaskCommand<PrismaTask> {
  constructor(
    repository: ITaskRepository,
    private title: string,
    private description: string | null,
    private validator?: (title: string, description: string | null) => ValidationResult
  ) {
    super(repository);
  }

  async execute(): Promise<CommandResult<PrismaTask>> {
    try {
      // バリデーション
      if (this.validator) {
        const validationResult = this.validator(this.title, this.description);
        if (!validationResult.isValid) {
          return this.createErrorResult(validationResult.error || "バリデーションエラー");
        }
      }

      // 既存タスクのsortOrderをインクリメント
      await this.repository.incrementAllSortOrders();

      // タスク作成
      const task = await this.repository.create({
        title: this.title.trim(),
        description: this.description?.trim() || null,
        sortOrder: 0,
      });

      return this.createSuccessResult(task);
    } catch (error) {
      return this.createErrorResult("タスクの作成に失敗しました");
    }
  }
}

/**
 * UpdateTaskCommand
 * タスクを更新するコマンド
 */
export class UpdateTaskCommand extends AbstractTaskCommand<PrismaTask> {
  constructor(
    repository: ITaskRepository,
    private taskId: number,
    private title: string,
    private description: string | null,
    private validator?: (title: string, description: string | null) => ValidationResult
  ) {
    super(repository);
  }

  async execute(): Promise<CommandResult<PrismaTask>> {
    try {
      // タスクの存在確認
      const existingTask = await this.repository.findById(this.taskId);
      if (!existingTask) {
        return this.createErrorResult("タスクが見つかりません");
      }

      // バリデーション
      if (this.validator) {
        const validationResult = this.validator(this.title, this.description);
        if (!validationResult.isValid) {
          return this.createErrorResult(validationResult.error || "バリデーションエラー");
        }
      }

      // タスク更新
      const task = await this.repository.update(this.taskId, {
        title: this.title.trim(),
        description: this.description?.trim() || null,
      });

      return this.createSuccessResult(task);
    } catch (error) {
      return this.createErrorResult("タスクの更新に失敗しました");
    }
  }
}

/**
 * DeleteTaskCommand
 * タスクを削除するコマンド
 */
export class DeleteTaskCommand extends AbstractTaskCommand<{ message: string }> {
  constructor(
    repository: ITaskRepository,
    private taskId: number
  ) {
    super(repository);
  }

  async execute(): Promise<CommandResult<{ message: string }>> {
    try {
      // タスクの存在確認
      const existingTask = await this.repository.findById(this.taskId);
      if (!existingTask) {
        return this.createErrorResult("タスクが見つかりません");
      }

      // タスク削除
      await this.repository.delete(this.taskId);

      return this.createSuccessResult({ message: "タスクを削除しました" });
    } catch (error) {
      return this.createErrorResult("タスクの削除に失敗しました");
    }
  }
}

/**
 * ToggleTaskCommand
 * タスクの完了状態を切り替えるコマンド
 */
export class ToggleTaskCommand extends AbstractTaskCommand<PrismaTask> {
  constructor(
    repository: ITaskRepository,
    private taskId: number
  ) {
    super(repository);
  }

  async execute(): Promise<CommandResult<PrismaTask>> {
    try {
      const task = await this.repository.toggleComplete(this.taskId);
      return this.createSuccessResult(task);
    } catch (error) {
      return this.createErrorResult("タスクの状態更新に失敗しました");
    }
  }
}

/**
 * ReorderTasksCommand
 * タスクの並び順を変更するコマンド
 */
export class ReorderTasksCommand extends AbstractTaskCommand<{ message: string }> {
  constructor(
    repository: ITaskRepository,
    private updates: { id: number; sortOrder: number }[]
  ) {
    super(repository);
  }

  async execute(): Promise<CommandResult<{ message: string }>> {
    try {
      await this.repository.updateSortOrders(this.updates);
      return this.createSuccessResult({ message: "並び順を更新しました" });
    } catch (error) {
      return this.createErrorResult("並び順の更新に失敗しました");
    }
  }
}

/**
 * CommandInvoker
 * コマンドを実行するInvoker（Invokerパターン）
 */
export class CommandInvoker {
  private history: ICommand[] = [];

  async execute<T>(command: ICommand<T>): Promise<CommandResult<T>> {
    this.history.push(command);
    return await command.execute();
  }

  getHistory(): ICommand[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}
