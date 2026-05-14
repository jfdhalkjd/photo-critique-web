"use client";

import { SeniorMarkdown } from "@/components/senior-markdown";

type Props = {
  markdown: string;
};

export function CritiqueResult({ markdown }: Props) {
  return (
    <section
      className="critique-md rounded-2xl border-2 border-sky-100 bg-white/95 p-4 shadow-lg sm:p-6"
      aria-label="点评结果"
    >
      <SeniorMarkdown variant="default">{markdown}</SeniorMarkdown>
    </section>
  );
}
