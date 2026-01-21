import { Task as PrismaTask } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Repository Pattern
 * データアクセス層を抽象化し、ビジネスロジックとデータ永続化を分離します。
 * これにより、データソースの変更が容易になり、テストも簡単になります。
 */

export interface ITaskRepository {
  findAll(): Promise<PrismaTask[]>;
  findById(id: number): Promise<PrismaTask | null>;
  create(data: TaskCreateData): Promise<PrismaTask>;
  update(id: number, data: TaskUpdateData): Promise<PrismaTask>;
  delete(id: number): Promise<void>;
  updateSortOrders(updates: { id: number; sortOrder: number }[]): Promise<void>;
  incrementAllSortOrders(): Promise<void>;
  toggleComplete(id: number): Promise<PrismaTask>;
}

export interface TaskCreateData {
  title: string;
  description: string | null;
  sortOrder: number;
}

export interface TaskUpdateData {
  title?: string;
  description?: string | null;
}

/**
 * PrismaTaskRepository
 * Prismaを使用したTaskRepositoryの実装
 * 他のORMやデータソースに切り替える場合は、このクラスだけを変更すればよい
 */
export class PrismaTaskRepository implements ITaskRepository {
  async findAll(): Promise<PrismaTask[]> {
    return await prisma.task.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }

  async findById(id: number): Promise<PrismaTask | null> {
    return await prisma.task.findUnique({
      where: { id },
    });
  }

  async create(data: TaskCreateData): Promise<PrismaTask> {
    return await prisma.task.create({
      data,
    });
  }

  async update(id: number, data: TaskUpdateData): Promise<PrismaTask> {
    return await prisma.task.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.task.delete({
      where: { id },
    });
  }

  async updateSortOrders(updates: { id: number; sortOrder: number }[]): Promise<void> {
    await prisma.$transaction(
      updates.map((update) =>
        prisma.task.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        })
      )
    );
  }

  async incrementAllSortOrders(): Promise<void> {
    await prisma.task.updateMany({
      data: { sortOrder: { increment: 1 } },
    });
  }

  async toggleComplete(id: number): Promise<PrismaTask> {
    const task = await this.findById(id);
    if (!task) {
      throw new Error("Task not found");
    }

    return await prisma.task.update({
      where: { id },
      data: { isCompleted: !task.isCompleted },
    });
  }
}

/**
 * Singleton Pattern
 * リポジトリのインスタンスを一つだけ保持する
 */
let taskRepositoryInstance: ITaskRepository | null = null;

export function getTaskRepository(): ITaskRepository {
  if (!taskRepositoryInstance) {
    taskRepositoryInstance = new PrismaTaskRepository();
  }
  return taskRepositoryInstance;
}
