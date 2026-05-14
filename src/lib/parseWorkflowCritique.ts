/**
 * 从扣子工作流 HTTP 响应体中解析「点评表格」与「导师总结」。
 * 兼容 data 为 JSON 字符串、嵌套 Output、大小写差异等常见形态。
 * Comments 可为数组，或一整段含 Markdown 表格（| 图片序号 | 点评 |）的字符串。
 */

export type WorkflowCritique = {
  comments: string[];
  conclusion: string | null;
};

function tryParseJsonString(s: string): unknown | null {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
}

function asConclusion(v: unknown): string | null {
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : null;
  }
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of ["text", "content", "summary", "value"]) {
      const x = o[k];
      if (typeof x === "string" && x.trim()) return x.trim();
    }
  }
  return null;
}

function commentItemToString(item: unknown): string {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";
  const o = item as Record<string, unknown>;
  const keys = [
    "comment",
    "Comment",
    "comments",
    "text",
    "content",
    "review",
    "点评",
    "output",
    "Output",
    "markdown",
    "Markdown",
  ];
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  try {
    return JSON.stringify(item, null, 2);
  } catch {
    return String(item);
  }
}

/** 拆 Markdown 管道表的一行（支持首尾 |） */
function splitTableRow(line: string): string[] {
  const t = line.trim();
  if (!t.startsWith("|")) return [];
  const core = t.replace(/^\|/, "").replace(/\|\s*$/, "");
  return core.split("|").map((c) => c.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  if (cells.length === 0) return false;
  return cells.every((c) => {
    const x = c.replace(/\s/g, "");
    return /^:?-{2,}:?$/.test(x);
  });
}

/** 中文数字 → 整数（用于「第几张」排序，覆盖常见 1–99） */
function chineseToInt(s: string): number {
  const t = s.replace(/\s/g, "");
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  const d: Record<string, number> = {
    零: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  if (t === "十") return 10;
  if (t.startsWith("十")) {
    const rest = t.slice(1);
    return 10 + (rest ? (d[rest] ?? 0) : 0);
  }
  if (t.endsWith("十") && t.length > 1) {
    return (d[t[0]] ?? 0) * 10;
  }
  if (t.includes("十")) {
    const [a, b] = t.split("十");
    const left = a ? (d[a] ?? 1) : 1;
    const right = b ? (d[b] ?? 0) : 0;
    return left * 10 + right;
  }
  return d[t] ?? 0;
}

/** 从「图片序号」单元格得到排序用序号（与上传顺序一致：1=第一张） */
function parseImageOrderKey(seqCell: string, appearanceIndex: number): number {
  const t = seqCell.replace(/\s/g, "");
  const m1 = t.match(/第(\d+)张/);
  if (m1) return parseInt(m1[1], 10);
  const m2 = t.match(/第(.+?)张/);
  if (m2) {
    const n = chineseToInt(m2[1]);
    if (n > 0) return n;
  }
  const m3 = t.match(/(\d+)/);
  if (m3) return parseInt(m3[1], 10);
  return appearanceIndex + 1;
}

function looksLikeMarkdownPipeTable(s: string): boolean {
  const lines = s.split(/\r?\n/).filter((l) => l.trim().startsWith("|"));
  return lines.length >= 2;
}

/**
 * 从 Comments 长字符串里的 Markdown 表格提取每行「点评」列，按图片序号排序。
 * 解析不到任何数据行时返回 []（由上层决定是否退回整段原文）。
 */
function parseMarkdownTableToReviews(text: string): string[] {
  const rawLines = text.split(/\r?\n/);
  const tableLines = rawLines.map((l) => l.trim()).filter((l) => l.startsWith("|"));
  if (tableLines.length < 2) return [];

  const rows = tableLines.map(splitTableRow).filter((r) => r.length > 0);
  if (rows.length < 2) return [];

  let dataStart = 1;
  if (rows.length >= 2 && isSeparatorRow(rows[1])) {
    dataStart = 2;
  }

  const header = rows[0].map((h) => h.toLowerCase());
  const lower = header;

  let reviewCol = lower.findIndex((h) => /点评|评论|文字点评|评价|建议|说明|评语/.test(h));
  if (reviewCol < 0) reviewCol = header.length - 1;

  const seqCol = lower.findIndex((h) => /序号|张|图片|编号|次序/.test(h));

  type RowEntry = { order: number; review: string };
  const entries: RowEntry[] = [];
  let appearance = 0;

  for (let i = dataStart; i < rows.length; i++) {
    const r = rows[i];
    if (r.length === 0 || isSeparatorRow(r)) continue;

    const seqCell = seqCol >= 0 ? (r[seqCol] ?? "") : "";
    const review = (r[reviewCol] ?? "").trim();
    if (!review) continue;

    // 跳过误把表头当数据行
    if (/^图片序号|^序号$/i.test(seqCell) && /^点评$/i.test(review)) continue;
    if (/^:?-+$/.test(review.replace(/\s/g, ""))) continue;

    const order = seqCol >= 0 ? parseImageOrderKey(seqCell, appearance) : appearance + 1;
    appearance += 1;
    entries.push({ order, review });
  }

  entries.sort((a, b) => a.order - b.order);
  return entries.map((e) => e.review);
}

/** 若正文里多次出现「第 N 张」标题，按块拆开（表格解析失败时的补充） */
function splitByPhotoHeadings(text: string): string[] | null {
  const re = /(?:^|\n)\s*(?:#{1,3}\s*)?第\s*[一二三四五六七八九十两零百千\d]+\s*张/gi;
  const idxs: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    idxs.push(m.index);
  }
  if (idxs.length < 2) return null;
  const blocks: string[] = [];
  for (let i = 0; i < idxs.length; i++) {
    const end = i + 1 < idxs.length ? idxs[i + 1]! : text.length;
    blocks.push(text.slice(idxs[i]!, end).trim());
  }
  return blocks.length >= 2 ? blocks : null;
}

/**
 * 将 Comments 字段（字符串或数组）规范为与上传顺序一致的点评字符串数组。
 * 表格解析失败时，至少返回 [整段原文]，避免前端显示「暂无点评」。
 */
function normalizeCommentsFromUnknown(raw: unknown): string[] {
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    const fromTable = parseMarkdownTableToReviews(t);
    if (fromTable.length > 0) return fromTable;
    const byHeadings = splitByPhotoHeadings(t);
    if (byHeadings && byHeadings.length > 0) return byHeadings;
    return [t];
  }

  if (!Array.isArray(raw)) return [];

  const parts = raw.map(commentItemToString).filter((s) => s.length > 0);
  if (parts.length === 0) return [];

  if (parts.length === 1) {
    const only = parts[0];
    if (looksLikeMarkdownPipeTable(only)) {
      const fromTable = parseMarkdownTableToReviews(only);
      if (fromTable.length > 0) return fromTable;
      const byHeadings = splitByPhotoHeadings(only);
      if (byHeadings && byHeadings.length > 0) return byHeadings;
    }
    return [only];
  }

  return parts;
}

function pickCommentsAndConclusion(rec: Record<string, unknown>): WorkflowCritique | null {
  const rawComments =
    rec.Comments ?? rec.comments ?? rec.COMMENTS ?? rec["点评列表"] ?? rec.photo_comments;
  const rawConclusion =
    rec.Conclusion ?? rec.conclusion ?? rec.CONCLUSION ?? rec["总结"] ?? rec.summary ?? rec.Summary;

  const comments = normalizeCommentsFromUnknown(rawComments);
  const conclusion = asConclusion(rawConclusion);

  if (comments.length === 0 && !conclusion) return null;
  return { comments, conclusion };
}

function deepFindCritique(obj: unknown, depth: number): WorkflowCritique | null {
  if (depth > 8 || obj === null || obj === undefined) return null;
  if (typeof obj === "string") {
    const inner = tryParseJsonString(obj);
    if (inner !== null) return deepFindCritique(inner, depth + 1);
    return null;
  }
  if (Array.isArray(obj)) {
    for (const el of obj) {
      const hit = deepFindCritique(el, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof obj === "object") {
    const rec = obj as Record<string, unknown>;
    const direct = pickCommentsAndConclusion(rec);
    if (direct && (direct.comments.length > 0 || direct.conclusion)) return direct;
    for (const v of Object.values(rec)) {
      const hit = deepFindCritique(v, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * 从工作流完整 JSON（与 API 返回的 raw 一致）解析 Comments + Conclusion。
 */
export function parseCritiqueFromCozeWorkflowJson(json: unknown): WorkflowCritique | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;

  const dataField = root.data;
  if (typeof dataField === "string") {
    const inner = tryParseJsonString(dataField);
    if (inner !== null) {
      const hit = deepFindCritique(inner, 0);
      if (hit) return hit;
    }
  } else if (dataField && typeof dataField === "object") {
    const hit = deepFindCritique(dataField, 0);
    if (hit) return hit;
  }

  return deepFindCritique(root, 0);
}
