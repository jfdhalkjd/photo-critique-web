"use client";

import { CritiqueRichText } from "@/components/CritiqueRichText";

export type CritiqueShowcaseProps = {
  /** 与上传顺序一致：第 i 张对应 comments[i] */
  previewUrls: string[];
  comments: string[];
  conclusion: string | null;
  /** 来自 API / raw 解析；用于替换 {{user_nickname}} */
  userNickname?: string | null;
};

export function CritiqueShowcase({
  previewUrls,
  comments,
  conclusion,
  userNickname,
}: CritiqueShowcaseProps) {
  const rowCount = Math.max(previewUrls.length, comments.length);
  const raw0 = comments[0]?.trim() ?? "";
  /** 整段未拆成多行时：一次展示原文，缩略图顺序与上传一致 */
  const mergedMarkdownFallback =
    comments.length === 1 &&
    previewUrls.length > 1 &&
    raw0.length > 0 &&
    (/\|[^\n]+\|/.test(raw0) || raw0.length >= 400);

  return (
    <section
      className="mt-10 space-y-8 rounded-3xl border-2 border-sky-200/80 bg-gradient-to-b from-[#fffbf5] via-cream to-[#f7f4ed] p-5 shadow-xl sm:p-8"
      aria-label="照片点评展示"
    >
      <header className="border-b-2 border-warmorange-200/60 pb-4 text-center">
        <h2 className="text-[1.5rem] font-bold tracking-wide text-sky-900 sm:text-[1.65rem]">
          趣小导的点评
        </h2>
        <p className="mt-2 text-[1.125rem] leading-relaxed text-slate-700">
          {rowCount > 0
            ? "左侧是您上传的照片（按顺序），右侧是对应的文字点评"
            : "本次返回中暂无逐张点评条目，您可直接阅读下方导师寄语"}
        </p>
      </header>

      {rowCount > 0 && mergedMarkdownFallback && (
        <div className="space-y-4">
          <p className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-center text-[1.05rem] leading-relaxed text-slate-700">
            本条返回为整段点评（含表格），已完整展示在下方。缩略图顺序与您上传顺序一致，请对照阅读。
          </p>
          <div className="flex flex-col gap-6 rounded-2xl border-2 border-sky-100 bg-white/95 p-4 shadow-md ring-1 ring-orange-100/60 sm:flex-row sm:items-start sm:p-6">
            <div className="flex flex-wrap justify-center gap-3 sm:w-56 sm:flex-col sm:items-stretch">
              {previewUrls.map((url, i) => (
                <div
                  key={`thumb-${url}-${i}`}
                  className="aspect-square w-[7.5rem] shrink-0 overflow-hidden rounded-xl border-2 border-sky-200 bg-neutral-900 shadow-inner"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`您上传的第 ${i + 1} 张照片`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1 rounded-xl bg-[#fffdf8] p-4 ring-1 ring-sky-100/80">
              <CritiqueRichText markdown={raw0} userNickname={userNickname} variant="compact" />
            </div>
          </div>
        </div>
      )}

      {rowCount > 0 && !mergedMarkdownFallback && (
        <div className="space-y-6">
          {Array.from({ length: rowCount }, (_, i) => {
            const url = previewUrls[i];
            const comment = comments[i];
            const hasText = Boolean(comment?.trim());

            return (
              <article
                key={`row-${i}`}
                className="overflow-hidden rounded-2xl border-2 border-sky-100 bg-white/95 shadow-md ring-1 ring-orange-100/60"
              >
                <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
                  <div className="mx-auto w-full max-w-[280px] shrink-0 sm:mx-0 sm:w-52">
                    {url ? (
                      <div className="aspect-square w-full overflow-hidden rounded-xl border-2 border-sky-200 bg-neutral-900 shadow-inner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`您上传的第 ${i + 1} 张照片`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-[1.05rem] text-slate-500">
                        （无对应预览图）
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 rounded-xl bg-[#fffdf8] p-4 ring-1 ring-sky-100/80">
                    {hasText ? (
                      <CritiqueRichText
                        markdown={comment!.trim()}
                        userNickname={userNickname}
                        variant="compact"
                      />
                    ) : (
                      <p className="text-[1.125rem] leading-relaxed text-slate-600">
                        （本条暂无文字点评，请稍后在扣子工作流中检查输出字段是否齐全。）
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {conclusion && conclusion.trim().length > 0 && (
        <aside
          className="rounded-3xl border-2 border-warmorange-300/80 bg-gradient-to-br from-orange-50 via-[#fff8f0] to-sky-50 p-6 shadow-lg sm:p-8"
          aria-label="导师寄语"
        >
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-warmorange-200/70 pb-3">
            <span className="text-2xl" aria-hidden="true">
              &#128172;
            </span>
            <h3 className="text-[1.45rem] font-bold text-sky-900">导师寄语</h3>
          </div>
          <CritiqueRichText markdown={conclusion} userNickname={userNickname} variant="default" />
        </aside>
      )}
    </section>
  );
}
