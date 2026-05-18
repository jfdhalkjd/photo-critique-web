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

/** 把一段评论拆成 { nickname, paragraphs[] } */
function parseCritique(text: string): { nickname: string | null; paragraphs: string[] } {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let nickname: string | null = null;
  const paragraphs: string[] = [];

  for (const line of lines) {
    if (line.startsWith('@') && !nickname) {
      // 第一行 @ 开头当作昵称
      nickname = line;
    } else {
      paragraphs.push(line);
    }
  }
  return { nickname, paragraphs };
}

/* ============ 设计令牌(整体紧凑约 15%) ============ */
const C = {
  bgPage: '#F7F1E6',
  bgPaper: '#FFFCF5',
  inkTitle: '#3D2C1F',
  inkBody: '#5A4634',
  inkMuted: '#A89580',
  accent: '#E89B4E',
  accentDeep: '#C97A2B',
  accentSoft: '#FFD89B',
  tapeYellow: 'rgba(252, 211, 77, 0.55)',
  tapePink: 'rgba(253, 186, 184, 0.55)',
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

const Tape: React.FC<{
  color: string;
  rotate: number;
  top: number | string;
  left?: number | string;
  right?: number | string;
  width?: number | string;
}> = ({ color, rotate, top, left, right, width = 70 }) => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      top,
      left,
      right,
      width,
      height: 20,
      background: color,
      transform: `rotate(${rotate}deg)`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      zIndex: 2,
      pointerEvents: 'none',
    }}
  />
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
  const pdfW = 210;
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
        padding: '24px 14px 60px',
        fontFamily: FONT_SANS,
        backgroundImage: `radial-gradient(circle at 20% 10%, rgba(255, 216, 155, 0.25) 0%, transparent 40%),
                          radial-gradient(circle at 80% 80%, rgba(253, 186, 184, 0.18) 0%, transparent 45%)`,
      }}
    >
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        {/* ========== 导出按钮 ========== */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => handleExport('png')}
            disabled={!!exporting}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: `1.5px solid ${C.accent}`,
              background: exporting === 'png' ? C.accentSoft : '#fff',
              color: C.accentDeep,
              fontSize: 13,
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
              padding: '8px 16px',
              borderRadius: 999,
              border: `1.5px solid ${C.accent}`,
              background: exporting === 'pdf' ? C.accentSoft : C.accent,
              color: exporting === 'pdf' ? C.accentDeep : '#fff',
              fontSize: 13,
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

        {/* ========== 可截图区 ========== */}
        <div ref={captureRef} style={{ background: C.bgPage, padding: '6px 4px' }}>

          {/* ----- 页头(紧凑版) ----- */}
          <header style={{ textAlign: 'center', marginBottom: 28 }}>
            <p
              style={{
                fontSize: 10,
                letterSpacing: '0.5em',
                color: C.accentDeep,
                textTransform: 'uppercase',
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Photography · Diary
            </p>
            <h1
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 28,
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
                fontSize: 12,
                color: C.inkMuted,
                marginTop: 6,
                letterSpacing: '0.2em',
                fontFamily: FONT_SERIF,
              }}
            >
              {dateStamp}
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 12,
              }}
            >
              <span style={{ width: 50, height: 1, background: C.accentSoft }} />
              <span style={{ color: C.accent, fontSize: 12 }}>✿</span>
              <span style={{ width: 50, height: 1, background: C.accentSoft }} />
            </div>
          </header>

          {/* ----- 作品卡片 ----- */}
          <div>
            {previewUrls.map((img, index) => {
              const raw = processedComments[index] || '';
              const { nickname, paragraphs } = parseCritique(raw);
              const isOdd = index % 2 === 0;

              return (
                <article
                  key={index}
                  style={{
                    background: C.bgPaper,
                    borderRadius: 14,
                    boxShadow: C.shadowDeep,
                    border: `1px solid rgba(220, 195, 145, 0.35)`,
                    overflow: 'visible',
                    marginBottom: 28,
                    padding: '22px 22px 20px',
                    position: 'relative',
                  }}
                  className="critique-card"
                >
                  {/* 顶部胶带 */}
                  <Tape
                    color={isOdd ? C.tapeYellow : C.tapePink}
                    rotate={isOdd ? -3 : 4}
                    top={-9}
                    left={isOdd ? 24 : undefined}
                    right={isOdd ? undefined : 24}
                    width={70}
                  />

                  {/* 昵称行(独立成行,便签风) */}
                  {nickname && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '6px 14px 6px 12px',
                          background: 'linear-gradient(135deg, #FFF6E0 0%, #FFEAC2 100%)',
                          borderLeft: `4px solid ${C.accent}`,
                          borderRadius: '4px 8px 8px 4px',
                          boxShadow: '0 2px 6px -2px rgba(184, 134, 60, 0.2)',
                        }}
                      >
                        <span style={{ fontSize: 14, color: C.accentDeep }}>✎</span>
                        <span
                          style={{
                            fontFamily: FONT_SERIF,
                            fontSize: 17,
                            fontWeight: 700,
                            color: C.inkTitle,
                            letterSpacing: '0.04em',
                          }}
                        >
                          {nickname}
                        </span>
                      </div>

                      {/* 右侧序号贴纸 */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'baseline',
                          gap: 4,
                          padding: '3px 10px',
                          background: C.accentSoft,
                          borderRadius: 4,
                          fontFamily: FONT_SERIF,
                          color: C.accentDeep,
                        }}
                      >
                        <span style={{ fontSize: 9, letterSpacing: '0.2em', fontWeight: 600 }}>
                          NO.
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.05em' }}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 主体:图 + 文 */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 6fr)',
                      gap: 22,
                      alignItems: 'start',
                    }}
                    className="critique-body"
                  >
                    {/* 图片:4:3 长方形容器 + object-cover,自动裁黑边 */}
                    <div
                      style={{
                        background: '#fff',
                        padding: 8,
                        borderRadius: 6,
                        boxShadow:
                          '0 4px 12px -4px rgba(184, 134, 60, 0.25), inset 0 0 0 1px rgba(184, 134, 60, 0.1)',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '4 / 3',
                          overflow: 'hidden',
                          borderRadius: 3,
                          background: '#f5f5f4',
                        }}
                      >
                        <img
                          src={img}
                          alt={`作品 ${index + 1}`}
                          crossOrigin="anonymous"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          textAlign: 'center',
                          fontFamily: FONT_SERIF,
                          fontSize: 9,
                          color: C.inkMuted,
                          letterSpacing: '0.35em',
                        }}
                      >
                        · MOMENT {String(index + 1).padStart(2, '0')} ·
                      </div>
                    </div>

                    {/* 文字区:正文段落 */}
                    <div style={{ paddingTop: 2 }} className="critique-text">
                      {paragraphs.length > 0 ? (
                        paragraphs.map((para, i) => (
                          <p
                            key={i}
                            style={{
                              margin: '0 0 12px',
                              color: C.inkBody,
                              fontSize: 14.5,
                              lineHeight: 1.9,
                              letterSpacing: '0.03em',
                              fontFamily: FONT_SERIF,
                              textIndent: 0,
                            }}
                          >
                            {renderInline(para)}
                          </p>
                        ))
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 140,
                            color: C.inkMuted,
                          }}
                        >
                          ✨ 待点评...
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* ----- 每日寄语 ----- */}
          {hasConclusion && (
            <section
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 18,
                border: `1px solid rgba(220, 195, 145, 0.5)`,
                background: `linear-gradient(135deg, ${C.conclBg1} 0%, ${C.conclBg2} 100%)`,
                marginTop: 26,
                boxShadow: C.shadowDeep,
              }}
            >
              <Tape color={C.tapeYellow} rotate={-4} top={-9} left={'50%'} width={80} />

              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: -24,
                  right: -24,
                  fontSize: 140,
                  opacity: 0.08,
                  pointerEvents: 'none',
                  lineHeight: 1,
                }}
              >
                ✿
              </div>

              <div style={{ position: 'relative', padding: '28px 26px 24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    paddingBottom: 14,
                    marginBottom: 16,
                    borderBottom: `2px dashed ${C.accent}`,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      boxShadow: '0 2px 8px rgba(184, 134, 60, 0.2)',
                    }}
                  >
                    ✿
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.4em',
                        color: C.accentDeep,
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Daily Note
                    </div>
                    <h2
                      style={{
                        fontFamily: FONT_SERIF,
                        fontSize: 19,
                        fontWeight: 700,
                        color: C.inkTitle,
                        margin: '2px 0 0',
                        letterSpacing: '0.08em',
                      }}
                    >
                      每 日 寄 语
                    </h2>
                  </div>
                </div>
                <div
                  style={{
                    color: C.inkBody,
                    fontSize: 15,
                    lineHeight: 1.95,
                    letterSpacing: '0.03em',
                    fontFamily: FONT_SERIF,
                  }}
                >
                  {conclusion!.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={i} style={{ height: 8 }} />;
                    return (
                      <p key={i} style={{ margin: '0 0 10px' }}>
                        {renderInline(trimmed)}
                      </p>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ----- 页脚 ----- */}
          <footer style={{ textAlign: 'center', marginTop: 28 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span style={{ width: 36, height: 1, background: C.accentSoft }} />
              <span style={{ color: C.accent, fontSize: 12 }}>✿</span>
              <span style={{ width: 36, height: 1, background: C.accentSoft }} />
            </div>
            <p
              style={{
                color: C.inkMuted,
                fontSize: 11,
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
          .critique-body {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};
