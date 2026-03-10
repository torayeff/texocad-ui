import React from "react";
import type { ChatMessage } from "@/app/components/chat/types";

export const HumanMessage = React.memo(function HumanMessage({
  message,
}: {
  message: ChatMessage;
}) {
  if (message.role !== "human") return null;

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5">
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
});
