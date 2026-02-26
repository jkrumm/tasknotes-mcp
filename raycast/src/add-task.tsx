import {
  Action,
  ActionPanel,
  Form,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { CONTEXTS, createTask, getFilterOptions, TaskContext, TaskPriority, today } from "./api/tasknotes";

interface Props {
  onCreated?: () => void;
  defaults?: {
    title?: string;
    context?: TaskContext;
    priority?: TaskPriority;
    project?: string;
    due?: Date;
    scheduled?: Date;
  };
}

export default function AddTask({ onCreated, defaults }: Props) {
  const { pop } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    getFilterOptions()
      .then((opts) => setProjects(opts.projects.map((p) => p.replace(/^\[\[|\]\]$/g, ""))))
      .catch(() => setProjects([]));
  }, []);

  async function handleSubmit(values: {
    title: string;
    context: string;
    priority: string;
    project: string;
    due: Date | null;
    scheduled: Date | null;
  }) {
    if (!values.title.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "Title is required" });
      return;
    }
    if (!values.context) {
      await showToast({ style: Toast.Style.Failure, title: "Context is required" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: values.title.trim(),
        contexts: [values.context as TaskContext],
        priority: values.priority as TaskPriority,
        scheduled: values.scheduled
          ? values.scheduled.toISOString().slice(0, 10)
          : today(),
        due: values.due ? values.due.toISOString().slice(0, 10) : undefined,
        projects: values.project ? [values.project] : [],
      };

      await createTask(payload);
      await showToast({
        style: Toast.Style.Success,
        title: "Task created",
        message: payload.title,
      });
      onCreated?.();
      pop();
    } finally {
      setIsSubmitting(false);
    }
  }

  const defaultScheduled = defaults?.scheduled ?? new Date();

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Task" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Title"
        placeholder="Task title..."
        defaultValue={defaults?.title ?? ""}
        autoFocus
      />
      <Form.Dropdown id="context" title="Context" defaultValue={defaults?.context ?? "dev"}>
        {CONTEXTS.map((ctx) => (
          <Form.Dropdown.Item key={ctx} value={ctx} title={ctx.charAt(0).toUpperCase() + ctx.slice(1)} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown id="priority" title="Priority" defaultValue={defaults?.priority ?? "normal"}>
        <Form.Dropdown.Item value="none" title="None" />
        <Form.Dropdown.Item value="low" title="Low" />
        <Form.Dropdown.Item value="normal" title="Normal" />
        <Form.Dropdown.Item value="high" title="High" />
      </Form.Dropdown>
      <Form.Dropdown id="project" title="Project" defaultValue={defaults?.project ?? ""}>
        <Form.Dropdown.Item value="" title="— none —" />
        {projects.map((p) => (
          <Form.Dropdown.Item key={p} value={p} title={p} />
        ))}
      </Form.Dropdown>
      <Form.DatePicker id="scheduled" title="Scheduled" defaultValue={defaultScheduled} type={Form.DatePicker.Type.Date} />
      <Form.DatePicker id="due" title="Due Date" defaultValue={defaults?.due ?? null} type={Form.DatePicker.Type.Date} />
    </Form>
  );
}
