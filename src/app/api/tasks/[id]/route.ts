import { NextResponse } from "next/server";
import { getTaskRepository } from "@/lib/patterns/repository/TaskRepository";
import {
  GetTaskByIdCommand,
  UpdateTaskCommand,
  DeleteTaskCommand,
  CommandInvoker,
} from "@/lib/patterns/command/TaskCommands";
import { TaskValidators } from "@/lib/patterns/helpers/TaskValidators";
import { ResponseFactory } from "@/lib/patterns/decorator/ResponseDecorator";

/**
 * 個別タスク操作API
 * GoFデザインパターンを適用:
 * - Repository Pattern: データアクセスの抽象化
 * - Command Pattern: 操作のカプセル化
 * - Singleton Pattern: リポジトリとインボーカーの管理
 * - Factory Pattern: レスポンス生成
 * - Chain of Responsibility: バリデーションチェーン
 */

type Params = Promise<{ id: string }>;

const repository = getTaskRepository();
const invoker = new CommandInvoker();

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);

    // バリデーション
    const validationResult = TaskValidators.validateTaskId(taskId);
    if (!validationResult.isValid) {
      return ResponseFactory.badRequest(validationResult.error || "無効なタスクIDです");
    }

    // Command Pattern: タスク取得コマンド
    const command = new GetTaskByIdCommand(repository, taskId);
    const result = await invoker.execute(command);

    if (!result.success) {
      return ResponseFactory.notFound(result.error);
    }

    return ResponseFactory.success(result.data);
  } catch {
    return ResponseFactory.error("タスクの取得に失敗しました");
  }
}

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);

    // ID バリデーション
    const idValidationResult = TaskValidators.validateTaskId(taskId);
    if (!idValidationResult.isValid) {
      return ResponseFactory.badRequest(idValidationResult.error || "無効なタスクIDです");
    }

    const body = await request.json();
    const { title, description } = body;

    // 入力バリデーション
    const validationResult = TaskValidators.validateTaskInput(title, description);
    if (!validationResult.isValid) {
      return ResponseFactory.badRequest(validationResult.error || "バリデーションエラー");
    }

    // Command Pattern: タスク更新コマンド
    const command = new UpdateTaskCommand(
      repository,
      taskId,
      title,
      description,
      (t, d) => TaskValidators.validateTaskInput(t, d)
    );

    const result = await invoker.execute(command);

    if (!result.success) {
      if (result.error === "タスクが見つかりません") {
        return ResponseFactory.notFound(result.error);
      }
      return ResponseFactory.error(result.error || "タスクの更新に失敗しました");
    }

    return ResponseFactory.success(result.data);
  } catch {
    return ResponseFactory.error("タスクの更新に失敗しました");
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);

    // バリデーション
    const validationResult = TaskValidators.validateTaskId(taskId);
    if (!validationResult.isValid) {
      return ResponseFactory.badRequest(validationResult.error || "無効なタスクIDです");
    }

    // Command Pattern: タスク削除コマンド
    const command = new DeleteTaskCommand(repository, taskId);
    const result = await invoker.execute(command);

    if (!result.success) {
      if (result.error === "タスクが見つかりません") {
        return ResponseFactory.notFound(result.error);
      }
      return ResponseFactory.error(result.error || "タスクの削除に失敗しました");
    }

    return ResponseFactory.success(result.data);
  } catch {
    return ResponseFactory.error("タスクの削除に失敗しました");
  }
}
