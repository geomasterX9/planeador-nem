import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, VerticalAlign, convertMillimetersToTwip, PageOrientation, ImageRun } from "docx";
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
// BLINDAJE ANTI-CORRUPCIÓN (GUARDAESPALDAS)
// ==========================================
const safeText = (text: any): string => {
  if (text === null || text === undefined) return " ";
  const str = String(text).trim();
  return str === "" ? " " : str;
};

// Procesador de imágenes blindado
const safeImageBuffer = (base64DataUrl: string): ArrayBuffer | null => {
  if (!base64DataUrl || typeof base64DataUrl !== 'string' || !base64DataUrl.includes(',')) return null;
  try {
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

// Creador de celdas protegido
const createCell = (rawText: string, isHeader: boolean = false, widthPct: number = 0, alignment: AlignmentType = AlignmentType.LEFT, bgColor?: string, colSpan: number = 1) => {
  const textColor = bgColor === "1e3a8a" ? "FFFFFF" : "000000";
  const cleanText = safeText(rawText);
  
  const lineas = cleanText.split('\n');
  const paragraphs = lineas.map(linea => {
    const safeLinea = safeText(linea);
    return new Paragraph({
      alignment: alignment,
      spacing: { after: 40 }, // Espaciado mínimo seguro
      children: [new TextRun({ text: safeLinea, bold: isHeader, size: 18, color: textColor, font: "Calibri" })],
    });
  });

  return new TableCell({
    width: widthPct > 0 ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: colSpan > 1 ? colSpan : undefined,
    shading: bgColor ? { fill: bgColor } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: paragraphs,
  });
};

export const exportToWord = async (projectData: any, plannedItems: any[], actividades: Record<string, string>, evaluationData?: any) => {
  
  // Limpieza extrema de datos de entrada
  const pdasRaw = (plannedItems || []).filter(i => i.type === 'pda').map(i => safeText(i.text)).join('\n• ');
  const pdas = pdasRaw ? `• ${pdasRaw}` : " ";
  
  const contRaw = (plannedItems || []).filter(i => i.type === 'content').map(i => safeText(i.text)).join('\n• ');
  const contenidos = contRaw ? `• ${contRaw}` : " ";

  const ejesText = safeText((projectData.ejes || []).join(', '));
  const estrategiasEval = (projectData.estrategiaEvaluacion || []).join(', ');
  const herramientasEval = (projectData.herramientas || []).join(', ');
  const evaluacionText = safeText(`${estrategiasEval}\nInstrumentos: ${herramientasEval}`);
  
  const fases = obtenerFases(projectData.estrategia);

  // LOGOS BLINDADOS
  const logoIzq = safeImageBuffer(projectData.logoIzquierdo);
  const logoDer = safeImageBuffer(projectData.logoDerecho);

  const headerCells = [];

  // Logo Izquierdo
  headerCells.push(new TableCell({
    width: { size: 15, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
    verticalAlign: VerticalAlign.CENTER,
    children: logoIzq ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: logoIzq, transformation: { width: 80, height: 80 } })] })] : [new Paragraph({ children: [new TextRun(" ")] })]
  }));

  // Centro
  headerCells.push(new TableCell({
    width: { size: 70, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({ children: [new TextRun({ text: "SECRETARÍA DE EDUCACIÓN PÚBLICA", bold: true, size: 22, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: "DIRECCIÓN DE EDUCACIÓN SECUNDARIA GENERAL", bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: safeText(projectData.escuela || "NOMBRE DE LA ESCUELA"), bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: `CLAVE: ${safeText(projectData.cct)}    TURNO: ${safeText(projectData.turno)}`, bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: "PLANEACIÓN DIDÁCTICA", bold: true, size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 150 } }),
    ]
  }));

  // Logo Derecho
  headerCells.push(new TableCell({
    width: { size: 15, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
    verticalAlign: VerticalAlign.CENTER,
    children: logoDer ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: logoDer, transformation: { width: 80, height: 80 } })] })] : [new Paragraph({ children: [new TextRun(" ")] })]
  }));

  const tableHeaderOficial = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideHorizontal: { style: BorderStyle.NONE, size: 0 }, insideVertical: { style: BorderStyle.NONE, size: 0 } },
    rows: [new TableRow({ children: headerCells })]
  });

  // TABLA 1: DATOS
  const tableMetadata = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [ createCell("CAMPO FORMATIVO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(projectData.campo || "Lenguajes", true, 25, AlignmentType.CENTER), createCell("METODOLOGÍA", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(projectData.estrategia, true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("DISCIPLINA Y DOCENTE", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(`${safeText(projectData.disciplina)} - ${safeText(projectData.maestro)}`, true, 25, AlignmentType.CENTER), createCell("GRADO Y GRUPO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(`${safeText(projectData.grado)} "${safeText((projectData.grupo || []).join(', '))}"`, true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("PROYECTO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(projectData.proyecto, true, 25, AlignmentType.CENTER), createCell("INICIO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(projectData.fechaInicio, true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("FASE NEM", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell("6", true, 25, AlignmentType.CENTER), createCell("TÉRMINO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(projectData.fechaFin, true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("EJES ARTICULADORES", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(ejesText, false, 25, AlignmentType.CENTER), createCell("EVIDENCIAS / PRODUCTO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(" ", false, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("TOTAL SESIONES", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(projectData.sesiones?.toString(), true, 25, AlignmentType.CENTER), createCell("EVALUACIÓN FORMATIVA", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(evaluacionText, false, 25, AlignmentType.CENTER) ] }),
    ]
  });

  // TABLA 2: CONTENIDOS
  const tableCurricula = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [ createCell("CONTENIDOS", true, 50, AlignmentType.CENTER, "1e3a8a"), createCell("PROCESOS DE DESARROLLO DE APRENDIZAJE (PDA)", true, 50, AlignmentType.CENTER, "1e3a8a") ] }),
      new TableRow({ children: [ createCell(contenidos, false, 50, AlignmentType.LEFT), createCell(pdas, false, 50, AlignmentType.LEFT) ] })
    ]
  });

  // TABLA 3: SECUENCIA
  const secuenciaRows = [
    new TableRow({ children: [ createCell("FASES / MOMENTOS", true, 20, AlignmentType.CENTER, "1e3a8a"), createCell("DESARROLLO DE ACTIVIDADES", true, 80, AlignmentType.CENTER, "1e3a8a") ] })
  ];

  fases.forEach(fase => {
    const actText = safeText(actividades[fase.id]);
    secuenciaRows.push(
      new TableRow({
        children: [
          createCell(fase.titulo, true, 20, AlignmentType.CENTER),
          createCell(actText, false, 80, AlignmentType.LEFT)
        ]
      })
    );
  });

  const tableSecuencia = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: secuenciaRows });

  // TABLA 4: FIRMAS
  const tableFirmas = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideHorizontal: { style: BorderStyle.NONE, size: 0 }, insideVertical: { style: BorderStyle.NONE, size: 0 } },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: "________________________________________________", font: "Calibri" })], alignment: AlignmentType.CENTER }),
              new Paragraph({ children: [new TextRun({ text: "FIRMA DEL DOCENTE", bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 40 } }),
              new Paragraph({ children: [new TextRun({ text: safeText(projectData.maestro || "Nombre del Docente"), size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 20 } })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: "________________________________________________", font: "Calibri" })], alignment: AlignmentType.CENTER }),
              new Paragraph({ children: [new TextRun({ text: "Vo. Bo. COORDINADOR ACADÉMICO / DIRECCIÓN", bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 40 } }),
            ]
          })
        ]
      })
    ]
  });

  // Paracaídas espacial legal para Word
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
  saveAs(blob, `Planeacion_${safeText(projectData.proyecto).replace(/[^a-zA-Z0-9 ]/g, "")}.docx`);
};