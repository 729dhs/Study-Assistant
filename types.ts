
export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type TodoType = 'once' | 'daily' | 'weekly' | 'target';
export type TodoPriority = 'normal' | 'important' | 'urgent';

export interface Todo {
  id: string;
  text: string;
  completed: boolean; // For 'once' and 'target'
  completedDates?: string[]; // For 'daily' and 'weekly', stores YYYY-MM-DD strings
  type: TodoType;
  priority: TodoPriority;
  date: string; // Creation ISO String
  tagIds: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  content: string; // Markdown
  date: string; // ISO String
  tagIds: string[];
  wordCount: number;
}

export interface PomodoroRecord {
  id: string;
  startTime: string;
  duration: number; // minutes
  tagIds: string[];
}

export interface DayAnnotation {
  date: string; // YYYY-MM-DD
  color: string;
  label: string;
}

export interface AppData {
  appName: string;
  motto: string;
  todos: Todo[];
  posts: BlogPost[];
  tags: Tag[];
  pomodoroRecords: PomodoroRecord[];
  images: Record<string, string>;
  annotations: Record<string, DayAnnotation>; // New: Manual day tagging
}

export type Module = 'todo' | 'blog' | 'timer' | 'stats' | 'tags';
