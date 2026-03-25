import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, VerticalAlign, convertMillimetersToTwip, PageOrientation, ImageRun, TableLayoutType } from "docx";
import { saveAs } from "file-saver";

// Diccionario interno
const fasesMetodologias: Record<string, { id: string, titulo: string }[]> = {
  "Aprendizaje basado en proyectos comunitarios": [
    { id: 'f1', titulo: 'Momento 1. Identificación' }, { id: 'f2', titulo: 'Momento 2. Recuperación' },
    { id: 'f3', titulo: 'Momento 3. Planificación' }, { id: 'f4', titulo: 'Momento 4. Acercamiento' },
    { id: 'f5', titulo: 'Momento 5. Comprensión y producción' }, { id: 'f6', titulo: 'Momento 6. Reconocimiento' },
    { id: 'f7', titulo: 'Momento 7. Concreción' }, { id: 'f8', titulo: 'Momento 8. Integración' },
    { id: 'f9', titulo: 'Momento 9. Difusión' }, { id: 'f10', titulo: 'Momento 10. Consideraciones' },
    { id: 'f11', titulo: 'Momento 11. Avances' }
  ],
  "Aprendizaje basado en indagación (STEAM como enfoque)": [
    { id: 'f1', titulo: 'Fase 1. Introducción al tema' }, { id: 'f2', titulo: 'Fase 2. Diseño de investigación' },
    { id: 'f3', titulo: 'Fase 3. Organizar y estructurar' }, { id: 'f4', titulo: 'Fase 4. Presentación de resultados' },
    { id: 'f5', titulo: 'Fase 5. Metacognición' }
  ],
  "Aprendizaje Basado en Problemas (ABP)": [
    { id: 'f1', titulo: '1. Presentemos' }, { id: 'f2', titulo: '2. Recolectemos' },
    { id: 'f3', titulo: '3. Formulemos el problema' }, { id: 'f4', titulo: '4. Organicemos la experiencia' },
    { id: 'f5', titulo: '5. Vivamos la experiencia' }, { id: 'f6', titulo: '6. Resultados y análisis' }
  ],
  "Aprendizaje Servicio (AS)": [
    { id: 'f1', titulo: 'Etapa 1. Punto de partida' }, { id: 'f2', titulo: 'Etapa 2. Lo que sé y lo que quiero saber' },
    { id: 'f3', titulo: 'Etapa 3. Organicemos las actividades' }, { id: 'f4', titulo: 'Etapa 4. Creatividad en marcha' },
    { id: 'f5', titulo: 'Etapa 5. Compartimos y evaluamos' }
  ],
  "Secuencia didáctica": [
    { id: 'f1', titulo: 'Inicio' }, { id: 'f2', titulo: 'Desarrollo' }, { id: 'f3', titulo: 'Cierre' }
  ]
};

const obtenerFases = (estrategia: string) => {
  const est = (estrategia || "").toLowerCase();
  if (est.includes("comunitario")) return fasesMetodologias["Aprendizaje basado en proyectos comunitarios"];
  if (est.includes("steam") || est.includes("indagación")) return fasesMetodologias["Aprendizaje basado en indagación (STEAM como enfoque)"];
  if (est.includes("problemas") || est.includes("abp")) return fasesMetodologias["Aprendizaje Basado en Problemas (ABP)"];
  if (est.includes("servicio") || est.includes("as")) return fasesMetodologias["Aprendizaje Servicio (AS)"];
  return fasesMetodologias["Secuencia didáctica"];
};

// ==========================================
// ELIMINADOR DE CARACTERES CORRUPTOS (XML FIX)
// ==========================================
const cleanText = (text: any): string => {
  if (!text) return " ";
  // Elimina caracteres de control invisibles que rompen Microsoft Word
  return String(text).replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, "").trim() || " ";
};

// Procesador de imágenes seguro
const safeImageBuffer = (base64DataUrl: string): ArrayBuffer | null => {
  try {
    if (!base64DataUrl || !base64DataUrl.includes(',')) return null;
    const base64String = base64DataUrl.split(',')[1];
    const binaryString = window.atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    return null;
  }
};

// Creador de Encabezados de Tabla (Centrados y Negritas)
const createHeaderCell = (text: string, bgColor?: string, colSpan: number = 1) => {
  const textColor = bgColor === "1e3a8a" ? "FFFFFF" : "000000";
  return new TableCell({
    columnSpan: colSpan > 1 ? colSpan : undefined,
    shading: bgColor ? { fill: bgColor } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: cleanText(text), bold: true, size: 18, color: textColor, font: "Calibri" })],
    })],
  });
};

