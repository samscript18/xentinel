"use client";

import type { ReactNode } from "react";

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function isBullet(line: string) {
  return /^[-*]\s+/.test(line);
}

function isNumbered(line: string) {
  return /^\d+\.\s+/.test(line);
}

function cleanListMarker(line: string) {
  return line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");
}

export function AnalystResponse({ content }: { content: string }) {
  const lines = content.split("\n").map((line) => line.trim());
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line) {
      index += 1;
      continue;
    }

    if (isBullet(line)) {
      const items: string[] = [];

      while (index < lines.length && isBullet(lines[index] ?? "")) {
        items.push(cleanListMarker(lines[index] ?? ""));
        index += 1;
      }

      blocks.push(
        <ul key={`ul-${index}`} className="space-y-2 pl-4">
          {items.map((item) => (
            <li key={item} className="list-disc marker:text-cyan-200">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (isNumbered(line)) {
      const items: string[] = [];

      while (index < lines.length && isNumbered(lines[index] ?? "")) {
        items.push(cleanListMarker(lines[index] ?? ""));
        index += 1;
      }

      blocks.push(
        <ol key={`ol-${index}`} className="space-y-2 pl-4">
          {items.map((item) => (
            <li key={item} className="list-decimal marker:text-violet-200">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    blocks.push(
      <p key={`p-${index}`}>
        {renderInlineMarkdown(line)}
      </p>
    );
    index += 1;
  }

  return <div className="space-y-3 text-sm leading-6">{blocks}</div>;
}
