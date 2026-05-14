import React from 'react';

// 这里的名字必须和报错信息里的一模一样
interface CritiqueShowcaseProps {
  previewUrls: string[];
  comments: string[];
  conclusion?: string | null;
  userNickname?: string | null;
}

export const CritiqueShowcase: React.FC<CritiqueShowcaseProps> = ({ 
  previewUrls, 
  comments, 
  userNickname 
}) => {
  return (
    <div className="space-y-6 px-4 pb-10">
      {previewUrls.map((img, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row p-4 gap-6">
            {/* 照片区：自动裁切 */}
            <div className="w-full md:w-1/3 aspect-square relative overflow-hidden rounded-xl border border-gray-50">
              <img
                src={img}
                alt={`作品 ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* 点评区 */}
            <div className="w-full md:w-2/3 flex flex-col justify-center py-2">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {comments[index] ? (
                  comments[index].split('\n').map((line, i) => {
                    // 自动美化昵称行
                    if (line.includes('@')) {
                      return (
                        <div key={i} className="text-xl font-bold text-green-700 mb-4">
                          {line}
                        </div>
                      );
                    }
                    return <p key={i} className="mb-3">{line}</p>;
                  })
                ) : (
                  <span className="text-gray-400 italic text-sm">(暂无文字点评)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};