// Creador de Celdas de Contenido (Izquierda, normal)
const createContentCell = (text: string, colSpan: number = 1) => {
  const lineas = cleanText(text).split('\n');
  const paragraphs = lineas.map(linea => new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 40 },
    children: [new TextRun({ text: cleanText(linea), size: 18, font: "Calibri" })],
  }));

  return new TableCell({
    columnSpan: colSpan > 1 ? colSpan : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: " " })],
  });
};

export const exportToWord = async (projectData: any, plannedItems: any[], actividades: Record<string, string>, evaluationData?: any) => {
  
  const pdasRaw = (plannedItems || []).filter(i => i.type === 'pda').map(i => cleanText(i.text)).join('\n• ');
  const pdas = pdasRaw ? `• ${pdasRaw}` : " ";
  
  const contRaw = (plannedItems || []).filter(i => i.type === 'content').map(i => cleanText(i.text)).join('\n• ');
  const contenidos = contRaw ? `• ${contRaw}` : " ";

  const ejesText = cleanText((projectData.ejes || []).join(', '));
  const estrategiasEval = (projectData.estrategiaEvaluacion || []).join(', ');
  const herramientasEval = (projectData.herramientas || []).join(', ');
  const evaluacionText = cleanText(`Estrategias: ${estrategiasEval}\nInstrumentos: ${herramientasEval}`);
  
  const fases = obtenerFases(projectData.estrategia);

  const logoIzq = safeImageBuffer(projectData.logoIzquierdo);
  const logoDer = safeImageBuffer(projectData.logoDerecho);

  // ANCHO TOTAL FIJO (DXA) PARA EVITAR COLAPSO DE COLUMNAS = 15000 twips
  const ANCHO_TOTAL = 15000;

  // TABLA ENCABEZADO CON LOGOS
  const headerCells = [];

  headerCells.push(new TableCell({
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
    verticalAlign: VerticalAlign.CENTER,
    children: logoIzq ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: logoIzq, transformation: { width: 80, height: 80 } })] })] : [new Paragraph({ text: " " })]
  }));

  headerCells.push(new TableCell({
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({ children: [new TextRun({ text: "SECRETARÍA DE EDUCACIÓN PÚBLICA", bold: true, size: 22, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: "DIRECCIÓN DE EDUCACIÓN SECUNDARIA GENERAL", bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: cleanText(projectData.escuela || "NOMBRE DE LA ESCUELA"), bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: `CLAVE: ${cleanText(projectData.cct)}    TURNO: ${cleanText(projectData.turno)}`, bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: "PLANEACIÓN DIDÁCTICA", bold: true, size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 150 } }),
    ]
  }));

  headerCells.push(new TableCell({
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
    verticalAlign: VerticalAlign.CENTER,
    children: logoDer ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: logoDer, transformation: { width: 80, height: 80 } })] })] : [new Paragraph({ text: " " })]
  }));

  const tableHeaderOficial = new Table({
    columnWidths: [2250, 10500, 2250], // Medidas fijas
    layout: TableLayoutType.FIXED,
    width: { size: ANCHO_TOTAL, type: WidthType.DXA },
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideHorizontal: { style: BorderStyle.NONE, size: 0 }, insideVertical: { style: BorderStyle.NONE, size: 0 } },
    rows: [new TableRow({ children: headerCells })]
  });

  // TABLA 1: DATOS (4 Columnas Iguales = 3750 cada una)
  const tableMetadata = new Table({
    columnWidths: [3750, 3750, 3750, 3750], // Fijo
    layout: TableLayoutType.FIXED,
    width: { size: ANCHO_TOTAL, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [ createHeaderCell("CAMPO FORMATIVO", "f1f5f9"), createHeaderCell(projectData.campo || "Lenguajes"), createHeaderCell("METODOLOGÍA", "f1f5f9"), createHeaderCell(projectData.estrategia) ] }),
      new TableRow({ children: [ createHeaderCell("DISCIPLINA Y DOCENTE", "f1f5f9"), createHeaderCell(`${cleanText(projectData.disciplina)} - ${cleanText(projectData.maestro)}`), createHeaderCell("GRADO Y GRUPO", "f1f5f9"), createHeaderCell(`${cleanText(projectData.grado)} "${cleanText((projectData.grupo || []).join(', '))}"`) ] }),
      new TableRow({ children: [ createHeaderCell("PROYECTO", "f1f5f9"), createHeaderCell(projectData.proyecto), createHeaderCell("INICIO", "f1f5f9"), createHeaderCell(projectData.fechaInicio) ] }),
      new TableRow({ children: [ createHeaderCell("FASE NEM", "f1f5f9"), createHeaderCell("6"), createHeaderCell("TÉRMINO", "f1f5f9"), createHeaderCell(projectData.fechaFin) ] }),
      new TableRow({ children: [ createHeaderCell("EJES ARTICULADORES", "f1f5f9"), createContentCell(ejesText), createHeaderCell("EVIDENCIAS / PRODUCTO", "f1f5f9"), createContentCell(" ") ] }),
      new TableRow({ children: [ createHeaderCell("TOTAL SESIONES", "f1f5f9"), createHeaderCell(projectData.sesiones?.toString()), createHeaderCell("EVALUACIÓN FORMATIVA", "f1f5f9"), createContentCell(evaluacionText) ] }),
    ]
  });

  // TABLA 2: CONTENIDOS (2 Columnas = 7500 cada una)
  const tableCurricula = new Table({
    columnWidths: [7500, 7500],
    layout: TableLayoutType.FIXED,
    width: { size: ANCHO_TOTAL, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [ createHeaderCell("CONTENIDOS", "1e3a8a"), createHeaderCell("PROCESOS DE DESARROLLO DE APRENDIZAJE (PDA)", "1e3a8a") ] }),
      new TableRow({ children: [ createContentCell(contenidos), createContentCell(pdas) ] })
    ]
  });

  // TABLA 3: SECUENCIA (2 Columnas: 20% y 80% = 3000 y 12000)
  const secuenciaRows = [
    new TableRow({ children: [ createHeaderCell("FASES / MOMENTOS", "1e3a8a"), createHeaderCell("DESARROLLO DE ACTIVIDADES", "1e3a8a") ] })
  ];

  fases.forEach(fase => {
    secuenciaRows.push(
      new TableRow({
        children: [
          createHeaderCell(fase.titulo),
          createContentCell(actividades[fase.id])
        ]
      })
    );
  });

  const tableSecuencia = new Table({ 
    columnWidths: [3000, 12000],
    layout: TableLayoutType.FIXED,
    width: { size: ANCHO_TOTAL, type: WidthType.DXA }, 
    rows: secuenciaRows 
  });

  // TABLA 4: FIRMAS (2 Columnas = 7500 cada una)
  const tableFirmas = new Table({
    columnWidths: [7500, 7500],
    layout: TableLayoutType.FIXED,
    width: { size: ANCHO_TOTAL, type: WidthType.DXA },
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideHorizontal: { style: BorderStyle.NONE, size: 0 }, insideVertical: { style: BorderStyle.NONE, size: 0 } },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: "________________________________________________", font: "Calibri" })], alignment: AlignmentType.CENTER }),
              new Paragraph({ children: [new TextRun({ text: "FIRMA DEL DOCENTE", bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 40 } }),
              new Paragraph({ children: [new TextRun({ text: cleanText(projectData.maestro || "Nombre del Docente"), size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 20 } })
            ]
          }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: "________________________________________________", font: "Calibri" })], alignment: AlignmentType.CENTER }),
              new Paragraph({ children: [new TextRun({ text: "Vo. Bo. COORDINADOR ACADÉMICO / DIRECCIÓN", bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 40 } }),
            ]
          })
        ]
      })
    ]
  });

  const espaciador = new Paragraph({ children: [new TextRun({ text: " " })] });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.LANDSCAPE },
          margin: {
            top: convertMillimetersToTwip(12.7),
            bottom: convertMillimetersToTwip(12.7),
            left: convertMillimetersToTwip(12.7),
            right: convertMillimetersToTwip(12.7),
          }
        }
      },
      children: [
        tableHeaderOficial, 
        espaciador, 
        tableMetadata,
        espaciador, 
        tableCurricula,
        espaciador, 
        tableSecuencia,
        new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: " " })] }), 
        tableFirmas,
        espaciador 
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Planeacion_${cleanText(projectData.proyecto).replace(/[^a-zA-Z0-9 ]/g, "") || "NEM"}.docx`);
};