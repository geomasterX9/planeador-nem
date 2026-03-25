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

// Transformador de Imagen de React a Word (Base64 a Uint8Array) - CORREGIDO
const base64ToArrayBuffer = (base64DataUrl: string) => {
  try {
    if (!base64DataUrl || typeof base64DataUrl !== 'string') {
      console.error('URL de imagen inválida');
      return new Uint8Array(0);
    }
    const base64String = base64DataUrl.split(',')[1];
    if (!base64String) {
      console.error('No se pudo extraer la cadena base64');
      return new Uint8Array(0);
    }
    const binaryString = window.atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error('Error procesando imagen:', error);
    return new Uint8Array(0);
  }
};

export const exportToWord = async (projectData: any, plannedItems: any[], actividades: Record<string, string>, evaluationData?: any) => {
  
  // Sanitizar textos para evitar caracteres problemáticos
  const sanitizeText = (text: any): string => {
    if (text === null || text === undefined) return '';
    let str = String(text);
    // Reemplazar caracteres que pueden romper XML
    str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    return str;
  };
  
  const pdas = plannedItems.filter(i => i.type === 'pda').map(i => sanitizeText(i.text)).join('\n• ');
  const contenidos = plannedItems.filter(i => i.type === 'content').map(i => sanitizeText(i.text)).join('\n• ');
  const ejesText = (projectData.ejes || []).map((e: any) => sanitizeText(e)).join(', ');
  const evaluacionText = `${(projectData.estrategiaEvaluacion || []).map((e: any) => sanitizeText(e)).join(', ')}\nInstrumentos: ${(projectData.herramientas || []).map((h: any) => sanitizeText(h)).join(', ')}`;
  const fases = obtenerFases(projectData.estrategia);
  
  // Sanitizar datos del proyecto
  const escuela = sanitizeText(projectData.escuela) || "NOMBRE DE LA ESCUELA";
  const cct = sanitizeText(projectData.cct) || "";
  const turno = sanitizeText(projectData.turno) || "";
  const campo = sanitizeText(projectData.campo) || "Lenguajes";
  const estrategia = sanitizeText(projectData.estrategia) || "";
  const disciplina = sanitizeText(projectData.disciplina) || "";
  const maestro = sanitizeText(projectData.maestro) || "";
  const grado = sanitizeText(projectData.grado) || "";
  const grupo = (projectData.grupo || []).map((g: any) => sanitizeText(g)).join(', ');
  const proyecto = sanitizeText(projectData.proyecto) || "";
  const fechaInicio = sanitizeText(projectData.fechaInicio) || "";
  const fechaFin = sanitizeText(projectData.fechaFin) || "";
  const sesiones = sanitizeText(projectData.sesiones) || "";

  // CONSTRUCCIÓN DEL ENCABEZADO CON LOGOS (TABLA INVISIBLE)
  const headerCells = [];

  // 1. Logo Izquierdo
  if (projectData.logoIzquierdo) {
    const imgData = base64ToArrayBuffer(projectData.logoIzquierdo);
    if (imgData.length > 0) {
      headerCells.push(new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: imgData, transformation: { width: 90, height: 90 } })] })]
      }));
    } else {
      headerCells.push(new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } }, children: [new Paragraph("")] }));
    }
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
      new Paragraph({ children: [new TextRun({ text: escuela, bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: `CLAVE: ${cct}    TURNO: ${turno}`, bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: "PLANEACIÓN DIDÁCTICA", bold: true, size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 200 } }),
    ]
  }));

  // 3. Logo Derecho
  if (projectData.logoDerecho) {
    const imgData = base64ToArrayBuffer(projectData.logoDerecho);
    if (imgData.length > 0) {
      headerCells.push(new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: imgData, transformation: { width: 90, height: 90 } })] })]
      }));
    } else {
      headerCells.push(new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } }, children: [new Paragraph("")] }));
    }
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
      new TableRow({ children: [ createCell("CAMPO FORMATIVO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(campo, true, 25, AlignmentType.CENTER), createCell("METODOLOGÍA", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(estrategia, true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("DISCIPLINA Y DOCENTE", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(`${disciplina} - ${maestro}`, true, 25, AlignmentType.CENTER), createCell("GRADO Y GRUPO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(`${grado} "${grupo}"`, true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("PROYECTO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(proyecto, true, 25, AlignmentType.CENTER), createCell("INICIO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(fechaInicio, true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("FASE NEM", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell("6", true, 25, AlignmentType.CENTER), createCell("TÉRMINO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(fechaFin, true, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("EJES ARTICULADORES", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(ejesText, false, 25, AlignmentType.CENTER), createCell("EVIDENCIAS / PRODUCTO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell("", false, 25, AlignmentType.CENTER) ] }),
      new TableRow({ children: [ createCell("TOTAL SESIONES", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(sesiones, true, 25, AlignmentType.CENTER), createCell("EVALUACIÓN FORMATIVA", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(evaluacionText, false, 25, AlignmentType.CENTER) ] }),
    ]
  });

  // TABLA 2: CONTENIDOS Y PDAS - MANTENIENDO EL MISMO ESTILO QUE EL FUNCIONAL
  const tableCurricula = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [ createCell("CONTENIDOS", true, 50, AlignmentType.CENTER, "1e3a8a"), createCell("PROCESOS DE DESARROLLO DE APRENDIZAJE (PDA)", true, 50, AlignmentType.CENTER, "1e3a8a") ] }),
      new TableRow({ children: [ 
        new TableCell({ 
          margins: { top: 80, bottom: 80, left: 100, right: 100 }, 
          children: [ new Paragraph({ children: [new TextRun({ text: `• ${contenidos}`, size: 18, font: "Calibri" })] }) ] 
        }),
        new TableCell({ 
          margins: { top: 80, bottom: 80, left: 100, right: 100 }, 
          children: [ new Paragraph({ children: [new TextRun({ text: `• ${pdas}`, size: 18, font: "Calibri" })] }) ] 
        })
      ] })
    ]
  });

  // TABLA 3: SECUENCIA DIDÁCTICA - MANTENIENDO EL MISMO ESTILO QUE EL FUNCIONAL
  const secuenciaRows = [
    new TableRow({ children: [ createCell("FASES / MOMENTOS", true, 20, AlignmentType.CENTER, "1e3a8a"), createCell("DESARROLLO DE ACTIVIDADES", true, 80, AlignmentType.CENTER, "1e3a8a") ] })
  ];

  fases.forEach(fase => {
    const actText = sanitizeText(actividades[fase.id]) || "";
    secuenciaRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: fase.titulo, bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER })]
          }),
          // IMPORTANTE: Usar un solo párrafo, no múltiples con split, como en el funcional
          new TableCell({
            width: { size: 80, type: WidthType.PERCENTAGE },
            margins: { top: 150, bottom: 150, left: 150, right: 150 },
            children: [new Paragraph({ children: [new TextRun({ text: actText, size: 18, font: "Calibri" })] })]
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
              new Paragraph({ children: [new TextRun({ text: maestro || "Nombre del Docente", size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 50 } })
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
        tableHeaderOficial,
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
  saveAs(blob, `Planeacion_${proyecto.replace(/[^a-z0-9]/gi, '_') || "NEM"}.docx`);
};