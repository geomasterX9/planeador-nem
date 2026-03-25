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
export const exportToWord = async (
  projectData: any,
  plannedItems: any[],
  actividades: Record<string, string>
) => {

  const sanitize = (t: any) =>
    String(t || "")
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  // =========================
  // DATOS
  // =========================
  const escuela = sanitize(projectData.escuela);
  const cct = sanitize(projectData.cct);
  const turno = sanitize(projectData.turno);
  const maestro = sanitize(projectData.maestro);
  const proyecto = sanitize(projectData.proyecto);

  // =========================
  // LISTAS (CORRECTO)
  // =========================
  const contenidos = plannedItems
    .filter(i => i.type === "content")
    .map(i =>
      new Paragraph({
        children: [new TextRun(`• ${sanitize(i.text)}`)],
      })
    );

  const pdas = plannedItems
    .filter(i => i.type === "pda")
    .map(i =>
      new Paragraph({
        children: [new TextRun(`• ${sanitize(i.text)}`)],
      })
    );

  // =========================
  // CELDA SEGURA
  // =========================
  const cell = (children: any[]) =>
    new TableCell({
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
      },
      children,
    });

  // =========================
  // HEADER
  // =========================
  const header = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell([
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "SECRETARÍA DE EDUCACIÓN PÚBLICA",
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun(escuela)],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun(`CLAVE: ${cct}  TURNO: ${turno}`),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "PLANEACIÓN DIDÁCTICA",
                  bold: true,
                }),
              ],
            }),
          ]),
        ],
      }),
    ],
  });

  // =========================
  // TABLA CONTENIDOS
  // =========================
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell([
            new Paragraph({
              children: [new TextRun({ text: "CONTENIDOS", bold: true })],
            }),
          ]),
          cell([
            new Paragraph({
              children: [new TextRun({ text: "PDA", bold: true })],
            }),
          ]),
        ],
      }),
      new TableRow({
        children: [
          cell(contenidos.length ? contenidos : [new Paragraph("")]),
          cell(pdas.length ? pdas : [new Paragraph("")]),
        ],
      }),
    ],
  });

  // =========================
  // DOCUMENTO FINAL
  // =========================
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
          },
        },
        children: [
          header,
          new Paragraph({ text: "" }),
          table,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  saveAs(blob, `Planeacion_${proyecto || "NEM"}.docx`);
};