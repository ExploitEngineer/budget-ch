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
import { useState, useEffect, useRef } from "react";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from "@/lib/services/tasks";
import { toast } from "sonner";
import { QuickTask } from "@/db/schema";
import { getTopCategories } from "@/lib/services/budget";

interface ProgressCards {
  title: string;
  content: string;
  value: number;
}

export function BudgetProgressSection() {
  const t = useTranslations("main-dashboard.dashboard-page");

  const [categories, setCategories] = useState<ProgressCards[]>([]);
  const [tasks, setTasks] = useState<QuickTask[]>([]);
  const [newTask, setNewTask] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Inline edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isEditingSave, setIsEditingSave] = useState(false);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  // Load tasks on mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [taskRes, categoriesRes] = await Promise.all([
          getTasks(),
          getTopCategories(),
        ]);

        if (taskRes.success && taskRes.data) setTasks(taskRes.data);

        if (categoriesRes.success && categoriesRes.data) {
          setCategories(categoriesRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch top categories:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Create new task
  async function handleAddTask() {
    if (!newTask.trim()) return;
    setIsLoading(true);

    const result = await createTask({ name: newTask, checked: false });
    if (!result.success) {
      toast.error(result.message);
      setIsLoading(false);
      return;
    }

    const updated = await getTasks();
    if (updated.success && updated.data) setTasks(updated.data);
    setNewTask("");
    setIsLoading(false);
    toast.success(t("todos.created"));
  }

  // Toggle checkbox
  async function handleToggle(task: QuickTask) {
    const result = await updateTask({
      taskId: task.id,
      checked: !task.checked,
    });
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, checked: !task.checked } : t,
      ),
    );
  }

  // 🔹 Delete task
  async function handleDelete(id: string) {
    const result = await deleteTask(id);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success(t("todos.deleted"));
  }

  // Start editing on double click
  function startEditing(task: QuickTask) {
    setEditingId(task.id);
    setEditingText(task.name);
    // focus next tick
    setTimeout(() => editInputRef.current?.focus(), 0);
  }

  // Save edited title
  async function saveEdit(taskId: string) {
    const trimmed = editingText.trim();
    if (!trimmed) {
      // don't save empty title, cancel instead
      setEditingId(null);
      setEditingText("");
      return;
    }

    // If nothing changed just close
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.name === trimmed) {
      setEditingId(null);
      setEditingText("");
      return;
    }

    setIsEditingSave(true);
    const result = await updateTask({ taskId, name: trimmed });
    setIsEditingSave(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, name: trimmed } : t)),
    );
    setEditingId(null);
    setEditingText("");
    toast.success(t("todos.updated") ?? "Updated");
  }

  // Cancel editing (do not persist)
  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-5">
      <Card className="bg-blue-background dark:border-border-blue relative lg:col-span-3">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("line-progress-cards.title")}</CardTitle>
          <Button
            variant="outline"
            className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
          >
            {t("line-progress-cards.button")}
          </Button>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <div className="grid grid-cols-2 gap-4 pb-10">
          {loading ? (
            <p className="text-muted-foreground absolute left-1/2 -translate-x-1/2 text-center text-sm">
              Loading ...
            </p>
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground absolute left-1/2 -translate-x-1/2 text-center text-sm">
              No categories found
            </p>
          ) : (
            categories.map((card) => (
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
          {/* Header */}
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{t("todos.title")}</CardTitle>
            <Badge
              variant="outline"
              className="bg-badge-background dark:border-border-blue rounded-full px-2 py-1"
            >
              {tasks.length}
            </Badge>
          </CardHeader>

          <Separator className="dark:bg-border-blue" />

          {/* Task List */}
          <div className="flex flex-col gap-3 px-6 pb-4">
            {tasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("todos.no-tasks")}
              </p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      className="cursor-pointer"
                      checked={task.checked ?? false}
                      onCheckedChange={() => handleToggle(task)}
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
                        disabled={isEditingSave}
                        className="!bg-dark-blue-background dark:border-border-blue w-[220px] text-sm"
                      />
                    ) : (
                      <h3
                        className={`text-sm ${
                          task.checked ? "line-through opacity-70" : ""
                        }`}
                        onDoubleClick={() => startEditing(task)}
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
            disabled={isLoading}
            className="!bg-dark-blue-background dark:border-border-blue"
            placeholder={t("todos.placeholder")}
          />
          <Button
            onClick={handleAddTask}
            disabled={isLoading}
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
