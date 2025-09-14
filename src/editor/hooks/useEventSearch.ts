// src/editor/hooks/useEventSearch.ts
import { useMemo } from "react";
import type { ComponentEvent } from "../stores/component-config";

// 这个Hook专门负责事件的搜索、评分和排序逻辑
export function useEventSearch(events: ComponentEvent[] = [], keyword: string) {
  const filteredEvents = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase();
    if (!trimmedKeyword) {
      return events;
    }

    const scoredEvents = events
      .map((event) => {
        const eventLabel = event.label.toLowerCase();
        let score = 0;

        if (eventLabel.includes(trimmedKeyword)) {
          score = 1; // 基础分
          if (eventLabel.startsWith(trimmedKeyword)) score += 2; // 开头匹配
          if (eventLabel.endsWith(trimmedKeyword)) score += 1.5; // 结尾匹配
          if (eventLabel === trimmedKeyword) score += 3; // 完全匹配
        }
        return { ...event, score };
      })
      .filter((event) => event.score > 0)
      .sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score; // 按分数从高到低
        }
        return a.label.length - b.label.length; // 分数相同按长度从短到长
      });

    return scoredEvents;
  }, [events, keyword]);

  return filteredEvents;
}
