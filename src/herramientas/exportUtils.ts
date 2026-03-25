import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, VerticalAlign, convertMillimetersToTwip, PageOrientation, ImageRun } from "docx";
import { saveAs } from "file-saver";

// Diccionario interno para saber el nombre de las fases
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

// Utilidad optimizada para celdas compactas y contraste inteligente
const createCell = (text: string, isHeader: boolean = false, widthPct: number = 0, alignment: AlignmentType = AlignmentType.LEFT, bgColor?: string, colSpan: number = 1) => {
  const textColor = bgColor === "1e3a8a" ? "FFFFFF" : "000000";
  return new TableCell({
    width: widthPct > 0 ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: colSpan,
    shading: bgColor ? { fill: bgColor } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 30, bottom: 30, left: 80, right: 80 }, 
    children: [
      new Paragraph({
        alignment: alignment,
        children: [new TextRun({ text: text, bold: isHeader, size: 18, color: textColor, font: "Calibri" })],
      }),
    ],
  });
};

// --- EL ESCUDO PROTECTOR PARA LAS IMÁGENES ---
const getSafeImageData = (base64DataUrl: string) => {
  try {
    if (!base64DataUrl || typeof base64DataUrl !== 'string' || !base64DataUrl.includes(',')) {
      return null;
    }
    const base64String = base64DataUrl.split(',')[1];
    const binaryString = window.atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.length > 0 ? bytes : null;
  } catch (error) {
    console.warn("Se bloqueó una imagen corrupta para salvar el documento");
    return null;
  }
};

