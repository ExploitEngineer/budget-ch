"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useState, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/services/tasks";
import { getTopCategories } from "@/lib/services/budget";
import { taskKeys, budgetKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { QuickTask } from "@/db/schema";
import type { DashboardSavingsGoalsCards } from "@/lib/types/dashboard-types";

export function BudgetProgressSection() {
  const t = useTranslations("main-dashboard.dashboard-page");
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const [newTask, setNewTask] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const editInputRef = useRef<HTMLInputElement | null>(null);

  // Tasks query
  const {
    data: tasks,
    isLoading: tasksLoading,
    error: tasksError,
  } = useQuery<QuickTask[]>({
    queryKey: taskKeys.list(hubId),
    queryFn: async () => {
      const res = await getTasks();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch tasks");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  // Top categories query
  const {
    data: topCategories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<DashboardSavingsGoalsCards[]>({
    queryKey: budgetKeys.topCategories(hubId),
    queryFn: async () => {
      const res = await getTopCategories();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch categories");
      }
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!name.trim()) return;
      const res = await createTask({ name, checked: false });
      if (!res.success) {
        throw new Error(res.message || "Failed to create task");
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(hubId) });
      toast.success("Task created");
      setNewTask("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create task");
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, name, checked }: { taskId: string; name?: string; checked?: boolean }) => {
      const res = await updateTask({ taskId, name, checked });
      if (!res.success) {
        throw new Error(res.message || "Failed to update task");
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(hubId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update task");
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await deleteTask(taskId);
      if (!res.success) {
        throw new Error(res.message || "Failed to delete task");
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(hubId) });
      toast.success("Task deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete task");
    },
  });

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await createTaskMutation.mutateAsync(newTask);
  };

  const handleToggle = async (taskId: string, checked: boolean) => {
    await updateTaskMutation.mutateAsync({ taskId, checked });
  };

  const handleDelete = async (taskId: string) => {
    await deleteTaskMutation.mutateAsync(taskId);
  };

  const startEditing = (taskId: string, name: string) => {
    setEditingId(taskId);
    setEditingText(name);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const saveEdit = async (taskId: string) => {
    if (!editingText.trim()) {
      cancelEdit();
      return;
    }
    const task = tasks?.find((t) => t.id === taskId);
    if (task && task.name === editingText) {
      cancelEdit();
      return;
    }
    await updateTaskMutation.mutateAsync({ taskId, name: editingText });
    setEditingId(null);
    setEditingText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-5">
      <Card className="bg-blue-background dark:border-border-blue relative lg:col-span-3">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("line-progress-cards.title")}</CardTitle>
          <Link href="/me/budgets">
          <Button
            variant="outline"
            className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
          >
            {t("line-progress-cards.button")}
          </Button>
          </Link>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <div className="grid grid-cols-2 gap-4 pb-10">
          {categoriesError ? (
            <p className="px-6 text-sm text-red-500">{categoriesError.message}</p>
          ) : topCategories === null || categoriesLoading ? (
            <p className="text-muted-foreground px-6 text-sm">
              {t("line-progress-cards.loading")}
            </p>
          ) : topCategories?.length === 0 ? (
            <p className="text-muted-foreground px-6 text-sm">
              {t("line-progress-cards.no-categories-found")}
            </p>
          ) : (
            topCategories?.map((card) => (
              <CardContent key={card.title} className="flex flex-col">
                <div className="mb-3 flex flex-wrap items-center justify-between sm:mb-1">
                  <h3 className="text-sm sm:text-base">{card.title}</h3>
                  <h3 className="text-sm sm:text-base">{card.content}</h3>
                </div>
                <Progress value={card.value} />
              </CardContent>
            ))
          )}
        </div>
      </Card>
      <Card className="bg-blue-background dark:border-border-blue flex flex-col justify-between lg:col-span-2">
        <div className="flex flex-col gap-4">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{t("todos.title")}</CardTitle>
            <Badge
              variant="outline"
              className="bg-badge-background dark:border-border-blue rounded-full px-2 py-1"
            >
              {tasks?.length}
            </Badge>
          </CardHeader>

          <Separator className="dark:bg-border-blue" />

          {/* Task List */}
          <div className="flex flex-col gap-3 px-6 pb-4">
            {tasksError ? (
              <p className="text-sm text-red-500">{tasksError.message}</p>
            ) : tasks === null || tasksLoading ? (
              <p className="text-muted-foreground text-sm">
                {t("line-progress-cards.loading")}
              </p>
            ) : tasks?.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("todos.no-tasks")}
              </p>
            ) : (
              tasks?.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      className="cursor-pointer"
                      checked={task.checked ?? false}
                      onCheckedChange={() =>
                        !editingId &&
                        handleToggle(task.id, !(task.checked ?? false))
                      }
                      disabled={!!editingId}
                    />
                    {editingId === task.id ? (
                      <Input
                        ref={editInputRef}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={() => saveEdit(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(task.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="!bg-dark-blue-background dark:border-border-blue w-[220px] text-sm"
                      />
                    ) : (
                      <h3
                        className={`text-sm ${
                          task.checked ? "line-through opacity-70" : ""
                        }`}
                        onDoubleClick={() => startEditing(task.id, task.name)}
                        title="Double click to edit"
                      >
                        {task.name}
                      </h3>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
                    onClick={() => handleDelete(task.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Task Input */}
        <CardContent className="flex items-center justify-between gap-2">
          <Input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            disabled={createTaskMutation.isPending || tasksLoading}
            className="!bg-dark-blue-background dark:border-border-blue"
            placeholder={t("todos.placeholder")}
          />
          <Button
            onClick={handleAddTask}
            disabled={createTaskMutation.isPending || tasksLoading}
            variant="outline"
            className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
