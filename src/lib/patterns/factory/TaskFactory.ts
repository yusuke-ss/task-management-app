import { TaskCreateData } from "../repository/TaskRepository";

/**
 * Factory Pattern
 * オブジェクトの生成ロジックをカプセル化し、クライアントコードから分離します。
 * タスク作成のためのデータを標準化された形で提供します。
 */

export interface TaskInput {
  title: string;
  description?: string | null;
}

export abstract class TaskFactory {
  /**
   * タスク作成データを生成する抽象メソッド
   */
  abstract createTaskData(input: TaskInput): TaskCreateData;

  /**
   * 共通の前処理（トリミングなど）
   */
  protected preprocessInput(input: TaskInput): TaskInput {
    return {
      title: input.title.trim(),
      description: input.description?.trim() || null,
    };
  }
}

/**
 * StandardTaskFactory
 * 通常のタスクを作成するファクトリー
 * sortOrder: 0 で新しいタスクを最初に配置
 */
export class StandardTaskFactory extends TaskFactory {
  createTaskData(input: TaskInput): TaskCreateData {
    const processed = this.preprocessInput(input);
    return {
      title: processed.title,
      description: processed.description,
      sortOrder: 0,
    };
  }
}

/**
 * AppendTaskFactory
 * タスクを最後に追加するファクトリー
 */
export class AppendTaskFactory extends TaskFactory {
  constructor(private maxSortOrder: number) {
    super();
  }

  createTaskData(input: TaskInput): TaskCreateData {
    const processed = this.preprocessInput(input);
    return {
      title: processed.title,
      description: processed.description,
      sortOrder: this.maxSortOrder + 1,
    };
  }
}

/**
 * PriorityTaskFactory
 * 優先度付きタスクを作成するファクトリー（将来の拡張用）
 */
export class PriorityTaskFactory extends TaskFactory {
  constructor(private sortOrder: number) {
    super();
  }

  createTaskData(input: TaskInput): TaskCreateData {
    const processed = this.preprocessInput(input);
    return {
      title: processed.title,
      description: processed.description,
      sortOrder: this.sortOrder,
    };
  }
}

/**
 * TaskFactoryProvider
 * Singleton Pattern を使用してファクトリーインスタンスを管理
 */
export class TaskFactoryProvider {
  private static standardFactory: StandardTaskFactory | null = null;

  static getStandardFactory(): StandardTaskFactory {
    if (!this.standardFactory) {
      this.standardFactory = new StandardTaskFactory();
    }
    return this.standardFactory;
  }

  static getAppendFactory(maxSortOrder: number): AppendTaskFactory {
    return new AppendTaskFactory(maxSortOrder);
  }

  static getPriorityFactory(sortOrder: number): PriorityTaskFactory {
    return new PriorityTaskFactory(sortOrder);
  }
}
