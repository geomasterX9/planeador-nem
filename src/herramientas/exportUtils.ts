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

// Creador de Celdas Anti-Corrupción XML
const createCell = (text: string, isHeader: boolean = false, widthPct: number = 0, alignment: AlignmentType = AlignmentType.LEFT, bgColor?: string, colSpan: number = 1) => {
  const textColor = bgColor === "1E3A8A" ? "FFFFFF" : "000000";
  
  const lineas = (text || "").split('\n');
  const paragraphs = lineas.map(linea => {
    // Si la línea está vacía, mandamos un párrafo sin TextRun para no romper Word
    if (!linea || linea.trim() === "") return new Paragraph({});
    return new Paragraph({
      alignment: alignment,
      children: [new TextRun({ text: linea, bold: isHeader, size: 18, color: textColor, font: "Calibri" })],
    });
  });

  if (paragraphs.length === 0) paragraphs.push(new Paragraph({}));

  return new TableCell({
    width: widthPct > 0 ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: colSpan > 1 ? colSpan : undefined,
    shading: bgColor ? { fill: bgColor } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: paragraphs,
  });
};

// MAGIA PURA: La Lavadora de Imágenes. 
// Forzamos cualquier imagen subida a convertirse en un PNG puro binario.
const processImageToPngBuffer = async (dataUrl: string): Promise<Uint8Array | null> => {
  if (!dataUrl) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      
      ctx.drawImage(img, 0, 0);
      // Forzamos la salida a image/png puro, matando webp o formatos raros
      const pngUrl = canvas.toDataURL('image/png');
      const base64 = pngUrl.split(',')[1];
      const binary = window.atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      resolve(bytes);
    };
    img.onerror = () => resolve(null); 
    img.src = dataUrl;
  });
};

