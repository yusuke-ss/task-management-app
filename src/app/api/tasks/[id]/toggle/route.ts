import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "無効なタスクIDです" },
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "タスクが見つかりません" },
        { status: 404 }
      );
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        isCompleted: !existingTask.isCompleted,
      },
    });

    return NextResponse.json(task);
  } catch {
    return NextResponse.json(
      { error: "タスクの状態変更に失敗しました" },
      { status: 500 }
    );
  }
}
