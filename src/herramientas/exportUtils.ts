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

// Función para sanitizar texto (evita caracteres que rompan XML)
const sanitizeText = (text: any): string => {
  if (text === null || text === undefined) return '';
  let str = String(text);
  // Eliminar caracteres de control no válidos en XML
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return str;
};

// Procesador de imágenes seguro con validación
const base64ToArrayBuffer = (base64DataUrl: string): ArrayBuffer | null => {
  try {
    if (!base64DataUrl || typeof base64DataUrl !== 'string') return null;
    if (!base64DataUrl.includes(',')) return null;
    
    const base64String = base64DataUrl.split(',')[1];
    if (!base64String) return null;
    
    const binaryString = window.atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error('Error procesando imagen:', error);
    return null;
  }
};

// Creador de celdas seguro
const createCell = (text: any, isHeader: boolean = false, widthPct: number = 0, alignment: AlignmentType = AlignmentType.LEFT, bgColor?: string, colSpan: number = 1) => {
  const safeText = sanitizeText(text);
  const textColor = bgColor === "1e3a8a" ? "FFFFFF" : "000000";
  
  const lineas = safeText.split('\n').filter(line => line.trim() !== '');
  const paragraphs = lineas.length > 0 
    ? lineas.map(linea => 
        new Paragraph({
          alignment: alignment,
          children: [new TextRun({ text: linea || "", bold: isHeader, size: 22, font: "Calibri" })],
          spacing: { after: 80, line: 240 }
        })
      )
    : [new Paragraph({ children: [new TextRun("")] })];

  return new TableCell({
    width: widthPct > 0 ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: colSpan,
    shading: bgColor ? { fill: bgColor, color: "auto" } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: paragraphs,
  });
};

