import React from "react";
import { ListTodo, Loader2, CircleCheck, Circle, ChevronDown } from "lucide-react";
import { PanelTimer } from "@/app/studio/_components/chat/PanelTimer";
import type { ToolCallInfo } from "@/app/studio/_types/chat";

interface TodoItem {
  content: string;
  status: string;
}

function getTodoItems(value: unknown): TodoItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const { content, status } = item as Record<string, unknown>;
    if (typeof content !== "string" || typeof status !== "string") return [];

    return [{ content, status }];
  });
}

const TODO_STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CircleCheck size={14} className="flex-shrink-0 text-success" />,
  in_progress: <Loader2 size={14} className="flex-shrink-0 text-success animate-spin" />,
  pending: <Circle size={14} className="flex-shrink-0 text-muted-foreground/50" />,
};

export const TodoCard = React.memo(function TodoCard({ toolCall }: { toolCall: ToolCallInfo }) {
  const { args, state } = toolCall;
  const todos = getTodoItems(args.todos);
  const completedCount = todos.filter((t) => t.status === "completed").length;
  const allDone = todos.length > 0 && completedCount === todos.length;

  return (
    <details className="group/todo">
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <ListTodo size={13} className="flex-shrink-0 text-muted-foreground/60" />
        <span className="font-medium text-foreground/85">Tasks</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground/80">
          {completedCount}/{todos.length}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <PanelTimer active={state === "pending"} />
          {state === "pending" ? (
            <Loader2 size={13} className="flex-shrink-0 animate-spin text-success" />
          ) : allDone ? (
            <CircleCheck size={14} className="flex-shrink-0 text-success" />
          ) : null}
          <ChevronDown
            size={13}
            className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/todo:rotate-180"
          />
        </div>
      </summary>
      {todos.length > 0 ? (
        <ul className="mt-2 space-y-2 border-l border-border/30 pl-4">
          {todos.map((todo, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5">
                {TODO_STATUS_ICON[todo.status] ?? TODO_STATUS_ICON.pending}
              </span>
              <span
                className={
                  todo.status === "completed"
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }
              >
                {todo.content}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </details>
  );
});
