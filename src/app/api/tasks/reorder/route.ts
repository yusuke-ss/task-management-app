import { NextResponse } from "next/server";
import { getTaskRepository } from "@/lib/patterns/repository/TaskRepository";
import {
  ReorderTasksCommand,
  CommandInvoker,
} from "@/lib/patterns/command/TaskCommands";
import { TaskValidators } from "@/lib/patterns/helpers/TaskValidators";
import { ResponseFactory } from "@/lib/patterns/decorator/ResponseDecorator";

/**
 * タスク並び替えAPI
 * GoFデザインパターンを適用:
 * - Repository Pattern: データアクセスの抽象化
 * - Command Pattern: 操作のカプセル化
 * - Singleton Pattern: リポジトリとインボーカーの管理
 * - Factory Pattern: レスポンス生成
 */

const repository = getTaskRepository();
const invoker = new CommandInvoker();

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { taskIds } = body;

    if (!Array.isArray(taskIds)) {
      return ResponseFactory.badRequest("taskIdsは配列である必要があります");
    }

    // taskIdsを{ id, sortOrder }の形式に変換
    const updates = taskIds.map((id: number, index: number) => ({
      id,
      sortOrder: index,
    }));

    // バリデーション
    const validationResult = TaskValidators.validateReorderData(updates);
    if (!validationResult.isValid) {
      return ResponseFactory.badRequest(validationResult.error || "バリデーションエラー");
    }

    // Command Pattern: 並び替えコマンド
    const command = new ReorderTasksCommand(repository, updates);
    const result = await invoker.execute(command);

    if (!result.success) {
      return ResponseFactory.error(result.error || "並び順の更新に失敗しました");
    }

    return ResponseFactory.success({ success: true });
  } catch {
    return ResponseFactory.error("並び順の更新に失敗しました");
  }
}