export const exportToWord = async (projectData: any, plannedItems: any[], actividades: Record<string, string>, evaluationData?: any) => {
  
  const pdas = plannedItems.filter(i => i.type === 'pda').map(i => i.text).join('\n• ');
  const contenidos = plannedItems.filter(i => i.type === 'content').map(i => i.text).join('\n• ');
  const ejesText = (projectData.ejes || []).join(', ');
  const evaluacionText = `${(projectData.estrategiaEvaluacion || []).join(', ')}\nInstrumentos: ${(projectData.herramientas || []).join(', ')}`;
  const fases = obtenerFases(projectData.estrategia);

  // LAVAMOS LAS IMÁGENES ANTES DE EMPEZAR
  const logoIzquierdoBuffer = await processImageToPngBuffer(projectData.logoIzquierdo);
  const logoDerechoBuffer = await processImageToPngBuffer(projectData.logoDerecho);

  // ENCABEZADO CON LOGOS
  const headerCells = [];

  headerCells.push(new TableCell({
    width: { size: 15, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
    verticalAlign: VerticalAlign.CENTER,
    children: logoIzquierdoBuffer 
      ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: logoIzquierdoBuffer, transformation: { width: 90, height: 90 } })] })] 
      : [new Paragraph({})]
  }));

  headerCells.push(new TableCell({
    width: { size: 70, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SECRETARÍA DE EDUCACIÓN PÚBLICA", bold: true, size: 22, font: "Calibri" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DIRECCIÓN DE EDUCACIÓN SECUNDARIA GENERAL", bold: true, size: 18, font: "Calibri" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: projectData.escuela || "NOMBRE DE LA ESCUELA", bold: true, size: 18, font: "Calibri" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `CLAVE: ${projectData.cct || ""}    TURNO: ${projectData.turno || ""}`, bold: true, size: 18, font: "Calibri" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "PLANEACIÓN DIDÁCTICA", bold: true, size: 20, font: "Calibri" })] }),
    ]
  }));

  headerCells.push(new TableCell({
    width: { size: 15, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
    verticalAlign: VerticalAlign.CENTER,
    children: logoDerechoBuffer 
      ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: logoDerechoBuffer, transformation: { width: 90, height: 90 } })] })] 
      : [new Paragraph({})]
  }));

  const tableHeaderOficial = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideHorizontal: { style: BorderStyle.NONE, size: 0 }, insideVertical: { style: BorderStyle.NONE, size: 0 } },
    rows: [new TableRow({ children: headerCells })]
  });

  // TABLA 1: DATOS INSTITUCIONALES
  const tableMetadata = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [ createCell("CAMPO FORMATIVO", true, 25, AlignmentType.CENTER, "F1F5F9"), createCell(projectData.campo || "Lenguajes", true, 25, AlignmentType.CENTER), createCell("METODOLOGÍA", true, 25, AlignmentType.CENTER, "F1F5F9"), createCell(projectData.estrategia || "", true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("DISCIPLINA Y DOCENTE", true, 25, AlignmentType.CENTER, "F1F5F9"), createCell(`${projectData.disciplina || ""} - ${projectData.maestro || ""}`, true, 25, AlignmentType.CENTER), createCell("GRADO Y GRUPO", true, 25, AlignmentType.CENTER, "F1F5F9"), createCell(`${projectData.grado || ""} "${(projectData.grupo || []).join(', ')}"`, true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("PROYECTO", true, 25, AlignmentType.CENTER, "F1F5F9"), createCell(projectData.proyecto || "", true, 25, AlignmentType.CENTER), createCell("INICIO", true, 25, AlignmentType.CENTER, "F1F5F9"), createCell(projectData.fechaInicio || "", true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("FASE NEM", true, 25, AlignmentType.CENTER, "F1F5F9"), createCell("6", true, 25, AlignmentType.CENTER), createCell("TÉRMINO", true, 25, AlignmentType.CENTER, "F1F5F9"), createCell(projectData.fechaFin || "", true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("EJES ARTICULADORES", true, 25, AlignmentType.CENTER, "F1F5F9"), createCell(ejesText, false, 25, AlignmentType.CENTER), createCell("EVIDENCIAS / PRODUCTO", true, 25, AlignmentType.CENTER, "F1F5F9"), createCell("", false, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("TOTAL SESIONES", true, 25, AlignmentType.CENTER, "F1F5F9"), createCell(projectData.sesiones?.toString() || "", true, 25, AlignmentType.CENTER), createCell("EVALUACIÓN FORMATIVA", true, 25, AlignmentType.CENTER, "F1F5F9"), createCell(evaluacionText, false, 25, AlignmentType.CENTER) ] }),
    ]
  });

  // TABLA 2: CONTENIDOS Y PDAS
  const tableCurricula = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [ createCell("CONTENIDOS", true, 50, AlignmentType.CENTER, "1E3A8A"), createCell("PROCESOS DE DESARROLLO DE APRENDIZAJE (PDA)", true, 50, AlignmentType.CENTER, "1E3A8A") ] }),
      new TableRow({ children: [ 
        new TableCell({ 
          margins: { top: 40, bottom: 40, left: 80, right: 80 }, 
          children: (`• ${contenidos}`).split('\n').map(line => {
            if (!line || line.trim() === "") return new Paragraph({});
            return new Paragraph({ children: [new TextRun({ text: line, size: 18, font: "Calibri" })] });
          }) 
        }),
        new TableCell({ 
          margins: { top: 40, bottom: 40, left: 80, right: 80 }, 
          children: (`• ${pdas}`).split('\n').map(line => {
            if (!line || line.trim() === "") return new Paragraph({});
            return new Paragraph({ children: [new TextRun({ text: line, size: 18, font: "Calibri" })] });
          }) 
        })
      ] })
    ]
  });

  // TABLA 3: SECUENCIA DIDÁCTICA
  const secuenciaRows = [
    new TableRow({ children: [ createCell("FASES / MOMENTOS", true, 20, AlignmentType.CENTER, "1E3A8A"), createCell("DESARROLLO DE ACTIVIDADES", true, 80, AlignmentType.CENTER, "1E3A8A") ] })
  ];

  fases.forEach(fase => {
    const actText = actividades[fase.id] || "";
    secuenciaRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: fase.titulo, bold: true, size: 18, font: "Calibri" })] })]
          }),
          new TableCell({
            width: { size: 80, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: actText.split('\n').map(line => {
              if (!line || line.trim() === "") return new Paragraph({});
              return new Paragraph({ children: [new TextRun({ text: line, size: 18, font: "Calibri" })] });
            })
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
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "________________________________________________" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40 }, children: [new TextRun({ text: "FIRMA DEL DOCENTE", bold: true, size: 18, font: "Calibri" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 20 }, children: [new TextRun({ text: projectData.maestro || "Nombre del Docente", size: 18, font: "Calibri" })] })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "________________________________________________" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40 }, children: [new TextRun({ text: "Vo. Bo. COORDINADOR ACADÉMICO / DIRECCIÓN", bold: true, size: 18, font: "Calibri" })] }),
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
        new Paragraph({}), // Espaciador 100% legal 
        tableMetadata,
        new Paragraph({}), 
        tableCurricula,
        new Paragraph({}), 
        tableSecuencia,
        new Paragraph({ spacing: { before: 600 } }), // Espacio extra para firmas
        tableFirmas,
        new Paragraph({}) // Paracaídas final para no terminar en tabla
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Planeacion_${projectData.proyecto || "NEM"}.docx`);
};