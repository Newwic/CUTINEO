import { create } from 'zustand';
import type { NeoEvent, TaskState } from '../types/neo';

interface TaskStore {
  tasks: TaskState[];
  activeTaskId: string | null;
  applyEvent: (event: NeoEvent) => void;
  pauseActive: () => void;
  stopActive: () => void;
  clearCompleted: () => void;
}

function taskFromEvent(event: NeoEvent, previous?: TaskState): TaskState {
  const now = event.timestamp;
  return {
    id: event.taskId ?? previous?.id ?? `task_${Date.now()}`,
    title: event.title ?? previous?.title ?? 'งาน NEO',
    state: event.state ?? previous?.state ?? 'THINKING',
    application: event.application ?? previous?.application,
    path: event.path ?? previous?.path,
    message: event.message ?? previous?.message,
    progress: event.progress ?? previous?.progress ?? null,
    severity: event.severity ?? previous?.severity ?? 'info',
    startedAt: previous?.startedAt ?? now,
    updatedAt: now,
    paused: event.event === 'task.paused' ? true : event.event === 'task.resumed' ? false : previous?.paused ?? false,
  };
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  activeTaskId: null,
  applyEvent: (event) => set((current) => {
    const id = event.taskId ?? current.activeTaskId ?? `task_${Date.now()}`;
    const previous = current.tasks.find((task) => task.id === id);
    const updated = taskFromEvent({ ...event, taskId: id }, previous);
    const isDone = event.event === 'task.completed' || event.event === 'task.failed';
    const tasks = current.tasks.some((task) => task.id === id)
      ? current.tasks.map((task) => task.id === id ? updated : task)
      : [updated, ...current.tasks].slice(0, 6);
    return { tasks, activeTaskId: isDone ? null : id };
  }),
  pauseActive: () => set((current) => ({
    tasks: current.tasks.map((task) => task.id === current.activeTaskId ? { ...task, paused: true, state: 'WARNING' } : task),
  })),
  stopActive: () => set((current) => ({
    tasks: current.tasks.map((task) => task.id === current.activeTaskId ? { ...task, paused: true, state: 'WARNING', message: 'หยุดงานตามคำสั่งผู้ใช้' } : task),
    activeTaskId: null,
  })),
  clearCompleted: () => set((current) => ({ tasks: current.tasks.filter((task) => !['SUCCESS', 'ERROR'].includes(task.state)) })),
}));
