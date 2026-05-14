import React from 'react';

interface CritiqueShowcaseProps {
  previewUrls: string[];
  comments: string[];
  conclusion?: string | null;
  userNickname?: string | null;
}

/**
 * 智能拆分点评文本,确保与图片数量对齐。
 */
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

export const CritiqueShowcase: React.FC<CritiqueShowcaseProps> = ({
  previewUrls,
  comments,
  conclusion, // ✅ 核心修复 1：在这里把 conclusion 接收进来
}) => {
  const processedComments = splitCritiques(comments, previewUrls.length);

  return (
    <div className="space-y-12 px-4 pb-16 bg-gray-50/30">
      
      {/* 1. 照片与逐张点评区域 */}
      {previewUrls.map((img, index) => {
        const currentCritique = processedComments[index] || '';

        return (
          <div
            key={index}
            className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col md:flex-row p-6 md:p-8 gap-8">
              <div className="w-full md:w-2/5 aspect-[4/3] relative overflow-hidden rounded-2xl bg-black flex-shrink-0">
                <img
                  src={img}
                  alt={`作品 ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              <div className="w-full md:w-3/5 flex flex-col justify-start py-2">
                {currentCritique ? (
                  <div className="text-gray-700">
                    {currentCritique.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      if (!trimmed) return <div key={i} className="h-3" />;

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
                    ✨ 趣小导正在努力写点评中...
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* 2. ✅ 核心修复 2：新增底部工作流总结 (今日小结/寄语) 区域 */}
      {conclusion && (
        <div className="mt-16 bg-gradient-to-b from-orange-50 to-amber-50/50 rounded-3xl shadow-sm border border-orange-200 p-8 md:p-10">
          <div className="text-gray-800">
            {conclusion.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={i} className="h-4" />;
              
              // 自动识别标题或序号（如 🌟、🌻、1️⃣）进行加粗放大，让排版更有重点
              const isHighlight = trimmed.includes('🌟') || trimmed.includes('🌻') || /^\d️⃣/.test(trimmed);
              
              return (
                <div 
                  key={i} 
                  className={`mb-4 tracking-wide ${
                    isHighlight 
                      ? 'font-bold text-orange-900 text-xl md:text-2xl mt-8' 
                      : 'text-lg md:text-xl leading-loose text-gray-700'
                  }`}
                >
                  {trimmed}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
    </div>
  );
};