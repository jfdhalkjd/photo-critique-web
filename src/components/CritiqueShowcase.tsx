import React, { useRef, useState } from 'react';

interface CritiqueShowcaseProps {
  previewUrls: string[];
  comments: string[];
  conclusion?: string | null;
  userNickname?: string | null;
}

/* ============ 工具函数 ============ */

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

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ fontWeight: 700, color: '#3D2C1F' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/* ============ 设计令牌 ============ */
const C = {
  bgPage: '#F7F1E6',           // 暖米黄底
  bgPaper: '#FFFCF5',          // 纸张色
  bgFrame: '#FCEFD3',          // 相框暖色
  bgFrameDeep: '#F5DDA8',      // 相框深一档
  inkTitle: '#3D2C1F',         // 深咖标题
  inkBody: '#5A4634',          // 暖咖正文
  inkMuted: '#A89580',         // 浅咖辅助
  accent: '#E89B4E',           // 暖橙
  accentDeep: '#C97A2B',       // 深橙
  accentSoft: '#FFD89B',       // 浅金
  tapeYellow: 'rgba(252, 211, 77, 0.55)',  // 半透明胶带·黄
  tapePink: 'rgba(253, 186, 184, 0.55)',   // 半透明胶带·粉
  conclBg1: '#FFF3DC',
  conclBg2: '#FFE6BC',
  shadow: '0 4px 20px -8px rgba(184, 134, 60, 0.25)',
  shadowDeep: '0 8px 32px -12px rgba(184, 134, 60, 0.35)',
};

const FONT_SERIF =
  '"Source Han Serif SC", "Noto Serif SC", "Songti SC", "STSong", "SimSun", Georgia, serif';
const FONT_SANS =
  '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';

/* ============ 装饰子组件 ============ */

// 手账胶带
const Tape: React.FC<{
  color: string;
  rotate: number;
  top: number | string;
  left?: number | string;
  right?: number | string;
  width?: number | string;
}> = ({ color, rotate, top, left, right, width = 80 }) => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      top,
      left,
      right,
      width,
      height: 24,
      background: color,
      transform: `rotate(${rotate}deg)`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      zIndex: 2,
      pointerEvents: 'none',
    }}
  />
);

// 小印章
const Stamp: React.FC<{ index: number }> = ({ index }) => (
  <div
    style={{
      position: 'absolute',
      top: 18,
      right: 18,
      width: 56,
      height: 56,
      borderRadius: '50%',
      border: `2px solid ${C.accentDeep}`,
      background: 'rgba(255,255,255,0.92)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT_SERIF,
      color: C.accentDeep,
      transform: 'rotate(-8deg)',
      boxShadow: '0 2px 6px rgba(184, 134, 60, 0.2)',
      zIndex: 3,
    }}
  >
    <div style={{ fontSize: 9, letterSpacing: '0.15em', lineHeight: 1 }}>NO.</div>
    <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1, marginTop: 2 }}>
      {String(index).padStart(2, '0')}
    </div>
  </div>
);

/* ============ 导出工具 ============ */

async function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`加载失败:${src}`));
    document.head.appendChild(s);
  });
}

