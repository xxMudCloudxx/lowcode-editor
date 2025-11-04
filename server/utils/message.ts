import { ContentBlock } from "@langchain/core/messages";

export function getMessageText(
  content: string | ContentBlock[] | undefined
): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  const block = content.find((c) => c.type === "text");
  return `${block?.text}`;
}
