// src/modules/calendar/svc/text_Extractor.ts
import * as fs from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * A single text token with approximate (x,y) origin in page coordinates.
 * Note: In PDF space, y grows upward. We keep it as-is.
 */
export type PdfToken = { page: number; x: number; y: number; text: string };

/** Low-level helper: read all text (lossy; concatenates items in reading order). */
async function pdfjsDirect(bytes: Uint8Array): Promise<{ text: string }> {
  const doc = await getDocument({ data: bytes }).promise;
  try {
    let text = "";
    const total = doc.numPages;
    for (let i = 1; i <= total; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      // Concatenate item strings with spaces; this is fine for regex parsing,
      // but loses layout (which extractTextWithLayout provides).
      text += content.items.map((it: any) => it.str || "").join(" ") + "\n";
    }
    return { text };
  } finally {
    await doc.destroy();
  }
}

/**
 * Extracts plain text from a PDF buffer using pdf.js (not OCR).
 * Returns trimmed text and a flag indicating the method used ("pdf").
 */
export async function extractTextFromPdfBytes(
  input: Buffer | Uint8Array
): Promise<{ text: string; used: "pdf" | "ocr" }> {
  // Make an owned copy so pdf.js can safely detach internally.
  const bytes = Uint8Array.from(input);

  const parsed = await pdfjsDirect(bytes);
  const cleaned = (parsed?.text ?? "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\r/g, "")
    .trim();

  return { text: cleaned, used: "pdf" };
}

/** Convenience helper for manual CLI testing from a file path. */
export async function extractTextFromFile(path: string) {
  const buf = await fs.readFile(path);
  return extractTextFromPdfBytes(buf);
}

/**
 * Extracts layout-aware tokens (page, x, y, text) for downstream
 * column/weekday detection and grid parsing.
 */
export async function extractTextWithLayout(
  input: Buffer | Uint8Array
): Promise<{ tokens: PdfToken[] }> {
  // Make an owned copy so pdf.js can safely detach internally.
  const bytes = Uint8Array.from(input);

  const doc = await getDocument({ data: bytes }).promise;
  const tokens: PdfToken[] = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();

      for (const item of content.items as any[]) {
        const str: string = item.str ?? "";
        // item.transform is a 6-element transform matrix: [a, b, c, d, e, f]
        // e,f is the text origin (x,y) in page space.
        const [, , , , e, f] = item.transform || [];
        if (str && Number.isFinite(e) && Number.isFinite(f)) {
          tokens.push({ page: p, x: e, y: f, text: str });
        }
      }
    }
    return { tokens };
  } finally {
    await doc.destroy();
  }
}
