import { Action, ActionPanel, List, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { CONTEXTS, nlpParse, TaskContext, TaskPriority } from "./api/tasknotes";
import AddTask from "./add-task";

export default function QuickAdd() {
  const { push } = useNavigation();
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleParse() {
    const text = searchText.trim();
    if (!text) return;

    setIsLoading(true);
    try {
      const parsed = await nlpParse(text);

      const context = parsed.context && CONTEXTS.includes(parsed.context) ? parsed.context : undefined;

      push(
        <AddTask
          defaults={{
            title: parsed.title,
            context,
            priority: parsed.priority as TaskPriority | undefined,
            project: parsed.project ?? undefined,
            scheduled: parsed.scheduled ? new Date(parsed.scheduled + "T00:00:00") : undefined,
            due: parsed.due ? new Date(parsed.due + "T00:00:00") : undefined,
          }}
        />
      );
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Parse failed",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <List
      searchBarPlaceholder='e.g. "Fix dark mode for basalt high"'
      onSearchTextChange={setSearchText}
      isLoading={isLoading}
      throttle={false}
    >
      {searchText.trim() ? (
        <List.Item
          title={`Parse: "${searchText}"`}
          actions={
            <ActionPanel>
              <Action title="Parse with Gemini" onAction={handleParse} />
            </ActionPanel>
          }
        />
      ) : (
        <List.EmptyView title="Type a task" description="" />
      )}
    </List>
  );
}
