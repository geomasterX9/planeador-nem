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
  VerticalAlign,
  convertMillimetersToTwip,
  PageOrientation,
  ImageRun
} from "docx";
import { saveAs } from "file-saver";

// =========================
// SANITIZADOR (FIX PRINCIPAL)
// =========================
const sanitizeText = (text: any): string => {
  if (text === null || text === undefined) return "";

  let str = String(text);

  // Eliminar caracteres inválidos
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Escapar XML
  str = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  return str;
};

// =========================
// LISTAS CORRECTAS (SIN \n)
// =========================
const createBulletParagraphs = (items: string[]) => {
  return items.map(item =>
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: `• ${item}`,
          size: 18,
          font: "Calibri",
        }),
      ],
    })
  );
};

// =========================
// CELDAS
// =========================
const createCell = (
  text: string,
  isHeader: boolean = false,
  widthPct: number = 0,
  alignment: AlignmentType = AlignmentType.LEFT,
  bgColor?: string,
  colSpan: number = 1
) => {
  const textColor = bgColor === "1e3a8a" ? "FFFFFF" : "000000";

  return new TableCell({
    width:
      widthPct > 0
        ? { size: widthPct, type: WidthType.PERCENTAGE }
        : undefined,
    columnSpan: colSpan,
    shading: bgColor ? { fill: bgColor } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 30, bottom: 30, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment,
        children: [
          new TextRun({
            text,
            bold: isHeader,
            size: 18,
            color: textColor,
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
};

// =========================
// IMÁGENES
// =========================
const base64ToArrayBuffer = (base64DataUrl: string) => {
  try {
    if (!base64DataUrl) return null;

    const base64String = base64DataUrl.split(",")[1];
    if (!base64String) return null;

    const binaryString = window.atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
  } catch {
    return null;
  }
};

// =========================
// EXPORTACIÓN PRINCIPAL
// =========================
export const exportToWord = async (
  projectData: any,
  plannedItems: any[],
  actividades: Record<string, string>
) => {
  // =========================
  // DATOS
  // =========================
  const escuela = sanitizeText(projectData.escuela);
  const cct = sanitizeText(projectData.cct);
  const turno = sanitizeText(projectData.turno);
  const campo = sanitizeText(projectData.campo);
  const estrategia = sanitizeText(projectData.estrategia);
  const disciplina = sanitizeText(projectData.disciplina);
  const maestro = sanitizeText(projectData.maestro);
  const grado = sanitizeText(projectData.grado);
  const grupo = (projectData.grupo || []).join(", ");
  const proyecto = sanitizeText(projectData.proyecto);
  const fechaInicio = sanitizeText(projectData.fechaInicio);
  const fechaFin = sanitizeText(projectData.fechaFin);
  const sesiones = sanitizeText(projectData.sesiones);

  // =========================
  // LISTAS
  // =========================
  const contenidosList = plannedItems
    .filter(i => i.type === "content")
    .map(i => sanitizeText(i.text));

  const pdasList = plannedItems
    .filter(i => i.type === "pda")
    .map(i => sanitizeText(i.text));

  // =========================
  // HEADER
  // =========================
  const headerCells = [];

  const logoIzq = base64ToArrayBuffer(projectData.logoIzquierdo);
  const logoDer = base64ToArrayBuffer(projectData.logoDerecho);

  headerCells.push(
    new TableCell({
      width: { size: 15, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE } },
      children: logoIzq && logoIzq.length > 10
        ? [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({ data: logoIzq, transformation: { width: 90, height: 90 } })]
          })]
        : [new Paragraph("")]
    })
  );

  headerCells.push(
    new TableCell({
      width: { size: 70, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({ text: "SECRETARÍA DE EDUCACIÓN PÚBLICA", alignment: AlignmentType.CENTER }),
        new Paragraph({ text: escuela, alignment: AlignmentType.CENTER }),
        new Paragraph({ text: `CLAVE: ${cct}  TURNO: ${turno}`, alignment: AlignmentType.CENTER }),
        new Paragraph({ text: "PLANEACIÓN DIDÁCTICA", alignment: AlignmentType.CENTER }),
      ]
    })
  );

  headerCells.push(
    new TableCell({
      width: { size: 15, type: WidthType.PERCENTAGE },
      children: logoDer && logoDer.length > 10
        ? [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({ data: logoDer, transformation: { width: 90, height: 90 } })]
          })]
        : [new Paragraph("")]
    })
  );

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells })]
  });

  // =========================
  // TABLA CONTENIDOS
  // =========================
  const tableCurricula = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          createCell("CONTENIDOS", true, 50, AlignmentType.CENTER, "1e3a8a"),
          createCell("PDA", true, 50, AlignmentType.CENTER, "1e3a8a"),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: createBulletParagraphs(contenidosList),
          }),
          new TableCell({
            children: createBulletParagraphs(pdasList),
          }),
        ],
      }),
    ],
  });

  // =========================
  // DOCUMENTO
  // =========================
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: {
              top: convertMillimetersToTwip(12.7),
              bottom: convertMillimetersToTwip(12.7),
              left: convertMillimetersToTwip(12.7),
              right: convertMillimetersToTwip(12.7),
            },
          },
        },
        children: [
          headerTable,
          new Paragraph({ text: "" }),
          tableCurricula,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  saveAs(
    blob,
    `Planeacion_${proyecto.replace(/[^a-z0-9]/gi, "_") || "NEM"}.docx`
  );
};