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
  const { userId, role, hubId } = await getContext(hdrs, false);

  if (role === "member") throw new Error("Members cannot modify this resource");

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
  const hdrs = await headers();
  const { role } = await getContext(hdrs, false);

  if (role === "member") throw new Error("Members cannot modify this resource");

  return await updateTaskDB({ taskId, name, checked });
}

// DELETE Task
export async function deleteTask(taskId: string) {
  const hdrs = await headers();
  const { role } = await getContext(hdrs);

  if (role === "member") throw new Error("Members cannot modify this resource");

  return await deleteTaskDB(taskId);
}
