import { TaskCreateData, TaskUpdateData } from "../repository/TaskRepository";

/**
 * Builder Pattern
 * 複雑なオブジェクトの構築プロセスをその表現から分離します。
 * 同じ構築プロセスで異なる表現を作成できるようにします。
 */

/**
 * TaskDataBuilder
 * タスクデータを段階的に構築するビルダー
 */
export class TaskDataBuilder {
  private title?: string;
  private description?: string | null;
  private sortOrder?: number;

  setTitle(title: string): this {
    this.title = title.trim();
    return this;
  }

  setDescription(description: string | null): this {
    this.description = description?.trim() || null;
    return this;
  }

  setSortOrder(sortOrder: number): this {
    this.sortOrder = sortOrder;
    return this;
  }

  buildCreateData(): TaskCreateData {
    if (!this.title) {
      throw new Error("タイトルは必須です");
    }
    if (this.sortOrder === undefined) {
      throw new Error("sortOrderは必須です");
    }

    return {
      title: this.title,
      description: this.description ?? null,
      sortOrder: this.sortOrder,
    };
  }

  buildUpdateData(): TaskUpdateData {
    const data: TaskUpdateData = {};

    if (this.title !== undefined) {
      data.title = this.title;
    }

    if (this.description !== undefined) {
      data.description = this.description;
    }

    return data;
  }

  reset(): this {
    this.title = undefined;
    this.description = undefined;
    this.sortOrder = undefined;
    return this;
  }
}

/**
 * TaskRequestBuilder
 * APIリクエストのボディを構築するビルダー
 */
export interface TaskRequest {
  title: string;
  description?: string | null;
}

export class TaskRequestBuilder {
  private request: Partial<TaskRequest> = {};

  setTitle(title: string): this {
    this.request.title = title.trim();
    return this;
  }

  setDescription(description: string | null | undefined): this {
    this.request.description = description?.trim() || null;
    return this;
  }

  build(): TaskRequest {
    if (!this.request.title) {
      throw new Error("タイトルは必須です");
    }

    return {
      title: this.request.title,
      description: this.request.description,
    };
  }

  reset(): this {
    this.request = {};
    return this;
  }
}

/**
 * FluentTaskBuilder
 * より読みやすいFluent Interfaceを持つビルダー
 */
export class FluentTaskBuilder {
  private data: {
    title?: string;
    description?: string | null;
    sortOrder?: number;
    isCompleted?: boolean;
  } = {};

  withTitle(title: string): this {
    this.data.title = title.trim();
    return this;
  }

  withDescription(description: string | null): this {
    this.data.description = description?.trim() || null;
    return this;
  }

  withoutDescription(): this {
    this.data.description = null;
    return this;
  }

  atPosition(sortOrder: number): this {
    this.data.sortOrder = sortOrder;
    return this;
  }

  asCompleted(): this {
    this.data.isCompleted = true;
    return this;
  }

  asPending(): this {
    this.data.isCompleted = false;
    return this;
  }

  build(): TaskCreateData {
    if (!this.data.title) {
      throw new Error("タイトルは必須です");
    }
    if (this.data.sortOrder === undefined) {
      throw new Error("sortOrderは必須です");
    }

    return {
      title: this.data.title,
      description: this.data.description ?? null,
      sortOrder: this.data.sortOrder,
    };
  }
}

/**
 * TaskBuilderDirector
 * Director Pattern - ビルダーを使用して特定のタイプのタスクを構築
 */
export class TaskBuilderDirector {
  constructor(private builder: TaskDataBuilder) {}

  constructNewTask(title: string, description: string | null): TaskCreateData {
    return this.builder
      .reset()
      .setTitle(title)
      .setDescription(description)
      .setSortOrder(0)
      .buildCreateData();
  }

  constructHighPriorityTask(title: string, description: string | null): TaskCreateData {
    return this.builder
      .reset()
      .setTitle(`[重要] ${title}`)
      .setDescription(description)
      .setSortOrder(0)
      .buildCreateData();
  }

  constructAppendTask(title: string, description: string | null, maxSortOrder: number): TaskCreateData {
    return this.builder
      .reset()
      .setTitle(title)
      .setDescription(description)
      .setSortOrder(maxSortOrder + 1)
      .buildCreateData();
  }
}
