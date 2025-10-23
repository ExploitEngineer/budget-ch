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
  const { userId, hubId } = await getContext(hdrs, true);

  if (!hubId) return { success: false, message: "No hubId found" };

  return await createTaskDB({ userId, hubId, name, checked });
}

// READ Task
export async function getTasks() {
  const hdrs = await headers();
  const { hubId } = await getContext(hdrs, true);

  if (!hubId) return { success: false, message: "No hubId found" };

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
