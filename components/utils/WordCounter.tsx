'use client'

import { useMemo } from 'react';

const getWordCount = (text: string): number => {
  if (!text.trim()) {
    return 0;
  }
  return text.trim().split(/\s+/).length;
};

export default function WordCounter({ text, minWords }: { text: string, minWords: number }) {
  const wordCount = useMemo(() => getWordCount(text), [text]);
  const isSufficient = wordCount >= minWords;

  return (
    <div className={`text-sm font-medium pr-2 ${isSufficient ? 'text-green-600' : 'text-gray-500'}`}>
      Words: {wordCount} / {minWords}+
    </div>
  );
}