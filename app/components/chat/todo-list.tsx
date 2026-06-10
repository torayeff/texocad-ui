import React from "react";
import { Circle, CircleCheck, CircleDot } from "lucide-react";
import type { TodoItem } from "@/app/types/chat";

const TODO_STYLE = {
  pending: {
    icon: Circle,
    itemClass: "border-border/40 bg-muted/20 text-muted-foreground",
    iconClass: "text-muted-foreground/70",
  },
  in_progress: {
    icon: CircleDot,
    itemClass: "border-success/30 bg-success/10 text-foreground",
    iconClass: "text-success",
  },
  completed: {
    icon: CircleCheck,
    itemClass: "border-success/20 bg-success/5 text-muted-foreground",
    iconClass: "text-success",
  },
} as const;

export const TodoList = React.memo(function TodoList({
  todos,
}: {
  todos: TodoItem[];
}) {
  if (todos.length === 0) return null;

  const completed = todos.filter((todo) => todo.status === "completed").length;
  const percentage = Math.round((completed / todos.length) * 100);
  const firstInProgressIdx = todos.findIndex((todo) => todo.status === "in_progress");

  return (
    <section className="rounded-2xl border border-border/50 bg-card/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Agent Progress</h2>
          <p className="text-xs text-muted-foreground">
            {completed}/{todos.length} tasks complete
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {percentage}%
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/60">
        <div
          className="h-full rounded-full bg-success transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {todos.map((todo, index) => {
          const style = TODO_STYLE[todo.status];
          const Icon = style.icon;
          const showPulse = todo.status === "in_progress"
            && firstInProgressIdx === index;

          return (
            <li
              key={todo.id ?? `${todo.content}-${index}`}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${style.itemClass}`}
            >
              <Icon
                size={16}
                className={`mt-0.5 flex-shrink-0 ${style.iconClass} ${showPulse ? "animate-pulse" : ""}`}
              />
              <span className={todo.status === "completed" ? "line-through opacity-70" : ""}>
                {todo.content}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
});
