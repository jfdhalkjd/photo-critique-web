"use client";

import { CritiqueRichText } from "@/components/CritiqueRichText";

type Props = {
  markdown: string;
  userNickname?: string | null;
};

export function CritiqueResult({ markdown, userNickname }: Props) {
  return (
    <section
      className="critique-md rounded-2xl border-2 border-sky-100 bg-white/95 p-4 shadow-lg sm:p-6"
      aria-label="点评结果"
    >
      <CritiqueRichText markdown={markdown} userNickname={userNickname} variant="default" />
    </section>
  );
}
