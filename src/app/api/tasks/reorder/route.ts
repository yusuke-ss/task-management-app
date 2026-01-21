import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { taskIds } = body;

    if (!Array.isArray(taskIds)) {
      return NextResponse.json(
        { error: "taskIdsは配列である必要があります" },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      taskIds.map((id: number, index: number) =>
        prisma.task.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "並び順の更新に失敗しました" },
      { status: 500 }
    );
  }
}
