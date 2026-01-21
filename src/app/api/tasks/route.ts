import { NextResponse } from "next/server";
import { getTaskRepository } from "@/lib/patterns/repository/TaskRepository";
import {
  GetAllTasksCommand,
  CreateTaskCommand,
  CommandInvoker,
} from "@/lib/patterns/command/TaskCommands";
import { TaskValidators } from "@/lib/patterns/helpers/TaskValidators";
import { ResponseFactory } from "@/lib/patterns/decorator/ResponseDecorator";

/**
 * タスク一覧取得・作成API
 * GoFデザインパターンを適用:
 * - Repository Pattern: データアクセスの抽象化
 * - Command Pattern: 操作のカプセル化
 * - Singleton Pattern: リポジトリとインボーカーの管理
 * - Factory Pattern: レスポンス生成
 * - Chain of Responsibility: バリデーションチェーン
 */

const repository = getTaskRepository();
const invoker = new CommandInvoker();

export async function GET() {
  try {
    const command = new GetAllTasksCommand(repository);
    const result = await invoker.execute(command);

    if (!result.success) {
      return ResponseFactory.error(result.error || "タスクの取得に失敗しました");
    }

    return ResponseFactory.success(result.data);
  } catch {
    return ResponseFactory.error("タスクの取得に失敗しました");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description } = body;

    // Chain of Responsibility Pattern: バリデーションチェーン
    const validationResult = TaskValidators.validateTaskInput(title, description);
    if (!validationResult.isValid) {
      return ResponseFactory.badRequest(validationResult.error || "バリデーションエラー");
    }

    // Command Pattern: タスク作成コマンド
    const command = new CreateTaskCommand(
      repository,
      title,
      description,
      (t, d) => TaskValidators.validateTaskInput(t, d)
    );

    const result = await invoker.execute(command);

    if (!result.success) {
      return ResponseFactory.error(result.error || "タスクの作成に失敗しました");
    }

    // Factory Pattern + Decorator Pattern: レスポンス生成
    return ResponseFactory.created(result.data);
  } catch {
    return ResponseFactory.error("タスクの作成に失敗しました");
  }
}
