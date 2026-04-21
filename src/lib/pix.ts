// Gera o "copia e cola" PIX (BR Code) estático conforme o padrão EMV/Bacen.
// Referência: Manual do BR Code do Banco Central.

function emv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

// CRC16-CCITT (polinômio 0x1021, init 0xFFFF) — exigido pelo padrão PIX.
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Remove acentos e caracteres não permitidos (PIX só aceita ASCII básico).
function sanitize(str: string, max: number): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .slice(0, max)
    .trim();
}

export interface PixPayloadInput {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount?: number; // em reais, ex: 10.00
  txid?: string; // até 25 chars, A-Z 0-9
  description?: string;
}

export function buildPixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txid = "***",
  description,
}: PixPayloadInput): string {
  const gui = emv("00", "br.gov.bcb.pix");
  const key = emv("01", pixKey.trim());
  const desc = description ? emv("02", sanitize(description, 50)) : "";
  const merchantAccountInfo = emv("26", gui + key + desc);

  const payloadFormat = emv("00", "01");
  const merchantCategory = emv("52", "0000");
  const currency = emv("53", "986"); // BRL
  const amountField = amount && amount > 0 ? emv("54", amount.toFixed(2)) : "";
  const country = emv("58", "BR");
  const name = emv("59", sanitize(merchantName, 25) || "RECEBEDOR");
  const city = emv("60", sanitize(merchantCity, 15) || "BRASIL");
  const addData = emv("62", emv("05", sanitize(txid, 25) || "***"));

  const partial =
    payloadFormat +
    merchantAccountInfo +
    merchantCategory +
    currency +
    amountField +
    country +
    name +
    city +
    addData +
    "6304";

  return partial + crc16(partial);
}

// Extrai o valor numérico de strings tipo "R$ 10", "R$ 19,90", "10.00"
export function parsePriceToNumber(price: string): number | null {
  if (!price) return null;
  const cleaned = price.replace(/[^\d,.]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}
