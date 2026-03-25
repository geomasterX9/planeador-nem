import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  PageOrientation
} from "docx";
import { saveAs } from "file-saver";

// =========================
// SANITIZE REAL
// =========================
const sanitizeText = (text: any): string => {
  if (!text) return "";

  return String(text)
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

// =========================
// CELDA SEGURA (CLAVE)
// =========================
const safeCell = (text: string) => {
  return new TableCell({
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: sanitizeText(text),
          }),
        ],
      }),
    ],
  });
};

// =========================
// EXPORT
// =========================
export const exportToWord = async (projectData: any, plannedItems: any[]) => {

  const contenidos = plannedItems
    .filter(i => i.type === "content")
    .map(i => sanitizeText(i.text))
    .join(" | ");

  const pdas = plannedItems
    .filter(i => i.type === "pda")
    .map(i => sanitizeText(i.text))
    .join(" | ");

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          safeCell("CONTENIDOS"),
          safeCell("PDA"),
        ],
      }),
      new TableRow({
        children: [
          safeCell(contenidos),
          safeCell(pdas),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
          },
        },
        children: [
          new Paragraph({
            children: [new TextRun("PLANEACIÓN DIDÁCTICA")],
            alignment: AlignmentType.CENTER,
          }),
          table,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  saveAs(blob, "test.docx");
};