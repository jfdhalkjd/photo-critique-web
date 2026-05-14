"use client";

import { SeniorMarkdown } from "@/components/senior-markdown";
import { prepareCritiqueDisplayText } from "@/lib/critique-text";

type Variant = "default" | "compact";

type Props = {
  markdown: string;
  userNickname?: string | null;
  variant: Variant;
};

export function CritiqueRichText({ markdown, userNickname, variant }: Props) {
  const { greeting, body } = prepareCritiqueDisplayText(markdown, userNickname);
  const bodyTrim = body.trim();

  return (
    <div className="critique-rich-text">
      {greeting ? (
        <p className="mb-5 border-b border-emerald-200/90 pb-4 text-[1.2rem] font-bold leading-relaxed text-emerald-900">
          {greeting}
        </p>
      ) : null}
      {bodyTrim.length > 0 ? <SeniorMarkdown variant={variant}>{body}</SeniorMarkdown> : null}
    </div>
  );
}
