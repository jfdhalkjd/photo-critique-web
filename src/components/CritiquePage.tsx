"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CritiqueResult } from "@/components/CritiqueResult";
import { CritiqueShowcase } from "@/components/CritiqueShowcase";
import {
  parseCritiqueFromCozeWorkflowJson,
  type WorkflowCritique,
} from "@/lib/parseWorkflowCritique";

const MAX_FILES = 20;

type RunJson = {
  error?: string;
  markdown?: string;
  raw?: unknown;
  critique?: WorkflowCritique | null;
};

export function CritiquePage() {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [critique, setCritique] = useState<WorkflowCritique | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const replacePreviewUrls = useCallback((next: string[]) => {
    previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    previewUrlsRef.current = next;
    setPreviewUrls([...next]);
  }, []);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      previewUrlsRef.current = [];
    };
  }, []);

  const onFilesPicked = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      const arr = Array.from(list).filter((f) => f.type.startsWith("image/"));
      if (arr.length === 0) {
        setError("请选择图片文件（jpg、png 等）。");
        return;
      }
      if (arr.length > MAX_FILES) {
        setFiles(arr.slice(0, MAX_FILES));
        setError(`一次最多 ${MAX_FILES} 张，已自动只保留前 ${MAX_FILES} 张。`);
      } else {
        setFiles(arr);
        setError(null);
      }
      setMarkdown(null);
      setCritique(null);
      replacePreviewUrls([]);
    },
    [replacePreviewUrls],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilesPicked(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onFilesPicked(e.dataTransfer.files);
  };

  const runCritique = async () => {
    if (files.length === 0) {
      setError("请先选择至少一张照片。");
      return;
    }
    setLoading(true);
    setError(null);
    setMarkdown(null);
    setCritique(null);
    replacePreviewUrls([]);

    try {
      const fileIds: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/coze/upload", {
          method: "POST",
          body: fd,
        });
        const upJson = (await up.json().catch(() => ({}))) as {
          error?: string;
          id?: string;
        };
        if (!up.ok) {
          throw new Error(upJson.error || `第 ${i + 1} 张图上传到扣子失败`);
        }
        if (!upJson.id) {
          throw new Error(`第 ${i + 1} 张图未返回文件 id`);
        }
        fileIds.push(upJson.id);
      }

      const run = await fetch("/api/coze/workflow/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds }),
      });
      const runJson = (await run.json().catch(() => ({}))) as RunJson;
      if (!run.ok) {
        throw new Error(runJson.error || "工作流执行失败");
      }

      const mergedCritique =
        runJson.critique != null
          ? runJson.critique
          : parseCritiqueFromCozeWorkflowJson(runJson.raw);

      const hasStructured =
        mergedCritique &&
        (mergedCritique.comments.length > 0 ||
          Boolean(mergedCritique.conclusion?.trim()));

      if (hasStructured && mergedCritique) {
        replacePreviewUrls(files.map((f) => URL.createObjectURL(f)));
        setCritique(mergedCritique);
      } else {
        replacePreviewUrls([]);
        setCritique(null);
        const md =
          runJson.markdown?.trim() ||
          "_（未解析到 `Comments` 与 `Conclusion`，以下为兜底展示；请在工作流输出中返回上述字段的 JSON。）_";
        setMarkdown(md);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "出了点小状况，请稍后再试。";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const showStructured =
    critique &&
    (critique.comments.length > 0 || Boolean(critique.conclusion?.trim()));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 lg:max-w-6xl">
      <header className="mb-8 text-center">
        <h1 className="text-[1.35rem] font-bold leading-snug text-sky-900 sm:text-3xl">
          照片点评器
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-slate-700 sm:text-xl">
          趣小导陪您一起看图、一起进步。选好照片后点「开始点评」，稍等片刻即可阅读温暖点评。
        </p>
      </header>

      <section
        className="rounded-2xl border-2 border-dashed border-sky-200 bg-gradient-to-b from-sky-50 to-orange-50/80 p-6 shadow-inner sm:p-8"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center text-center"
        >
          <span className="text-5xl" aria-hidden="true">
            &#128247;
          </span>
          <span className="mt-3 text-xl font-semibold text-sky-900">
            点击选择或拖入照片（最多 {MAX_FILES} 张）
          </span>
          <span className="mt-2 text-lg text-slate-600">支持手机相册，字号已加大，方便阅读与点按</span>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={onInputChange}
          />
        </label>

        {files.length > 0 && (
          <ul className="mt-6 space-y-2 rounded-xl bg-white/90 p-4 text-lg text-slate-800 shadow">
            {files.map((f, idx) => (
              <li
                key={`${f.name}-${idx}`}
                className="flex justify-between gap-2 border-b border-sky-100 pb-2 last:border-0 last:pb-0"
              >
                <span className="truncate font-medium">
                  {idx + 1}. {f.name}
                </span>
                <span className="shrink-0 text-slate-500">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <button
          type="button"
          className="min-h-[52px] min-w-[200px] rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-8 py-3 text-xl font-bold text-white shadow-lg transition hover:from-sky-700 hover:to-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          选择照片
        </button>
        <button
          type="button"
          className="min-h-[52px] min-w-[200px] rounded-xl bg-gradient-to-r from-warmorange-500 to-warmorange-600 px-8 py-3 text-xl font-bold text-white shadow-lg transition hover:from-warmorange-600 hover:to-warmorange-700 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={runCritique}
          disabled={loading || files.length === 0}
          aria-busy={loading}
        >
          开始点评
        </button>
      </div>

      {error && (
        <div
          className="mt-6 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-center text-lg leading-relaxed text-red-900"
          role="alert"
        >
          {error}
        </div>
      )}

      {showStructured && critique && (
        <CritiqueShowcase
          previewUrls={previewUrls}
          imageLabels={files.map((f) => {
            const base = f.name.replace(/\.[^.]+$/, "");
            return base || f.name;
          })}
          comments={critique.comments}
          conclusion={critique.conclusion}
        />
      )}

      {!showStructured && markdown && (
        <div className="mt-10">
          <h2 className="mb-4 text-center text-[1.5rem] font-bold leading-snug text-sky-900">
            点评正文
          </h2>
          <CritiqueResult markdown={markdown} />
        </div>
      )}

      {loading && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/45 px-6 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="max-w-lg rounded-3xl border-2 border-warmorange-100 bg-gradient-to-b from-[#fffdf8] to-sky-50 p-10 text-center shadow-2xl">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-orange-100 text-5xl animate-bounce-soft">
              &#128247;
            </div>
            <p className="mt-6 text-[1.35rem] font-bold leading-snug text-sky-900 animate-gentle-pulse">
              趣小导正在认真看图，请稍候…
            </p>
            <p className="mt-4 text-[1.125rem] leading-relaxed text-slate-700">
              照片已安全上传，正在请扣子工作流为您写温暖点评，请稍坐片刻 ✨
            </p>
            <div
              className="mx-auto mt-8 h-12 w-12 rounded-full border-4 border-sky-200 border-t-warmorange-500 animate-spin-slow"
              aria-hidden="true"
            />
          </div>
        </div>
      )}
    </main>
  );
}
