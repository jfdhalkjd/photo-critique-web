import React from 'react';

interface CritiqueShowcaseProps {
  previewUrls: string[];
  comments: string[];
  conclusion?: string | null;
  userNickname?: string | null;
}

export const CritiqueShowcase: React.FC<CritiqueShowcaseProps> = ({ 
  previewUrls, 
  comments, 
}) => {
  // 【核心修复】解决点评内容“挤在一起”的问题
  // 如果后台传回的点评是一个大长串，我们需要按“@”符号来自动切分
  let processedComments = [...comments];
  
  if (comments.length === 1 && previewUrls.length > 1) {
    const fullText = comments[0];
    // 通过正则表达式寻找以 @ 开头的段落进行切分
    const splitParts = fullText.split(/(?=@)/g).filter(p => p.trim().length > 0);
    if (splitParts.length > 0) {
      processedComments = splitParts;
    }
  }

  return (
    <div className="space-y-8 px-4 pb-12 bg-gray-50/30">
      {previewUrls.map((img, index) => {
        const currentCritique = processedComments[index] || "";
        
        return (
          <div key={index} className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden transition-all hover:shadow-lg">
            <div className="flex flex-col md:flex-row p-5 gap-8">
              {/* 照片区：强制裁切黑边，比例更美观 */}
              <div className="w-full md:w-2/5 aspect-[4/3] relative overflow-hidden rounded-2xl shadow-inner bg-black">
                <img
                  src={img}
                  alt={`作品 ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              {/* 点评区：强化颜色对比与排版 */}
              <div className="w-full md:w-3/5 flex flex-col justify-start py-2">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {currentCritique ? (
                    currentCritique.split('\n').map((line, i) => {
                      const trimmedLine = line.trim();
                      if (!trimmedLine) return <div key={i} className="h-2" />;

                      // 【视觉升级】识别昵称行：字号加大、颜色变深绿、底部加细线
                      if (trimmedLine.startsWith('@')) {
                        return (
                          <div key={i} className="text-2xl font-black text-green-800 mb-6 pb-2 border-b-2 border-green-100 inline-block">
                            {trimmedLine}
                          </div>
                        );
                      }
                      
                      // 普通正文：保持稳重的深灰色，与绿色的标题形成鲜明反差
                      return (
                        <p key={i} className="mb-4 text-gray-700 text-lg font-medium tracking-tight">
                          {trimmedLine}
                        </p>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 italic">
                      ✨ 趣小导正在努力写点评中...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};