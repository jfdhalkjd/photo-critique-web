import { NextResponse } from "next/server";
import { parseCritiqueFromCozeWorkflowJson } from "@/lib/parseWorkflowCritique";

export const runtime = "edge";

const COZE_WORKFLOW_URL = "https://api.coze.com/v1/workflow/run";

type RunBody = {
  fileIds?: string[];
};

function extractMarkdownFromWorkflowPayload(json: unknown): string {
  if (typeof json === "string") {
    try {
      return extractMarkdownFromWorkflowPayload(JSON.parse(json));
    } catch {
      return json;
    }
  }

  if (!json || typeof json !== "object") {
    return "";
  }

  const root = json as Record<string, unknown>;

  if ("data" in root) {
    const data = root.data;
    if (typeof data === "string") {
      try {
        const inner = JSON.parse(data) as Record<string, unknown>;
        const out =
          inner.output ??
          inner.Output ??
          inner.result ??
          inner.text ??
          inner.content;
        if (typeof out === "string") return out;
        if (out && typeof out === "object" && "markdown" in out) {
          const md = (out as { markdown?: unknown }).markdown;
          if (typeof md === "string") return md;
        }
      } catch {
        return data;
      }
    }
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      const out = d.output ?? d.Output ?? d.result ?? d.text ?? d.content;
      if (typeof out === "string") return out;
    }
  }

  const direct =
    root.output ?? root.Output ?? root.result ?? root.text ?? root.content;
  if (typeof direct === "string") return direct;

  return JSON.stringify(json, null, 2);
}

export async function POST(request: Request) {
  const token = process.env.COZE_PERSONAL_ACCESS_TOKEN;
  const workflowId = process.env.COZE_WORKFLOW_ID;

  if (!token || !workflowId) {
    return NextResponse.json(
      { error: "服务器未配置 COZE_PERSONAL_ACCESS_TOKEN 或 COZE_WORKFLOW_ID" },
      { status: 500 },
    );
  }

  let body: RunBody;
  try {
    body = (await request.json()) as RunBody;
  } catch {
    return NextResponse.json({ error: "请求体需为 JSON" }, { status: 400 });
  }

  const fileIds = body.fileIds?.filter(Boolean) ?? [];
  if (fileIds.length === 0) {
    return NextResponse.json({ error: "请至少提供一张已上传图片的 file_id" }, { status: 400 });
  }
  if (fileIds.length > 20) {
    return NextResponse.json({ error: "一次最多 20 张图片" }, { status: 400 });
  }

  const photos = fileIds.map((id) => ({ file_id: id }));
  const photosParam =
    process.env.COZE_PHOTOS_AS_JSON_STRING === "1"
      ? JSON.stringify(photos)
      : photos;

  const upstream = await fetch(COZE_WORKFLOW_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      workflow_id: workflowId,
      parameters: {
        photos: photosParam,
      },
    }),
  });

  const text = await upstream.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { error: "扣子工作流返回了无法解析的 JSON", raw: text.slice(0, 2000) },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const msg =
      typeof json === "object" && json !== null && "msg" in json
        ? String((json as { msg?: string }).msg)
        : `工作流调用失败（HTTP ${upstream.status}）`;
    return NextResponse.json({ error: msg, detail: json }, { status: upstream.status });
  }

  const parsed = json as { code?: number; msg?: string };
  if (parsed.code !== undefined && parsed.code !== 0) {
    return NextResponse.json(
      { error: parsed.msg || "工作流执行失败", detail: json },
      { status: 400 },
    );
  }

  const markdown = extractMarkdownFromWorkflowPayload(json);
  const critique = parseCritiqueFromCozeWorkflowJson(json);
  return NextResponse.json({ markdown, raw: json, critique });
}