export const exportToWord = async (projectData: any, plannedItems: any[], actividades: Record<string, string>, evaluationData?: any) => {
  
  const pdas = plannedItems.filter(i => i.type === 'pda').map(i => i.text).join('\n• ');
  const contenidos = plannedItems.filter(i => i.type === 'content').map(i => i.text).join('\n• ');
  const ejesText = (projectData.ejes || []).join(', ');
  const evaluacionText = `${(projectData.estrategiaEvaluacion || []).join(', ')}\nInstrumentos: ${(projectData.herramientas || []).join(', ')}`;
  const fases = obtenerFases(projectData.estrategia);

  // Procesamos los logos con el escudo protector
  const logoIzqData = getSafeImageData(projectData.logoIzquierdo);
  const logoDerData = getSafeImageData(projectData.logoDerecho);

  // CONSTRUCCIÓN DEL ENCABEZADO CON LOGOS (TABLA INVISIBLE)
  const headerCells = [];

  // 1. Logo Izquierdo
  if (logoIzqData) {
    headerCells.push(new TableCell({
      width: { size: 15, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: logoIzqData, transformation: { width: 90, height: 90 } })] })]
    }));
  } else {
    headerCells.push(new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } }, children: [new Paragraph("")] }));
  }

  // 2. Centro (Textos Oficiales)
  headerCells.push(new TableCell({
    width: { size: 70, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({ children: [new TextRun({ text: "SECRETARÍA DE EDUCACIÓN PÚBLICA", bold: true, size: 22, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: "DIRECCIÓN DE EDUCACIÓN SECUNDARIA GENERAL", bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: projectData.escuela || "NOMBRE DE LA ESCUELA", bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: `CLAVE: ${projectData.cct || ""}    TURNO: ${projectData.turno || ""}`, bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: "PLANEACIÓN DIDÁCTICA", bold: true, size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 200 } }),
    ]
  }));

  // 3. Logo Derecho
  if (logoDerData) {
    headerCells.push(new TableCell({
      width: { size: 15, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: logoDerData, transformation: { width: 90, height: 90 } })] })]
    }));
  } else {
    headerCells.push(new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } }, children: [new Paragraph("")] }));
  }

  const tableHeaderOficial = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideHorizontal: { style: BorderStyle.NONE, size: 0 }, insideVertical: { style: BorderStyle.NONE, size: 0 } },
    rows: [new TableRow({ children: headerCells })]
  });

  // TABLA 1: DATOS INSTITUCIONALES Y METADATOS COMPACTA
  const tableMetadata = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [ createCell("CAMPO FORMATIVO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(projectData.campo || "Lenguajes", true, 25, AlignmentType.CENTER), createCell("METODOLOGÍA", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(projectData.estrategia || "", true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("DISCIPLINA Y DOCENTE", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(`${projectData.disciplina || ""} - ${projectData.maestro || ""}`, true, 25, AlignmentType.CENTER), createCell("GRADO Y GRUPO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(`${projectData.grado || ""} "${(projectData.grupo || []).join(', ')}"`, true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("PROYECTO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(projectData.proyecto || "", true, 25, AlignmentType.CENTER), createCell("INICIO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(projectData.fechaInicio || "", true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("FASE NEM", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell("6", true, 25, AlignmentType.CENTER), createCell("TÉRMINO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(projectData.fechaFin || "", true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("EJES ARTICULADORES", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(ejesText, false, 25, AlignmentType.CENTER), createCell("EVIDENCIAS / PRODUCTO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell("", false, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("TOTAL SESIONES", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(projectData.sesiones?.toString() || "", true, 25, AlignmentType.CENTER), createCell("EVALUACIÓN FORMATIVA", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(evaluacionText, false, 25, AlignmentType.CENTER) ] }),
    ]
  });

  // TABLA 2: CONTENIDOS Y PDAS
  const tableCurricula = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [ createCell("CONTENIDOS", true, 50, AlignmentType.CENTER, "1e3a8a"), createCell("PROCESOS DE DESARROLLO DE APRENDIZAJE (PDA)", true, 50, AlignmentType.CENTER, "1e3a8a") ] }),
      new TableRow({ children: [ 
        new TableCell({ margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [ new Paragraph({ children: [new TextRun({ text: `• ${contenidos}`, size: 18, font: "Calibri" })] }) ] }),
        new TableCell({ margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [ new Paragraph({ children: [new TextRun({ text: `• ${pdas}`, size: 18, font: "Calibri" })] }) ] })
      ] })
    ]
  });

  // TABLA 3: SECUENCIA DIDÁCTICA
  const secuenciaRows = [
    new TableRow({ children: [ createCell("FASES / MOMENTOS", true, 20, AlignmentType.CENTER, "1e3a8a"), createCell("DESARROLLO DE ACTIVIDADES", true, 80, AlignmentType.CENTER, "1e3a8a") ] })
  ];

  fases.forEach(fase => {
    const actText = actividades[fase.id] || "";
    secuenciaRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: fase.titulo, bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            width: { size: 80, type: WidthType.PERCENTAGE },
            margins: { top: 150, bottom: 150, left: 150, right: 150 },
            children: actText.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line, size: 18, font: "Calibri" })], spacing: { after: 100 } }))
          })
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
              new Paragraph({ text: "________________________________________________", alignment: AlignmentType.CENTER }),
              new Paragraph({ children: [new TextRun({ text: "FIRMA DEL DOCENTE", bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 100 } }),
              new Paragraph({ children: [new TextRun({ text: projectData.maestro || "Nombre del Docente", size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 50 } })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ text: "________________________________________________", alignment: AlignmentType.CENTER }),
              new Paragraph({ children: [new TextRun({ text: "Vo. Bo. COORDINADOR ACADÉMICO / DIRECCIÓN", bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 100 } }),
            ]
          })
        ]
      })
    ]
  });

  // CONSTRUCCIÓN DEL DOCUMENTO FINAL
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            orientation: PageOrientation.LANDSCAPE,
          },
          margin: {
            top: convertMillimetersToTwip(12.7),
            bottom: convertMillimetersToTwip(12.7),
            left: convertMillimetersToTwip(12.7),
            right: convertMillimetersToTwip(12.7),
          }
        }
      },
      children: [
        tableHeaderOficial, // <-- AQUÍ INSERTAMOS LA TABLA CON LOS LOGOS
        new Paragraph({ spacing: { before: 200 } }), 
        
        tableMetadata,
        new Paragraph({ spacing: { before: 200 } }), 
        
        tableCurricula,
        new Paragraph({ spacing: { before: 200 } }), 
        
        tableSecuencia,
        new Paragraph({ spacing: { before: 800 } }), 
        
        tableFirmas
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Planeacion_${projectData.proyecto || "NEM"}.docx`);
};