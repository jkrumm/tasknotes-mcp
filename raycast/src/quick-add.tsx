import { Action, ActionPanel, closeMainWindow, List, showHUD } from "@raycast/api";
import { useState } from "react";
import { nlpCreate } from "./api/tasknotes";

export default function QuickAdd() {
  const [searchText, setSearchText] = useState("");

  async function handleSubmit() {
    const text = searchText.trim();
    if (!text) return;

    await closeMainWindow();

    try {
      const task = await nlpCreate(text);
      await showHUD(`Added: ${task.title}`);
    } catch {
      // request() already showed an error toast with details
    }
  }

  return (
    <List
      searchBarPlaceholder='e.g. "Fix dark mode for basalt high"'
      onSearchTextChange={setSearchText}
      throttle={false}
    >
      {searchText.trim() ? (
        <List.Item
          title={`Add: "${searchText}"`}
          actions={
            <ActionPanel>
              <Action title="Add Task" onAction={handleSubmit} />
            </ActionPanel>
          }
        />
      ) : (
        <List.EmptyView title="Type a task" description="" />
      )}
    </List>
  );
}
