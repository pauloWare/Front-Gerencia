// ============================================================================
// Utilitários centralizados de data/hora.
//
// Datas de calendário (sem horário) são tratadas SEM deslocamento de timezone:
// trabalhamos sempre com a representação textual ISO (AAAA-MM-DD) em vez de
// passar por `new Date("AAAA-MM-DD")`, o que evita o clássico problema de
// deslocamento de dia dependendo do fuso do usuário.
// ============================================================================

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Extrai { y, m, d } de uma string "AAAA-MM-DD" (ignora a parte de hora, se houver).
 * Retorna null para valores nulos/indefinidos/inválidos.
 */
export function parseDateOnly(value) {
  if (value == null || typeof value !== 'string') return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

/**
 * "AAAA-MM-DD" -> "DD/MM/AAAA".
 * Retorna '' para valores vazios/inválidos (não lança erro, não gera Invalid Date).
 */
export function formatDate(value) {
  const p = parseDateOnly(value);
  if (!p) return '';
  return `${pad2(p.d)}/${pad2(p.m)}/${p.y}`;
}

/**
 * "AAAA-MM-DD[THH:mm[:ss]]" -> "DD/MM/AAAA às HH:mm".
 * Quando não há horário, retorna apenas "DD/MM/AAAA".
 */
export function formatDateTime(value) {
  const p = parseDateOnly(value);
  if (!p) return '';
  const timeMatch = value.match(/T(\d{2}:\d{2})/);
  const time = timeMatch ? timeMatch[1] : '';
  const date = `${pad2(p.d)}/${pad2(p.m)}/${p.y}`;
  return time ? `${date} às ${time}` : date;
}

/**
 * "HH:mm[:ss]" -> "HH:mm". Aceita também instâncias de Date.
 * Retorna '' para valores vazios/inválidos.
 */
export function formatTime(value) {
  if (value == null) return '';
  if (value instanceof Date) {
    return `${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
  }
  const s = String(value);
  const m = s.match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '';
}

/**
 * "DD/MM/AAAA" -> "AAAA-MM-DD" (formato esperado pela API).
 * Se o valor já estiver em ISO, retorna apenas a parte da data.
 */
export function toApiDate(value) {
  if (value == null || typeof value !== 'string') return value;
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return value;
}

/**
 * Combina data ("AAAA-MM-DD") e hora ("HH:mm") em "AAAA-MM-DDTHH:mm".
 */
export function toApiDateTime(dateValue, timeValue) {
  const d = toApiDate(dateValue);
  const t = formatTime(timeValue);
  if (!d) return t ? `T${t}` : '';
  return t ? `${d}T${t}` : d;
}

/** Data de hoje em "AAAA-MM-DD" (hora local, sem timezone). */
export function hojeISO() {
  const h = new Date();
  return `${h.getFullYear()}-${pad2(h.getMonth() + 1)}-${pad2(h.getDate())}`;
}

/** Soma N dias à data de hoje, retornando "AAAA-MM-DD". */
export function somarDias(dias) {
  const h = new Date();
  h.setDate(h.getDate() + dias);
  return `${h.getFullYear()}-${pad2(h.getMonth() + 1)}-${pad2(h.getDate())}`;
}