async function exportAsImage(el: HTMLElement, filename: string) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  // @ts-ignore
  const canvas = await window.html2canvas(el, {
    backgroundColor: C.bgPage,
    scale: 2,
    useCORS: true,
    logging: false,
  });
  canvas.toBlob((blob: Blob | null) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

async function exportAsPDF(el: HTMLElement, filename: string) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  // @ts-ignore
  const canvas = await window.html2canvas(el, {
    backgroundColor: C.bgPage,
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  // @ts-ignore
  const { jsPDF } = window.jspdf;
  const pdfW = 210; // A4 mm
  const pdfH = (canvas.height * pdfW) / canvas.width;
  const pdf = new jsPDF({
    orientation: pdfH > pdfW ? 'p' : 'l',
    unit: 'mm',
    format: [pdfW, pdfH],
  });
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
  pdf.save(filename);
}

/* ============ 主组件 ============ */

export const CritiqueShowcase: React.FC<CritiqueShowcaseProps> = ({
  previewUrls,
  comments,
  conclusion,
}) => {
  const processedComments = splitCritiques(comments, previewUrls.length);
  const hasConclusion = !!conclusion && conclusion.trim().length > 0;

  const captureRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<null | 'png' | 'pdf'>(null);

  const dateStamp = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const fileBase = `摄影小结_${new Date().toISOString().slice(0, 10)}`;

  const handleExport = async (type: 'png' | 'pdf') => {
    if (!captureRef.current || exporting) return;
    setExporting(type);
    try {
      if (type === 'png') {
        await exportAsImage(captureRef.current, `${fileBase}.png`);
      } else {
        await exportAsPDF(captureRef.current, `${fileBase}.pdf`);
      }
    } catch (e) {
      alert('导出失败,请刷新页面后重试');
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div
      style={{
        background: C.bgPage,
        minHeight: '100vh',
        padding: '32px 16px 80px',
        fontFamily: FONT_SANS,
        backgroundImage: `radial-gradient(circle at 20% 10%, rgba(255, 216, 155, 0.25) 0%, transparent 40%),
                          radial-gradient(circle at 80% 80%, rgba(253, 186, 184, 0.18) 0%, transparent 45%)`,
      }}
    >
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        {/* ========== 导出按钮(不进截图) ========== */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => handleExport('png')}
            disabled={!!exporting}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: `1.5px solid ${C.accent}`,
              background: exporting === 'png' ? C.accentSoft : '#fff',
              color: C.accentDeep,
              fontSize: 14,
              fontWeight: 600,
              cursor: exporting ? 'wait' : 'pointer',
              boxShadow: C.shadow,
              fontFamily: FONT_SANS,
              transition: 'all 0.2s',
            }}
          >
            {exporting === 'png' ? '⏳ 生成中…' : '📷 保存长图'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: `1.5px solid ${C.accent}`,
              background: exporting === 'pdf' ? C.accentSoft : C.accent,
              color: exporting === 'pdf' ? C.accentDeep : '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: exporting ? 'wait' : 'pointer',
              boxShadow: C.shadow,
              fontFamily: FONT_SANS,
              transition: 'all 0.2s',
            }}
          >
            {exporting === 'pdf' ? '⏳ 生成中…' : '📄 导出 PDF'}
          </button>
        </div>

        {/* ========== 可被截图的内容区 ========== */}
        <div ref={captureRef} style={{ background: C.bgPage, padding: '8px 4px' }}>

          {/* ----- 页头 ----- */}
          <header style={{ textAlign: 'center', marginBottom: 40, position: 'relative' }}>
            <div
              style={{
                display: 'inline-block',
                position: 'relative',
                padding: '8px 28px',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: '0.5em',
                  color: C.accentDeep,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                  fontWeight: 600,
                  fontFamily: FONT_SANS,
                }}
              >
                Photography · Diary
              </p>
              <h1
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 34,
                  fontWeight: 700,
                  color: C.inkTitle,
                  letterSpacing: '0.08em',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                今 日 摄 影 小 结
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: C.inkMuted,
                  marginTop: 10,
                  letterSpacing: '0.2em',
                  fontFamily: FONT_SERIF,
                }}
              >
                {dateStamp}
              </p>
            </div>
            {/* 头部装饰线 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginTop: 18,
              }}
            >
              <span style={{ width: 60, height: 1, background: C.accentSoft }} />
              <span style={{ color: C.accent, fontSize: 14 }}>✿</span>
              <span style={{ width: 60, height: 1, background: C.accentSoft }} />
            </div>
          </header>

          {/* ----- 作品卡片 ----- */}
          <div>
            {previewUrls.map((img, index) => {
              const currentCritique = processedComments[index] || '';
              const isOdd = index % 2 === 0;

              return (
                <article
                  key={index}
                  style={{
                    background: C.bgPaper,
                    borderRadius: 18,
                    boxShadow: C.shadowDeep,
                    border: `1px solid rgba(220, 195, 145, 0.35)`,
                    overflow: 'visible',
                    marginBottom: 40,
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 6fr)',
                    position: 'relative',
                  }}
                  className="critique-card"
                >
                  {/* 顶部胶带装饰 */}
                  <Tape
                    color={isOdd ? C.tapeYellow : C.tapePink}
                    rotate={isOdd ? -3 : 4}
                    top={-10}
                    left={isOdd ? 30 : undefined}
                    right={isOdd ? undefined : 30}
                    width={90}
                  />

                  {/* ----- 图片相框区 ----- */}
                  <div
                    style={{
                      padding: '24px 20px 24px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                    className="critique-image-pad"
                  >
                    <div
                      style={{
                        width: '100%',
                        background: `linear-gradient(135deg, ${C.bgFrame} 0%, ${C.bgFrameDeep} 100%)`,
                        padding: 14,
                        borderRadius: 10,
                        boxShadow:
                          'inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 12px -4px rgba(184, 134, 60, 0.2)',
                        position: 'relative',
                      }}
                    >
                      <Stamp index={index + 1} />
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '4 / 3',
                          background: '#1a1a1a',
                          borderRadius: 4,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.4)',
                        }}
                      >
                        <img
                          src={img}
                          alt={`作品 ${index + 1}`}
                          crossOrigin="anonymous"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      </div>
                      {/* 相框底标签 */}
                      <div
                        style={{
                          marginTop: 10,
                          textAlign: 'center',
                          fontFamily: FONT_SERIF,
                          fontSize: 11,
                          color: C.accentDeep,
                          letterSpacing: '0.3em',
                        }}
                      >
                        · MOMENT {String(index + 1).padStart(2, '0')} ·
                      </div>
                    </div>
                  </div>

                  {/* ----- 文字区 ----- */}
                  <div
                    style={{
                      padding: '34px 32px 30px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                    className="critique-text"
                  >
                    {currentCritique ? (
                      <div>
                        {currentCritique.split('\n').map((line, i) => {
                          const trimmed = line.trim();
                          if (!trimmed) return <div key={i} style={{ height: 8 }} />;

                          // 昵称 → 便签风格
                          if (trimmed.startsWith('@')) {
                            return (
                              <div
                                key={i}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  marginBottom: 22,
                                  paddingBottom: 14,
                                  borderBottom: `2px dashed ${C.accentSoft}`,
                                  width: '100%',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 18,
                                    transform: 'translateY(-1px)',
                                  }}
                                >
                                  ✎
                                </span>
                                <span
                                  style={{
                                    fontFamily: FONT_SERIF,
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: C.inkTitle,
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  {trimmed}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <p
                              key={i}
                              style={{
                                margin: '0 0 14px',
                                color: C.inkBody,
                                fontSize: 15,
                                lineHeight: 2,
                                letterSpacing: '0.03em',
                                fontFamily: FONT_SERIF,
                              }}
                            >
                              {renderInline(trimmed)}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 200,
                          color: C.inkMuted,
                        }}
                      >
                        ✨ 待点评...
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* ----- 晚安寄语 ----- */}
          {hasConclusion && (
            <section
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 22,
                border: `1px solid rgba(220, 195, 145, 0.5)`,
                background: `linear-gradient(135deg, ${C.conclBg1} 0%, ${C.conclBg2} 100%)`,
                marginTop: 36,
                boxShadow: C.shadowDeep,
              }}
            >
              {/* 装饰胶带 */}
              <Tape color={C.tapeYellow} rotate={-4} top={-10} left={'50%'} width={100} />

              {/* 大月亮水印 */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  fontSize: 180,
                  opacity: 0.08,
                  pointerEvents: 'none',
                  lineHeight: 1,
                }}
              >
                🌙
              </div>

              <div style={{ position: 'relative', padding: '40px 36px 36px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    paddingBottom: 22,
                    marginBottom: 24,
                    borderBottom: `2px dashed ${C.accent}`,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      boxShadow: '0 2px 8px rgba(184, 134, 60, 0.2)',
                    }}
                  >
                    🌙
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.4em',
                        color: C.accentDeep,
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Evening Note
                    </div>
                    <h2
                      style={{
                        fontFamily: FONT_SERIF,
                        fontSize: 22,
                        fontWeight: 700,
                        color: C.inkTitle,
                        margin: '4px 0 0',
                        letterSpacing: '0.08em',
                      }}
                    >
                      晚 安 寄 语
                    </h2>
                  </div>
                </div>
                <div
                  style={{
                    color: C.inkBody,
                    fontSize: 16,
                    lineHeight: 2,
                    letterSpacing: '0.03em',
                    fontFamily: FONT_SERIF,
                  }}
                >
                  {conclusion!.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={i} style={{ height: 10 }} />;
                    return (
                      <p key={i} style={{ margin: '0 0 12px' }}>
                        {renderInline(trimmed)}
                      </p>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ----- 页脚 ----- */}
          <footer style={{ textAlign: 'center', marginTop: 40 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 12,
              }}
            >
              <span style={{ width: 40, height: 1, background: C.accentSoft }} />
              <span style={{ color: C.accent, fontSize: 14 }}>✿</span>
              <span style={{ width: 40, height: 1, background: C.accentSoft }} />
            </div>
            <p
              style={{
                color: C.inkMuted,
                fontSize: 12,
                letterSpacing: '0.3em',
                margin: 0,
                fontFamily: FONT_SERIF,
              }}
            >
              咱们一起记录 · 一起进步
            </p>
          </footer>
        </div>
      </div>

      {/* 响应式 */}
      <style>{`
        @media (max-width: 640px) {
          .critique-card {
            grid-template-columns: 1fr !important;
          }
          .critique-image-pad {
            padding: 24px 20px 0 20px !important;
          }
          .critique-text {
            padding: 24px 24px 28px !important;
          }
        }
      `}</style>
    </div>
  );
};