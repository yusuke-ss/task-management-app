"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import TaskCard from "@/components/TaskCard";
import TaskModal from "@/components/TaskModal";
import DeleteDialog from "@/components/DeleteDialog";
import { Task } from "@/lib/types";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("タスクの取得に失敗しました");
      const data = await res.json();
      setTasks(data);
      setError(null);
    } catch {
      setError("タスクの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggle = async (id: number) => {
    try {
      const res = await fetch(`/api/tasks/${id}/toggle`, { method: "PATCH" });
      if (!res.ok) throw new Error("状態の変更に失敗しました");
      const updatedTask = await res.json();
      setTasks((prev) =>
        prev.map((task) => (task.id === id ? updatedTask : task))
      );
    } catch {
      setError("タスクの状態変更に失敗しました");
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteTaskId(id);
  };

  const confirmDelete = async () => {
    if (deleteTaskId === null) return;

    try {
      const res = await fetch(`/api/tasks/${deleteTaskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("削除に失敗しました");
      setTasks((prev) => prev.filter((task) => task.id !== deleteTaskId));
      setDeleteTaskId(null);
    } catch {
      setError("タスクの削除に失敗しました");
    }
  };

  const handleSave = async (title: string, description: string) => {
    try {
      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });
        if (!res.ok) throw new Error("更新に失敗しました");
        const updatedTask = await res.json();
        setTasks((prev) =>
          prev.map((task) => (task.id === editingTask.id ? updatedTask : task))
        );
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });
        if (!res.ok) throw new Error("作成に失敗しました");
        const newTask = await res.json();
        setTasks((prev) => [newTask, ...prev]);
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch {
      setError(editingTask ? "タスクの更新に失敗しました" : "タスクの作成に失敗しました");
    }
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle.trim(), description: "" }),
      });
      if (!res.ok) throw new Error("作成に失敗しました");
      const newTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);
      setNewTaskTitle("");
    } catch {
      setError("タスクの作成に失敗しました");
    }
  };

  const handleReorder = useCallback(async (newTasks: Task[]) => {
    setTasks(newTasks);
    try {
      const taskIds = newTasks.map((t) => t.id);
      await fetch("/api/tasks/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds }),
      });
    } catch {
      setError("並び順の更新に失敗しました");
      fetchTasks();
    }
  }, []);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const threshold = rect.height * 0.45; // 上下45%の範囲で判定

    let newDropTarget: number | null = null;

    if (offsetY < threshold) {
      // 上30%の範囲 → 上に挿入
      newDropTarget = index;
    } else if (offsetY > rect.height - threshold) {
      // 下30%の範囲 → 下に挿入
      newDropTarget = index + 1;
    } else {
      // 中央40%の範囲 → 前回の状態を維持（ちらつき防止）
      return;
    }

    // ドラッグ中の要素自身の位置には表示しない
    if (newDropTarget === draggedIndex || newDropTarget === draggedIndex + 1) {
      setDropTargetIndex(null);
    } else {
      setDropTargetIndex(newDropTarget);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dropTargetIndex !== null) {
      const newTasks = [...tasks];
      const [draggedTask] = newTasks.splice(draggedIndex, 1);

      let insertIndex = dropTargetIndex;
      if (draggedIndex < dropTargetIndex) {
        insertIndex -= 1;
      }

      newTasks.splice(insertIndex, 0, draggedTask);
      handleReorder(newTasks);
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setDropTargetIndex(null);
    }
  };

  const getDragHandleProps = (index: number) => ({
    onMouseDown: (e: React.MouseEvent) => {
      const target = e.currentTarget.parentElement?.parentElement?.parentElement;
      if (target) {
        target.setAttribute("draggable", "true");
        dragNodeRef.current = target as HTMLDivElement;
      }
    },
    onTouchStart: () => {},
  });

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">
          タスク管理アプリ
        </h1>

        <form onSubmit={handleQuickCreate} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="新しいタスクを入力..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            作成
          </button>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline"
            >
              閉じる
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>タスクがありません</p>
          </div>
        ) : (
          <div>
            {tasks.map((task, index) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                className="relative"
              >
                {dropTargetIndex === index && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 -translate-y-1 rounded" />
                )}
                <div className={`mb-2 ${draggedIndex === index ? "opacity-50" : ""}`}>
                  <TaskCard
                    task={task}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    dragHandleProps={getDragHandleProps(index)}
                    isDragging={draggedIndex === index}
                  />
                </div>
              </div>
            ))}
            {/* 一番下にドロップするための領域 */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedIndex !== null && draggedIndex !== tasks.length - 1) {
                  setDropTargetIndex(tasks.length);
                }
              }}
              onDragLeave={() => setDropTargetIndex(null)}
              onDrop={handleDragEnd}
              className={`h-16 relative ${draggedIndex !== null ? "block" : "hidden"}`}
            >
              {dropTargetIndex === tasks.length && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded" />
              )}
            </div>
          </div>
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        task={editingTask}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSave}
      />

      <DeleteDialog
        isOpen={deleteTaskId !== null}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
