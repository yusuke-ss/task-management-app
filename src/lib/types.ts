export interface Task {
  id: number;
  title: string;
  description: string | null;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
