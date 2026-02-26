import {
  Action,
  ActionPanel,
  Color,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import {
  CONTEXTS,
  extractProjectName,
  formatDueDate,
  getTasks,
  isOverdue,
  isDueToday,
  openInObsidian,
  Task,
  TaskContext,
  today,
  updateTask,
} from "./api/tasknotes";
import AddTask from "./add-task";

// ============================================================================
// Filter types
// ============================================================================

type FilterOption = "all" | TaskContext | "today" | "priority:high" | "priority:normal" | "priority:low";

// ============================================================================
// Visual helpers
// ============================================================================

const CONTEXT_COLOR: Record<TaskContext, Color> = {
  dev: Color.Blue,
  work: Color.Orange,
  life: Color.Green,
  infra: Color.Purple,
};

function taskIcon(task: Task): { source: Icon; tintColor?: Color } {
  switch (task.priority) {
    case "high":
      return { source: Icon.Circle, tintColor: Color.Red };
    case "normal":
      return { source: Icon.Circle, tintColor: Color.Yellow };
    case "low":
      return { source: Icon.Circle, tintColor: Color.SecondaryText };
    default:
      return { source: Icon.Circle };
  }
}

function taskAccessories(task: Task): List.Item.Accessory[] {
  const accessories: List.Item.Accessory[] = [];

  if (task.contexts.length > 0) {
    accessories.push({ tag: { value: task.contexts[0], color: CONTEXT_COLOR[task.contexts[0]] } });
  }

  if (task.timeEstimate) {
    accessories.push({ text: task.timeEstimate, icon: Icon.Clock });
  }

  if (task.scheduled && task.scheduled !== task.due) {
    accessories.push({
      icon: { source: Icon.Calendar, tintColor: Color.SecondaryText },
      tooltip: `Scheduled: ${task.scheduled}`,
    });
  }

  if (task.isBlocked) {
    accessories.push({
      icon: { source: Icon.Lock, tintColor: Color.SecondaryText },
      tooltip: "Blocked",
    });
  }

  if (task.isBlocking) {
    accessories.push({
      icon: { source: Icon.ExclamationMark, tintColor: Color.Orange },
      tooltip: "Blocking other tasks",
    });
  }

  if (task.due) {
    const overdue = isOverdue(task.due);
    const dueToday = isDueToday(task.due);
    accessories.push({
      text: {
        value: formatDueDate(task.due) ?? task.due,
        color: overdue || dueToday ? Color.Red : Color.SecondaryText,
      },
      icon: overdue || dueToday ? { source: Icon.ExclamationMark, tintColor: Color.Red } : undefined,
    });
  }

  return accessories;
}

// ============================================================================
// Main component
// ============================================================================

export default function ListTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>("all");
  const { push } = useNavigation();

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const isPriorityFilter = filter.startsWith("priority:");
      const contextFilter =
        !isPriorityFilter && CONTEXTS.includes(filter as TaskContext) ? [filter as TaskContext] : undefined;
      const scheduledFilter = !isPriorityFilter && filter === "today" ? today() : undefined;

      const fetched = await getTasks({ contexts: contextFilter, scheduled: scheduledFilter });

      if (isPriorityFilter) {
        const priorityValue = filter.split(":")[1];
        setTasks(fetched.filter((t) => t.priority === priorityValue));
      } else {
        setTasks(fetched);
      }
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const toggleInProgress = useCallback(async (task: Task) => {
    const newStatus = task.status === "in-progress" ? "open" : "in-progress";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    try {
      await updateTask(task.id, { status: newStatus });
      await showToast({
        style: Toast.Style.Success,
        title: newStatus === "in-progress" ? "Started" : "Paused",
        message: task.title,
      });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
  }, []);

  const markDone = useCallback(async (task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await updateTask(task.id, { status: "done" });
      await showToast({
        style: Toast.Style.Success,
        title: "Done",
        message: task.title,
      });
    } catch {
      setTasks((prev) => {
        const next = [...prev, { ...task }];
        return next.sort((a, b) => a.title.localeCompare(b.title));
      });
    }
  }, []);

  // Group tasks by context (in defined order)
  const grouped = CONTEXTS.reduce<Record<TaskContext, Task[]>>(
    (acc, ctx) => {
      acc[ctx] = tasks.filter((t) => t.contexts.includes(ctx));
      return acc;
    },
    { dev: [], work: [], life: [], infra: [] }
  );

  return (
    <List
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown tooltip="Filter tasks" onChange={(val) => setFilter(val as FilterOption)}>
          <List.Dropdown.Section title="Context">
            <List.Dropdown.Item value="all" title="All" />
            <List.Dropdown.Item value="dev" title="Dev" />
            <List.Dropdown.Item value="work" title="Work" />
            <List.Dropdown.Item value="life" title="Life" />
            <List.Dropdown.Item value="infra" title="Infra" />
            <List.Dropdown.Item value="today" title="Today" />
          </List.Dropdown.Section>
          <List.Dropdown.Section title="Priority">
            <List.Dropdown.Item value="priority:high" title="High Priority" />
            <List.Dropdown.Item value="priority:normal" title="Normal Priority" />
            <List.Dropdown.Item value="priority:low" title="Low Priority" />
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {CONTEXTS.map((ctx) => {
        const ctxTasks = grouped[ctx];
        if (ctxTasks.length === 0) return null;
        return (
          <List.Section key={ctx} title={ctx.charAt(0).toUpperCase() + ctx.slice(1)}>
            {ctxTasks.map((task) => (
              <List.Item
                key={task.id}
                icon={taskIcon(task)}
                title={task.title}
                subtitle={task.projects.length > 0 ? extractProjectName(task.projects[0]) : undefined}
                accessories={taskAccessories(task)}
                actions={
                  <ActionPanel>
                    <ActionPanel.Section>
                      <Action
                        title="Open in Obsidian"
                        icon={Icon.Window}
                        onAction={() => openInObsidian(task.id)}
                      />
                      <Action
                        title={task.status === "in-progress" ? "Pause Task" : "Start Task"}
                        icon={task.status === "in-progress" ? Icon.Pause : Icon.Play}
                        shortcut={{ modifiers: ["cmd"], key: "t" }}
                        onAction={() => toggleInProgress(task)}
                      />
                      <Action
                        title="Mark Done"
                        icon={{ source: Icon.Checkmark, tintColor: Color.Green }}
                        shortcut={{ modifiers: ["cmd"], key: "d" }}
                        onAction={() => markDone(task)}
                      />
                    </ActionPanel.Section>
                    <ActionPanel.Section>
                      <Action
                        title="Add Task"
                        icon={Icon.Plus}
                        shortcut={{ modifiers: ["cmd"], key: "n" }}
                        onAction={() => push(<AddTask onCreated={loadTasks} />)}
                      />
                      <Action
                        title="Refresh"
                        icon={Icon.ArrowClockwise}
                        shortcut={{ modifiers: ["cmd"], key: "r" }}
                        onAction={loadTasks}
                      />
                    </ActionPanel.Section>
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        );
      })}
      {!isLoading && tasks.length === 0 && (
        <List.EmptyView
          icon={Icon.Checkmark}
          title="No tasks"
          description="All clear! Press ⌘N to add a task."
          actions={
            <ActionPanel>
              <Action
                title="Add Task"
                icon={Icon.Plus}
                shortcut={{ modifiers: ["cmd"], key: "n" }}
                onAction={() => push(<AddTask onCreated={loadTasks} />)}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
