import React from 'react';

interface CritiqueShowcaseProps {
  previewUrls: string[];
  comments: string[];
  conclusion?: string | null;
  userNickname?: string | null;
}

/* -------------------------------------------------------- */
/* 工具函数:智能拆分点评 + 简易 Markdown 渲染                */
/* -------------------------------------------------------- */

function splitCritiques(comments: string[], imageCount: number): string[] {
  if (imageCount === 0) return comments;
  if (comments.length === imageCount) return comments;

  const merged = comments.join('\n\n').trim();
  if (!merged) return comments;

  const rawParts = merged
    .split(/(?=@[^\s@])/g)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (rawParts.length === 0) return comments;

  const atParts = rawParts.filter(p => p.startsWith('@'));
  const finalParts = atParts.length > 0 ? atParts : rawParts;

  if (finalParts.length > imageCount) {
    const head = finalParts.slice(0, imageCount - 1);
    const tail = finalParts.slice(imageCount - 1).join('\n\n');
    return [...head, tail];
  }
  return finalParts;
}

/** 处理 **粗体** 标记,避免 Coze LLM 输出的 markdown 直接显示成 ** */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-stone-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/* -------------------------------------------------------- */
/* 主组件                                                    */
/* -------------------------------------------------------- */

export const CritiqueShowcase: React.FC<CritiqueShowcaseProps> = ({
  previewUrls,
  comments,
  conclusion,
}) => {
  const processedComments = splitCritiques(comments, previewUrls.length);
  const hasConclusion = !!conclusion && conclusion.trim().length > 0;

  return (
    <div className="bg-stone-50 min-h-screen px-4 py-10 md:py-14">
      <div className="max-w-3xl mx-auto">
        {/* ===== 页头 ===== */}
        <header className="text-center mb-10 md:mb-14">
          <p className="text-[11px] md:text-xs text-amber-700/80 tracking-[0.4em] uppercase mb-3 font-medium">
            Photography Notes
          </p>
          <h1 className="text-3xl md:text-4xl font-serif text-stone-800 font-bold tracking-wide">
            今日摄影小结
          </h1>
          <div className="flex items-center justify-center gap-2 mt-5">
            <span className="w-10 h-px bg-amber-300" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="w-10 h-px bg-amber-300" />
          </div>
        </header>

        {/* ===== 作品点评卡片 ===== */}
        <div className="space-y-8 md:space-y-10">
          {previewUrls.map((img, index) => {
            const currentCritique = processedComments[index] || '';

            return (
              <article
                key={index}
                className="bg-white rounded-2xl shadow-[0_2px_24px_-8px_rgba(120,53,15,0.08)] border border-stone-200/70 overflow-hidden"
              >
                <div className="grid md:grid-cols-2">
                  {/* ---- 图片区:object-cover 填满,无黑边 ---- */}
                  <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[380px] bg-stone-100 overflow-hidden">
                    <img
                      src={img}
                      alt={`作品 ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* 编号徽标 */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-full w-11 h-11 flex items-center justify-center font-serif text-stone-800 font-bold text-base shadow-sm">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>

                  {/* ---- 文字区 ---- */}
                  <div className="p-6 md:p-9 flex flex-col justify-center">
                    {currentCritique ? (
                      <div>
                        {currentCritique.split('\n').map((line, i) => {
                          const trimmed = line.trim();
                          if (!trimmed) return <div key={i} className="h-2" />;

                          // 昵称行:左侧竖条 + 衬线字体 + 暖橙细线
                          if (trimmed.startsWith('@')) {
                            return (
                              <div
                                key={i}
                                className="mb-6 pb-4 border-b border-amber-200/60 flex items-center gap-3"
                              >
                                <span className="w-[3px] h-7 bg-amber-400 rounded-full flex-shrink-0" />
                                <span className="text-lg md:text-xl font-serif text-stone-800 font-bold tracking-wide">
                                  {trimmed}
                                </span>
                              </div>
                            );
                          }

                          // 正文段落
                          return (
                            <p
                              key={i}
                              className="mb-4 text-stone-700 text-[15px] md:text-base leading-[1.95] tracking-wide"
                            >
                              {renderInline(trimmed)}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center min-h-[200px] text-stone-400 text-base">
                        ✨ 待点评...
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ===== 底部:晚安寄语 ===== */}
        {hasConclusion && (
          <section className="relative mt-10 md:mt-12 overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-orange-50/50 to-stone-50 shadow-[0_2px_24px_-8px_rgba(120,53,15,0.1)]">
            {/* 装饰性光晕 */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-200/30 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-orange-200/25 blur-3xl" />

            <div className="relative p-7 md:p-10">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-amber-200/50">
                <span className="text-2xl md:text-3xl" aria-hidden="true">🌙</span>
                <div>
                  <p className="text-[10px] md:text-xs text-amber-700/80 tracking-[0.35em] uppercase font-medium">
                    Evening Note
                  </p>
                  <h2 className="text-lg md:text-xl font-serif text-stone-800 font-bold tracking-wide">
                    晚安寄语
                  </h2>
                </div>
              </div>
              <div className="text-stone-700 text-[15px] md:text-base leading-[1.95] tracking-wide">
                {conclusion!.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={i} className="h-3" />;
                  return (
                    <p key={i} className="mb-3">
                      {renderInline(trimmed)}
                    </p>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ===== 页脚 ===== */}
        <footer className="mt-12 md:mt-14 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-8 h-px bg-stone-300" />
            <span className="text-stone-400 text-xs">✦</span>
            <span className="w-8 h-px bg-stone-300" />
          </div>
          <p className="text-xs text-stone-400 tracking-[0.25em]">
            咱们一起记录 · 一起进步
          </p>
        </footer>
      </div>
    </div>
  );
};