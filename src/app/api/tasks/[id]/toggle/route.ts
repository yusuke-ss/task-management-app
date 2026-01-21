import { NextResponse } from "next/server";
import { getTaskRepository } from "@/lib/patterns/repository/TaskRepository";
import {
  ToggleTaskCommand,
  CommandInvoker,
} from "@/lib/patterns/command/TaskCommands";
import { TaskValidators } from "@/lib/patterns/helpers/TaskValidators";
import { ResponseFactory } from "@/lib/patterns/decorator/ResponseDecorator";

/**
 * タスク完了状態トグルAPI
 * GoFデザインパターンを適用:
 * - Repository Pattern: データアクセスの抽象化
 * - Command Pattern: 操作のカプセル化
 * - Singleton Pattern: リポジトリとインボーカーの管理
 * - Factory Pattern: レスポンス生成
 */

type Params = Promise<{ id: string }>;

const repository = getTaskRepository();
const invoker = new CommandInvoker();

export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);

    // バリデーション
    const validationResult = TaskValidators.validateTaskId(taskId);
    if (!validationResult.isValid) {
      return ResponseFactory.badRequest(validationResult.error || "無効なタスクIDです");
    }

    // Command Pattern: タスクトグルコマンド
    const command = new ToggleTaskCommand(repository, taskId);
    const result = await invoker.execute(command);

    if (!result.success) {
      if (result.error === "Task not found") {
        return ResponseFactory.notFound("タスクが見つかりません");
      }
      return ResponseFactory.error(result.error || "タスクの状態変更に失敗しました");
    }

    return ResponseFactory.success(result.data);
  } catch {
    return ResponseFactory.error("タスクの状態変更に失敗しました");
  }
}
