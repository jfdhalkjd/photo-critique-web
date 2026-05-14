import React from 'react';

interface CritiqueShowcaseProps {
  previewUrls: string[];
  comments: string[];
  conclusion?: string | null;
  userNickname?: string | null;
}

/**
 * 智能拆分点评文本,确保与图片数量对齐。
 * - 覆盖三种后端返回情况:
 *   (1) comments 数量已与 previewUrls 匹配 → 直接返回
 *   (2) 全部合并到 comments[0] → 合并后按 @昵称 拆分
 *   (3) 部分合并(如 2 张图 3 条评论 / 3 张图 1 条评论) → 合并再拆,数量超额则尾部聚合
 */
function splitCritiques(comments: string[], imageCount: number): string[] {
  if (imageCount === 0) return comments;
  if (comments.length === imageCount) return comments;

  // 合并所有内容再拆,可同时处理 (2) 和 (3)
  const merged = comments.join('\n\n').trim();
  if (!merged) return comments;

  // 前瞻断言:只在 "@ + 非空白" 之前拆分,保留 @ 在段首,避免误切孤立 @
  const rawParts = merged
    .split(/(?=@[^\s@])/g)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (rawParts.length === 0) return comments;

  // 丢弃前置非 @ 引导段,保证 index 与 previewUrls 对齐
  const atParts = rawParts.filter(p => p.startsWith('@'));
  const finalParts = atParts.length > 0 ? atParts : rawParts;

  // 评论数 > 图片数:多出的并到最后一项,避免漏内容
  if (finalParts.length > imageCount) {
    const head = finalParts.slice(0, imageCount - 1);
    const tail = finalParts.slice(imageCount - 1).join('\n\n');
    return [...head, tail];
  }

  return finalParts;
}

export const CritiqueShowcase: React.FC<CritiqueShowcaseProps> = ({
  previewUrls,
  comments,
}) => {
  const processedComments = splitCritiques(comments, previewUrls.length);

  return (
    <div className="space-y-12 px-4 pb-16 bg-gray-50/30">
      {previewUrls.map((img, index) => {
        const currentCritique = processedComments[index] || '';

        return (
          <div
            key={index}
            className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col md:flex-row p-6 md:p-8 gap-8">
              {/* 照片区 */}
              <div className="w-full md:w-2/5 aspect-[4/3] relative overflow-hidden rounded-2xl bg-black flex-shrink-0">
                <img
                  src={img}
                  alt={`作品 ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              {/* 点评区 */}
              <div className="w-full md:w-3/5 flex flex-col justify-start py-2">
                {currentCritique ? (
                  <div className="text-gray-700">
                    {currentCritique.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      if (!trimmed) return <div key={i} className="h-3" />;

                      // 昵称行 → 色块标签
                      if (trimmed.startsWith('@')) {
                        return (
                          <div key={i} className="mb-6 mt-1">
                            <span
                              className="
                                inline-block
                                bg-green-100 text-green-800
                                font-bold text-xl md:text-2xl
                                px-5 py-2.5
                                rounded-xl
                                shadow-sm
                                tracking-wide
                              "
                            >
                              {trimmed}
                            </span>
                          </div>
                        );
                      }

                      // 正文段落
                      return (
                        <p
                          key={i}
                          className="mb-5 text-gray-700 text-base md:text-lg leading-loose tracking-wide"
                        >
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-lg py-12">
                    ✨ 待点评...
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};