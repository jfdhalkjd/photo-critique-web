import { NextResponse } from "next/server";

/** Node 运行时更稳妥地解析/转发 multipart，避免 Edge 下偶发异常 */
export const runtime = "nodejs";

/**
 * 仅开发环境：本地/公司网络缺少完整 CA 链时，对 api.coze.com 的请求可能报
 * UNABLE_TO_GET_ISSUER_CERT_LOCALLY。此处放宽 TLS 校验以便联调。
 * 切勿在生产构建或生产部署中依赖此行为（生产应保持默认严格校验）。
 */
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}


/** 国际版（.com），勿用 api.coze.cn */
const COZE_UPLOAD_URL = "https://api.coze.com/v1/files/upload";

/** 与 .env.local 中变量名完全一致：COZE_PERSONAL_ACCESS_TOKEN */
function readCozePat(): string | undefined {
  const raw = process.env.COZE_PERSONAL_ACCESS_TOKEN;
  if (typeof raw !== "string") return undefined;
  let t = raw.trim();
  if (!t) return undefined;
  if (t.toLowerCase().startsWith("bearer ")) {
    t = t.slice(7).trim();
  }
  return t || undefined;
}

export async function POST(request: Request) {
  const token = readCozePat();
  if (!token) {
    return NextResponse.json(
      { error: "服务器未配置 COZE_PERSONAL_ACCESS_TOKEN" },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "无法读取上传内容" }, { status: 400 });
  }

  const entry = formData.get("file");
  if (!entry || typeof entry === "string" || !(entry instanceof Blob)) {
    return NextResponse.json({ error: "请提供名为 file 的图片文件" }, { status: 400 });
  }

  if (!entry.type.startsWith("image/")) {
    return NextResponse.json({ error: "仅支持图片格式" }, { status: 400 });
  }

  const uploadName =
    entry instanceof File && entry.name?.trim() ? entry.name : "upload.jpg";

  const forward = new FormData();
  forward.append("file", entry, uploadName);

  const upstream = await fetch(COZE_UPLOAD_URL, {
    method: "POST",
    headers: {
      // 必须为 "Bearer " + 空格 + PAT（勿写成 Bearer${token}）
      Authorization: `Bearer ${token}`,
    },
    body: forward,
  });

  const text = await upstream.text();
  let errorData: unknown;
  try {
    errorData = text ? JSON.parse(text) : {};
  } catch {
    console.error("Coze API Error:", {
      httpStatus: upstream.status,
      parseFailed: true,
      bodyPreview: text.slice(0, 500),
    });
    return NextResponse.json(
      { error: "扣子文件服务返回了无法解析的内容" },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    console.error("Coze API Error:", errorData);
    const msg =
      typeof errorData === "object" && errorData !== null && "msg" in errorData
        ? String((errorData as { msg?: string }).msg)
        : `上传失败（HTTP ${upstream.status}）`;
    return NextResponse.json({ error: msg, detail: errorData }, { status: upstream.status });
  }

  const parsed = errorData as {
    code?: number;
    data?: { id?: string; file_id?: string };
    msg?: string;
  };

  if (parsed.code !== undefined && parsed.code !== 0) {
    console.error("Coze API Error:", errorData);
    return NextResponse.json(
      { error: parsed.msg || "上传失败", detail: errorData },
      { status: 400 },
    );
  }

  const id = parsed.data?.id ?? parsed.data?.file_id;
  if (!id) {
    console.error("Coze API Error:", { ...parsed, note: "missing file id in data" });
    return NextResponse.json(
      { error: "未从扣子返回中解析到文件 id", detail: errorData },
      { status: 502 },
    );
  }

  return NextResponse.json({ id });
}
