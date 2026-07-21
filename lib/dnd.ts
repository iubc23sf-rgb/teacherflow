import type { DragEvent } from "react";

export type DragPayload =
  | { source: "slot"; day: number; period: number }
  | { source: "subject"; subjectId: string }
  | { source: "task"; taskId: string };

const MIME = "application/x-teacherflow-dnd";

export function setDragPayload(e: DragEvent, payload: DragPayload) {
  e.dataTransfer.setData(MIME, JSON.stringify(payload));
  e.dataTransfer.effectAllowed = "move";
}

export function getDragPayload(e: DragEvent): DragPayload | null {
  const raw = e.dataTransfer.getData(MIME);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
}
