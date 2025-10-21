"use server";

import { headers } from "next/headers";
import { getContext } from "../auth/actions";
import {
  createTask,
  getTasksByHub,
  updateTask,
  deleteTask,
} from "@/db/queries";

// CREATE Task
export async function CreateTask({
  name,
  checked,
}: {
  name: string;
  checked: boolean;
}) {
  const hdrs = await headers();
  const { userId, hubId } = await getContext(hdrs, true);

  if (!hubId) return { success: false, message: "No hubId found" };

  return await createTask({ userId, hubId, name, checked });
}

// READ Task
export async function GetTasks() {
  const hdrs = await headers();
  const { hubId } = await getContext(hdrs, true);

  if (!hubId) return { success: false, message: "No hubId found" };

  return await getTasksByHub(hubId);
}

// UPDATE Task
export async function UpdateTask({
  taskId,
  name,
  checked,
}: {
  taskId: string;
  name?: string;
  checked?: boolean;
}) {
  return await updateTask({ taskId, name, checked });
}

// DELETE Task
export async function DeleteTask(taskId: string) {
  return await deleteTask(taskId);
}
