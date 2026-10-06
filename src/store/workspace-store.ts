"use client";

import { create } from "zustand";
import { seed } from "@/lib/seed";
import type { Prefs, PriorityId, StatusId, Task, WorkspaceData } from "@/types/workspace";

const KEY = "gr8r.studio.v1";

export const DEFAULT_PREFS: Prefs = {
  theme: "system",
  accent: "indigo",
  side: "comfortable",
  density: "comfortable",
  name: "Alex Morgan",
  title: "Head of Product",
};

type WorkspaceState = {
  ready: boolean;
  data: WorkspaceData | null;
  prefs: Prefs;
  boot: () => void;
  patch: (fn: (data: WorkspaceData) => void) => void;
  setPrefs: (partial: Partial<Prefs>) => void;
  setTaskStatus: (taskId: string, status: StatusId) => void;
  toggleTaskFav: (taskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addComment: (taskId: string, text: string) => void;
  addTask: (input: { title: string; projectId: string; assignee: string; priority: PriorityId; due: string | null }) => string;
  toggleProjectFav: (projectId: string) => void;
  markNotification: (id: string, read: boolean) => void;
  markAllRead: () => void;
  saveWorkspace: (name: string, url: string) => void;
  saveProfile: (name: string, title: string) => void;
};

function persist(data: WorkspaceData, prefs: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ data, prefs }));
  } catch {
    /* ignore quota */
  }
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  ready: false,
  data: null,
  prefs: DEFAULT_PREFS,
  boot: () => {
    if (get().ready) return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { data?: WorkspaceData; prefs?: Partial<Prefs> };
        if (saved.data?.tasks?.length) {
          set({ ready: true, data: saved.data, prefs: { ...DEFAULT_PREFS, ...saved.prefs } });
          return;
        }
      }
    } catch {
      /* fall through to seed */
    }
    const data = seed();
    set({ ready: true, data, prefs: DEFAULT_PREFS });
    persist(data, DEFAULT_PREFS);
  },
  patch: (fn) => {
    const current = get().data;
    if (!current) return;
    const next = structuredClone(current);
    fn(next);
    set({ data: next });
    persist(next, get().prefs);
  },
  setPrefs: (partial) => {
    const prefs = { ...get().prefs, ...partial };
    set({ prefs });
    const data = get().data;
    if (data) persist(data, prefs);
  },
  setTaskStatus: (taskId, status) => {
    get().patch((data) => {
      const task = data.tasks.find((item) => item.id === taskId);
      if (!task) return;
      task.status = status;
      task.updated = Date.now();
      if (status === "done") task.completedAt = Date.now();
      data.activity.unshift({
        id: `ac${Date.now()}`,
        by: data.me,
        verb: status === "done" ? "completed" : "moved",
        task: task.id,
        project: task.project,
        at: Date.now(),
        extra: status === "done" ? "" : `to ${status}`,
      });
    });
  },
  toggleTaskFav: (taskId) => {
    get().patch((data) => {
      const task = data.tasks.find((item) => item.id === taskId);
      if (task) task.fav = !task.fav;
    });
  },
  toggleSubtask: (taskId, subtaskId) => {
    get().patch((data) => {
      const task = data.tasks.find((item) => item.id === taskId);
      const sub = task?.subtasks.find((item) => item.id === subtaskId);
      if (sub) sub.done = !sub.done;
    });
  },
  addComment: (taskId, text) => {
    const body = text.trim();
    if (!body) return;
    get().patch((data) => {
      data.comments.push({ id: `c${Date.now()}`, task: taskId, by: data.me, at: Date.now(), text: body });
      const task = data.tasks.find((item) => item.id === taskId);
      if (task) task.updated = Date.now();
    });
  },
  addTask: (input) => {
    const id = `t${Date.now()}`;
    get().patch((data) => {
      const project = data.projects.find((item) => item.id === input.projectId);
      const count = data.tasks.filter((item) => item.project === input.projectId).length + 1;
      const task: Task = {
        id,
        key: `${project?.key || "TSK"}-${100 + count * 3}`,
        project: input.projectId,
        title: input.title.trim(),
        status: "todo",
        assignee: input.assignee,
        priority: input.priority,
        due: input.due,
        start: input.due,
        labels: [],
        subtasks: [],
        attachments: [],
        deps: [],
        desc: "",
        estimate: null,
        created: Date.now(),
        updated: Date.now(),
        order: data.tasks.length + 1,
        fav: false,
        recur: null,
      };
      data.tasks.unshift(task);
      data.activity.unshift({
        id: `ac${Date.now()}`,
        by: data.me,
        verb: "created",
        task: id,
        project: input.projectId,
        at: Date.now(),
        extra: "",
      });
    });
    return id;
  },
  toggleProjectFav: (projectId) => {
    get().patch((data) => {
      const project = data.projects.find((item) => item.id === projectId);
      if (project) project.fav = !project.fav;
    });
  },
  markNotification: (id, read) => {
    get().patch((data) => {
      const note = data.notifs.find((item) => item.id === id);
      if (note) note.read = read;
    });
  },
  markAllRead: () => {
    get().patch((data) => {
      data.notifs.forEach((note) => {
        note.read = true;
      });
    });
  },
  saveWorkspace: (name, url) => {
    get().patch((data) => {
      data.ws.name = name.trim() || data.ws.name;
      data.ws.url = url.trim() || data.ws.url;
    });
  },
  saveProfile: (name, title) => {
    get().setPrefs({ name: name.trim() || get().prefs.name, title: title.trim() });
    get().patch((data) => {
      const person = data.members.find((member) => member.id === data.me);
      if (!person) return;
      if (name.trim()) person.name = name.trim();
      if (title.trim()) person.title = title.trim();
    });
  },
}));

export function useWorkspaceData() {
  return useWorkspaceStore((state) => state.data as WorkspaceData);
}

export function usePrefs() {
  return useWorkspaceStore((state) => state.prefs);
}
