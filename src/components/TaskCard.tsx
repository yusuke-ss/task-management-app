"use client";

import { Task } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  onToggle: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  dragHandleProps?: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
  isDragging?: boolean;
}

export default function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  dragHandleProps,
  isDragging,
}: TaskCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border p-3 transition-all ${
        task.isCompleted ? "border-gray-200 bg-gray-50" : "border-gray-300"
      } ${isDragging ? "shadow-lg opacity-90" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggle(task.id)}
          className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            task.isCompleted
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-400 hover:border-green-500"
          }`}
          aria-label={task.isCompleted ? "未完了に戻す" : "完了にする"}
        >
          {task.isCompleted && (
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>

        <span
          className={`flex-grow text-gray-800 ${
            task.isCompleted ? "line-through text-gray-400" : ""
          }`}
        >
          {task.title}
        </span>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
            aria-label="編集"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <div
            {...dragHandleProps}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded transition-colors cursor-grab active:cursor-grabbing"
            aria-label="ドラッグして並べ替え"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <button
            onClick={() => onDelete(task.id)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 rounded transition-colors"
            aria-label="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
