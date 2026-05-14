/** 扣子工作流文案中的占位符 → 真实昵称（缺省为「摄影师」） */
const USER_NICKNAME_PLACEHOLDER = /\{\{\s*user_nickname\s*\}\}/gi;

export function applyUserNicknamePlaceholder(
  text: string,
  nickname: string | null | undefined,
): string {
  const name = nickname?.trim() ? nickname.trim() : "摄影师";
  return text.replace(USER_NICKNAME_PLACEHOLDER, name);
}

/**
 * 若首行符合「@某某 同学」称呼行，拆成单独一行（用于深绿色加粗展示），其余为正文 Markdown。
 */
export function splitNicknameGreetingLine(text: string): { greeting: string | null; body: string } {
  const t = text.replace(/\r\n/g, "\n").trimStart();
  if (!t) return { greeting: null, body: "" };

  const nl = t.indexOf("\n");
  const firstLine = (nl === -1 ? t : t.slice(0, nl)).trim();
  const rest = nl === -1 ? "" : t.slice(nl + 1);

  if (/^@\s*.+?\s*同学\s*$/.test(firstLine)) {
    return { greeting: firstLine, body: rest.trimStart() };
  }
  return { greeting: null, body: t };
}

export function prepareCritiqueDisplayText(
  raw: string,
  nickname: string | null | undefined,
): { greeting: string | null; body: string } {
  const replaced = applyUserNicknamePlaceholder(raw, nickname);
  return splitNicknameGreetingLine(replaced);
}