export const exportToWord = async (projectData: any, plannedItems: any[], actividades: Record<string, string>, evaluationData?: any) => {
  try {
    console.log('Iniciando exportación...');
    
    // Validar datos mínimos
    if (!projectData) {
      throw new Error('No hay datos del proyecto');
    }
    
    // Sanitizar datos
    const sanitizedProjectData = {
      ...projectData,
      escuela: sanitizeText(projectData.escuela),
      cct: sanitizeText(projectData.cct),
      turno: sanitizeText(projectData.turno),
      campo: sanitizeText(projectData.campo),
      estrategia: sanitizeText(projectData.estrategia),
      disciplina: sanitizeText(projectData.disciplina),
      maestro: sanitizeText(projectData.maestro),
      grado: sanitizeText(projectData.grado),
      proyecto: sanitizeText(projectData.proyecto),
      fechaInicio: sanitizeText(projectData.fechaInicio),
      fechaFin: sanitizeText(projectData.fechaFin),
      sesiones: sanitizeText(projectData.sesiones),
    };
    
    const pdas = plannedItems.filter(i => i.type === 'pda').map(i => sanitizeText(i.text)).join('\n• ');
    const contenidos = plannedItems.filter(i => i.type === 'content').map(i => sanitizeText(i.text)).join('\n• ');
    const ejesText = (sanitizedProjectData.ejes || []).map((e: any) => sanitizeText(e)).join(', ');
    const evaluacionText = `${(sanitizedProjectData.estrategiaEvaluacion || []).map((e: any) => sanitizeText(e)).join(', ')}\nInstrumentos: ${(sanitizedProjectData.herramientas || []).map((h: any) => sanitizeText(h)).join(', ')}`;
    const fases = obtenerFases(sanitizedProjectData.estrategia);
    const grupoText = Array.isArray(sanitizedProjectData.grupo) ? sanitizedProjectData.grupo.map((g: any) => sanitizeText(g)).join(', ') : sanitizeText(sanitizedProjectData.grupo);

    // Crear el documento con estructura simple primero
    const children: any[] = [];

    // ENCABEZADO CON LOGOS
    const headerCells = [];

    // Logo izquierdo
    if (sanitizedProjectData.logoIzquierdo) {
      const imageData = base64ToArrayBuffer(sanitizedProjectData.logoIzquierdo);
      if (imageData) {
        try {
          headerCells.push(new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: imageData, transformation: { width: 80, height: 80 } })] })]
          }));
        } catch (error) {
          console.error('Error agregando logo izquierdo:', error);
          headerCells.push(createCell("", false, 15));
        }
      } else {
        headerCells.push(createCell("", false, 15));
      }
    } else {
      headerCells.push(createCell("", false, 15));
    }

    // Texto central
    headerCells.push(new TableCell({
      width: { size: 70, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({ children: [new TextRun({ text: "SECRETARÍA DE EDUCACIÓN PÚBLICA", bold: true, size: 24, font: "Calibri" })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: "DIRECCIÓN DE EDUCACIÓN SECUNDARIA GENERAL", bold: true, size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: sanitizedProjectData.escuela || "NOMBRE DE LA ESCUELA", bold: true, size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: `CLAVE: ${sanitizedProjectData.cct || ""}    TURNO: ${sanitizedProjectData.turno || ""}`, bold: true, size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: "PLANEACIÓN DIDÁCTICA", bold: true, size: 24, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 200 } }),
      ]
    }));

    // Logo derecho
    if (sanitizedProjectData.logoDerecho) {
      const imageData = base64ToArrayBuffer(sanitizedProjectData.logoDerecho);
      if (imageData) {
        try {
          headerCells.push(new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: imageData, transformation: { width: 80, height: 80 } })] })]
          }));
        } catch (error) {
          console.error('Error agregando logo derecho:', error);
          headerCells.push(createCell("", false, 15));
        }
      } else {
        headerCells.push(createCell("", false, 15));
      }
    } else {
      headerCells.push(createCell("", false, 15));
    }

    const tableHeaderOficial = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
      rows: [new TableRow({ children: headerCells })]
    });
    
    children.push(tableHeaderOficial);
    children.push(new Paragraph({ children: [new TextRun("")] }));

    // TABLA 1: DATOS INSTITUCIONALES
    const tableMetadata = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [ createCell("CAMPO FORMATIVO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(sanitizedProjectData.campo || "Lenguajes", false, 25, AlignmentType.CENTER), createCell("METODOLOGÍA", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(sanitizedProjectData.estrategia || "", false, 25, AlignmentType.CENTER) ] }),
        new TableRow({ children: [ createCell("DISCIPLINA Y DOCENTE", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(`${sanitizedProjectData.disciplina || ""} - ${sanitizedProjectData.maestro || ""}`, false, 25, AlignmentType.CENTER), createCell("GRADO Y GRUPO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(`${sanitizedProjectData.grado || ""} "${grupoText}"`, false, 25, AlignmentType.CENTER) ] }),
        new TableRow({ children: [ createCell("PROYECTO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(sanitizedProjectData.proyecto || "", false, 25, AlignmentType.CENTER), createCell("INICIO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(sanitizedProjectData.fechaInicio || "", false, 25, AlignmentType.CENTER) ] }),
        new TableRow({ children: [ createCell("FASE NEM", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell("6", false, 25, AlignmentType.CENTER), createCell("TÉRMINO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(sanitizedProjectData.fechaFin || "", false, 25, AlignmentType.CENTER) ] }),
        new TableRow({ children: [ createCell("EJES ARTICULADORES", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(ejesText, false, 25, AlignmentType.LEFT), createCell("EVIDENCIAS / PRODUCTO", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell("", false, 25, AlignmentType.CENTER) ] }),
        new TableRow({ children: [ createCell("TOTAL SESIONES", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(sanitizedProjectData.sesiones?.toString() || "", false, 25, AlignmentType.CENTER), createCell("EVALUACIÓN FORMATIVA", true, 25, AlignmentType.CENTER, "f1f5f9"), createCell(evaluacionText, false, 25, AlignmentType.LEFT) ] }),
      ]
    });
    
    children.push(tableMetadata);
    children.push(new Paragraph({ children: [new TextRun("")] }));

    // TABLA 2: CONTENIDOS Y PDAS
    const contenidosText = contenidos ? `• ${contenidos}` : "• Sin contenidos registrados";
    const pdasText = pdas ? `• ${pdas}` : "• Sin PDA registrados";
    
    const tableCurricula = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [ createCell("CONTENIDOS", true, 50, AlignmentType.CENTER, "1e3a8a"), createCell("PROCESOS DE DESARROLLO DE APRENDIZAJE (PDA)", true, 50, AlignmentType.CENTER, "1e3a8a") ] }),
        new TableRow({ children: [ 
          new TableCell({ 
            margins: { top: 80, bottom: 80, left: 100, right: 100 }, 
            children: contenidosText.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line || "", size: 20, font: "Calibri" })], spacing: { after: 60 } })) 
          }),
          new TableCell({ 
            margins: { top: 80, bottom: 80, left: 100, right: 100 }, 
            children: pdasText.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line || "", size: 20, font: "Calibri" })], spacing: { after: 60 } })) 
          })
        ] })
      ]
    });
    
    children.push(tableCurricula);
    children.push(new Paragraph({ children: [new TextRun("")] }));

    // TABLA 3: SECUENCIA DIDÁCTICA
    const secuenciaRows = [
      new TableRow({ children: [ createCell("FASES / MOMENTOS", true, 20, AlignmentType.CENTER, "1e3a8a"), createCell("DESARROLLO DE ACTIVIDADES", true, 80, AlignmentType.CENTER, "1e3a8a") ] })
    ];

    fases.forEach(fase => {
      const actText = sanitizeText(actividades[fase.id] || "Actividad no registrada");
      secuenciaRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: fase.titulo, bold: true, size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER })]
            }),
            new TableCell({
              width: { size: 80, type: WidthType.PERCENTAGE },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: actText.split('\n').filter(line => line.trim()).map(line => new Paragraph({ children: [new TextRun({ text: line, size: 20, font: "Calibri" })], spacing: { after: 80 } }))
            })
          ]
        })
      );
    });

    const tableSecuencia = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: secuenciaRows });
    children.push(tableSecuencia);
    children.push(new Paragraph({ children: [new TextRun("")] }));
    children.push(new Paragraph({ children: [new TextRun("")] }));

    // TABLA 4: FIRMAS
    const tableFirmas = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ text: "_________________________", alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new TextRun({ text: "FIRMA DEL DOCENTE", bold: true, size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 60 } }),
                new Paragraph({ children: [new TextRun({ text: sanitizedProjectData.maestro || "Nombre del Docente", size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 40 } })
              ]
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ text: "_________________________", alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new TextRun({ text: "Vo. Bo. COORDINADOR ACADÉMICO / DIRECCIÓN", bold: true, size: 20, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 60 } }),
              ]
            })
          ]
        })
      ]
    });
    
    children.push(tableFirmas);

    // Crear el documento final
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
        children: children,
      }],
    });

    console.log('Generando blob...');
    const blob = await Packer.toBlob(doc);
    console.log('Guardando archivo...');
    saveAs(blob, `Planeacion_${sanitizedProjectData.proyecto || "NEM"}.docx`);
    console.log('Exportación completada exitosamente');
    
  } catch (error) {
    console.error('Error en exportación:', error);
    // Mostrar error al usuario
    alert(`Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    throw error;
  }
};