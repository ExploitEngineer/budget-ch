"use server";

import { headers } from "next/headers";
import { getContext } from "../auth/actions";
import {
  createTaskDB,
  getTasksByHubDB,
  updateTaskDB,
  deleteTaskDB,
} from "@/db/queries";
import { requireAdminRole } from "@/lib/auth/permissions";

// CREATE Task
export async function createTask({
  name,
  checked,
}: {
  name: string;
  checked: boolean;
}) {
  const hdrs = await headers();
  const { userId, userRole, hubId } = await getContext(hdrs, false);

  requireAdminRole(userRole);

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
  const { userRole } = await getContext(hdrs, false);

  requireAdminRole(userRole);

  return await updateTaskDB({ taskId, name, checked });
}

// DELETE Task
export async function deleteTask(taskId: string) {
  const hdrs = await headers();
  const { userRole } = await getContext(hdrs, false);

  requireAdminRole(userRole);

  return await deleteTaskDB(taskId);
}
