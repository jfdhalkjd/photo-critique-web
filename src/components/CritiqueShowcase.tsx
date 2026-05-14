import React from 'react';

interface CritiqueShowcaseProps {
  images: string[];
  critiques: string[];
}

const CritiqueShowcase: React.FC<CritiqueShowcaseProps> = ({ images, critiques }) => {
  return (
    <div className="space-y-6 px-4 pb-10">
      {images.map((img, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row p-4 gap-6">
            {/* 左侧图片区域：自动裁切黑边 */}
            <div className="w-full md:w-1/3 aspect-square relative overflow-hidden rounded-xl border border-gray-50">
              <img
                src={img}
                alt={`作品 ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* 右侧点评区域：精准匹配第 N 张的点评 */}
            <div className="w-full md:w-2/3 flex flex-col justify-center py-2">
              <div className="prose prose-slate max-w-none">
                {/* 
                   这里使用特殊逻辑：
                   1. 确保只显示当前索引对应的点评 critiques[index]
                   2. 对点评文字进行格式化处理
                */}
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {critiques[index] ? (
                    critiques[index].split('\n').map((line, i) => {
                      // 识别带 @ 的昵称行，进行特殊样式美化
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
                    <span className="text-gray-400 italic text-sm">
                      (本条暂无文字点评，请稍后在扣子工作流中检查输出字段是否齐全。)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CritiqueShowcase;