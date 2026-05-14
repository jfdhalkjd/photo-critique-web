import React from 'react';

interface CritiqueShowcaseProps {
  images: string[];
  critiques: string[];
}

// 核心改动：在 const 前面直接加了 export，这样大厅文件就能找到它了
export const CritiqueShowcase: React.FC<CritiqueShowcaseProps> = ({ images, critiques }) => {
  return (
    <div className="space-y-6 px-4 pb-10">
      {images.map((img, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row p-4 gap-6">
            {/* 照片展示区：已加入 object-cover 自动裁黑边 */}
            <div className="w-full md:w-1/3 aspect-square relative overflow-hidden rounded-xl border border-gray-50">
              <img
                src={img}
                alt={`作品 ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* 点评文字区：昵称已加粗、变绿、加大 */}
            <div className="w-full md:w-2/3 flex flex-col justify-center py-2">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {critiques[index] ? (
                  critiques[index].split('\n').map((line, i) => {
                    // 自动识别带 @ 的昵称行进行特殊美化
                    if (line.includes('@')) {
                      return (
                        <div key={i} className="text-xl font-bold text-green-700 mb-4 tracking-wide">
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