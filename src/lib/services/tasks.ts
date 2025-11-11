"use server";

import { headers } from "next/headers";
import { getContext } from "../auth/actions";
import {
  createTaskDB,
  getTasksByHubDB,
  updateTaskDB,
  deleteTaskDB,
} from "@/db/queries";

// CREATE Task
export async function createTask({
  name,
  checked,
}: {
  name: string;
  checked: boolean;
}) {
  const hdrs = await headers();
  const { userId, hubId } = await getContext(hdrs, false);

  return await createTaskDB({ userId, hubId, name, checked });
}

// GET Tasks
export async function getTasks() {
  const hdrs = await headers();
  const { hubId } = await getContext(hdrs, false);

  return await getTasksByHubDB(hubId);
}

// UPDATE Task
export async function updateTask({
  taskId,
  name,
  checked,
}: {
  taskId: string;
  name?: string;
  checked?: boolean;
}) {
  return await updateTaskDB({ taskId, name, checked });
}

// DELETE Task
export async function deleteTask(taskId: string) {
  return await deleteTaskDB(taskId);
}
