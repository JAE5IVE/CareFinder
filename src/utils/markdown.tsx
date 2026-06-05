/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let inList = false;

  const parseInline = (text: string): React.ReactNode[] => {
    // Basic regex parser for inline items: **bold** and *italic*
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/(\*\*|__)(.*?)\1/);
      const italicMatch = remaining.match(/(\*|_)(.*?)\1/);

      // Check which one occurs first
      const boldIdx = boldMatch && boldMatch.index !== undefined ? boldMatch.index : Infinity;
      const italicIdx = italicMatch && italicMatch.index !== undefined ? italicMatch.index : Infinity;

      if (boldIdx === Infinity && italicIdx === Infinity) {
        parts.push(remaining);
        break;
      }

      if (boldIdx < italicIdx && boldMatch) {
        // Add preceding text
        if (boldIdx > 0) {
          parts.push(remaining.substring(0, boldIdx));
        }
        parts.push(
          <strong key={`b-${keyIdx++}`} className="font-semibold text-gray-950 dark:text-white">
            {boldMatch[2]}
          </strong>
        );
        remaining = remaining.substring(boldIdx + boldMatch[0].length);
      } else if (italicMatch) {
        // Add preceding text
        if (italicIdx > 0) {
          parts.push(remaining.substring(0, italicIdx));
        }
        parts.push(
          <em key={`i-${keyIdx++}`} className="italic text-gray-800 dark:text-gray-200">
            {italicMatch[2]}
          </em>
        );
        remaining = remaining.substring(italicIdx + italicMatch[0].length);
      }
    }

    return parts.length > 0 ? parts : [text];
  };

  const flushList = (key: string) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key} className="list-disc list-inside space-y-1 my-2.5 text-gray-700 dark:text-gray-300">
          {currentList}
        </ul>
      );
      currentList = [];
      inList = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // End list if line is empty or doesn't start with a bullets
    if (trimmed === '' || !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
      if (inList) {
        flushList(`list-${idx}`);
      }
    }

    if (trimmed === '') {
      elements.push(<div key={`br-${idx}`} className="h-2" />);
      return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${idx}`} className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mt-4 first:mt-0 mb-1.5">
          {parseInline(trimmed.substring(4))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${idx}`} className="text-lg font-bold text-gray-900 dark:text-white mt-5 first:mt-0 mb-2">
          {parseInline(trimmed.substring(3))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${idx}`} className="text-xl font-extrabold text-gray-900 dark:text-white mt-6 first:mt-0 mb-2.5">
          {parseInline(trimmed.substring(2))}
        </h1>
      );
    }
    // Blockquotes
    else if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${idx}`} className="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 px-4 py-2.5 my-3 rounded-r-md text-sm italic">
          {parseInline(trimmed.substring(2))}
        </blockquote>
      );
    }
    // Lists
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      currentList.push(
        <li key={`li-${idx}-${currentList.length}`} className="text-sm leading-relaxed">
          {parseInline(trimmed.substring(2))}
        </li>
      );
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={`p-${idx}`} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2 last:mb-0">
          {parseInline(line)}
        </p>
      );
    }
  });

  if (inList) {
    flushList(`list-end`);
  }

  return <div className="space-y-1.5">{elements}</div>;
};
