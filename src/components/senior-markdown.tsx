"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { isProbablyImageUrl } from "@/lib/image-url";

type Variant = "default" | "compact";

function buildComponents(variant: Variant): Components {
  const prose = variant === "compact" ? "text-[1.05rem] leading-[1.75]" : "text-[1.125rem] leading-[1.8]";

  return {
    p: ({ children, ...rest }) => (
      <p className={`mb-3 last:mb-0 ${prose} text-slate-800`} {...rest}>
        {children}
      </p>
    ),
    strong: ({ children, ...rest }) => (
      <strong className="font-semibold text-sky-900" {...rest}>
        {children}
      </strong>
    ),
    em: ({ children, ...rest }) => (
      <em className="italic text-slate-800" {...rest}>
        {children}
      </em>
    ),
    ul: ({ children, ...rest }) => (
      <ul className={`mb-3 list-disc space-y-2 pl-6 ${prose}`} {...rest}>
        {children}
      </ul>
    ),
    ol: ({ children, ...rest }) => (
      <ol className={`mb-3 list-decimal space-y-2 pl-6 ${prose}`} {...rest}>
        {children}
      </ol>
    ),
    li: ({ children, ...rest }) => (
      <li className="marker:text-warmorange-500" {...rest}>
        {children}
      </li>
    ),
    h1: ({ children, ...rest }) => (
      <h1 className="mb-2 mt-2 text-[1.35rem] font-bold text-sky-900 first:mt-0" {...rest}>
        {children}
      </h1>
    ),
    h2: ({ children, ...rest }) => (
      <h2 className="mb-2 mt-3 text-[1.25rem] font-bold text-sky-800" {...rest}>
        {children}
      </h2>
    ),
    h3: ({ children, ...rest }) => (
      <h3 className="mb-2 mt-2 text-[1.15rem] font-semibold text-sky-800" {...rest}>
        {children}
      </h3>
    ),
    blockquote: ({ children, ...rest }) => (
      <blockquote
        className="my-3 border-l-4 border-warmorange-400 bg-orange-50/70 py-2 pl-4 pr-2 text-slate-800"
        {...rest}
      >
        {children}
      </blockquote>
    ),
    a: ({ href, children, ...rest }) => {
      if (href && isProbablyImageUrl(href)) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={href}
            alt={typeof children === "string" ? children : "插图"}
            className="my-2 max-h-48 w-full max-w-md rounded-lg border border-sky-100 object-contain"
          />
        );
      }
      return (
        <a
          href={href}
          className="break-all text-warmblue-700 underline decoration-warmorange-400 decoration-2 underline-offset-2 hover:text-warmblue-800"
          target="_blank"
          rel="noopener noreferrer"
          {...rest}
        >
          {children}
        </a>
      );
    },
    img: ({ src, alt }) => {
      if (!src) return null;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || "插图"}
          className={
            variant === "compact"
              ? "my-2 max-h-40 w-full rounded-lg border border-sky-100 object-contain"
              : "my-3 max-h-[min(70vh,560px)] w-full rounded-xl border border-sky-100 object-contain"
          }
        />
      );
    },
    code: ({ className, children, ...rest }) => {
      const isFence = Boolean(className?.includes("language-"));
      if (isFence) {
        return (
          <code className={`font-mono text-base ${className ?? ""}`} {...rest}>
            {children}
          </code>
        );
      }
      return (
        <code className="rounded bg-sky-100/90 px-1.5 py-0.5 font-mono text-[1rem] text-sky-900" {...rest}>
          {children}
        </code>
      );
    },
    pre: ({ children, ...rest }) => (
      <pre
        className="mb-3 overflow-x-auto rounded-lg border border-slate-600 bg-slate-900 p-3 text-[1rem] text-amber-50"
        {...rest}
      >
        {children}
      </pre>
    ),
    table: ({ children, ...props }) => (
      <div className="my-3 overflow-x-auto rounded-lg border border-sky-100 bg-white/80">
        <table className="w-full min-w-[32rem] border-collapse text-left" {...props}>
          {children}
        </table>
      </div>
    ),
    th: (props) => (
      <th className="border border-sky-200 bg-sky-50 px-3 py-2 text-[1.05rem] font-semibold text-sky-900" {...props} />
    ),
    td: (props) => (
      <td className="border border-sky-100 px-3 py-2 align-top text-[1.05rem] leading-relaxed text-slate-800" {...props} />
    ),
  };
}

type SeniorMarkdownProps = {
  children: string;
  variant?: Variant;
  className?: string;
};

export function SeniorMarkdown({ children, variant = "default", className = "" }: SeniorMarkdownProps) {
  const components = buildComponents(variant);
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
