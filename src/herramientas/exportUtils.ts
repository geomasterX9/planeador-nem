import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, PageOrientation, VerticalAlign, BorderStyle, ImageRun, Footer } from "docx";
import { saveAs } from "file-saver";

// --- FUNCIONES "AYUDANTES" PREMIUM ---
const pBold = (text: string, size: number = 14, align: any = AlignmentType.LEFT, color: string = "000000") => 
    new Paragraph({ children: [new TextRun({ text, bold: true, size, color, font: "Calibri" })], alignment: align, spacing: { before: 20, after: 20 } });

const pReg = (text: string, size: number = 14, align: any = AlignmentType.LEFT, color: string = "000000") => 
    new Paragraph({ children: [new TextRun({ text, size, color, font: "Calibri" })], alignment: align, spacing: { before: 20, after: 20 } });

const processImage = (base64: string) => {
    const base64Data = base64.split(",")[1];
    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    let imgType = "png";
    if(base64.includes('image/jpeg') || base64.includes('image/jpg')) imgType = "jpg";
    else if(base64.includes('image/gif')) imgType = "gif";
    else if(base64.includes('image/bmp')) imgType = "bmp";
    return { data: bytes, type: imgType };
};

const determinarCampo = (disciplina: string) => {
    const d = disciplina || "";
    if (["Español", "Inglés", "Artes"].includes(d)) return "Lenguajes";
    if (["Matemáticas", "Biología", "Física", "Química"].includes(d)) return "Saberes y Pensamiento Científico";
    if (["Geografía", "Historia", "Formación Cívica y Ética"].includes(d)) return "Ética, Naturaleza y Sociedades";
    if (["Educación Física", "Tecnología", "Tutoría / Ed. Socioemocional"].includes(d)) return "De lo Humano y lo Comunitario";
    return "Lenguajes"; 
};

const getFasesOficiales = (campo: string) => {
    switch (campo) {
      case 'Lenguajes': return [ { id: 'f1', titulo: 'Planificación', desc: 'Identificación.' }, { id: 'f2', titulo: 'Comprensión y producción', desc: 'Acercamiento.' }, { id: 'f3', titulo: 'Reconocimiento', desc: 'Identificación de avances.' }, { id: 'f4', titulo: 'Integración', desc: 'Ajustes.' }, { id: 'f5', titulo: 'Difusión', desc: 'Presentación.' }, { id: 'f6', titulo: 'Consideración', desc: 'Evaluación.' } ];
      case 'Saberes y Pensamiento Científico': return [ { id: 'f1', titulo: 'Diseño de indagación', desc: 'El problema.' }, { id: 'f2', titulo: 'Busca y encuentra', desc: 'Investigación.' }, { id: 'f3', titulo: 'Encuentra y aprende', desc: 'Organización.' }, { id: 'f4', titulo: 'Construcción', desc: 'Soluciones.' }, { id: 'f5', titulo: 'Comunicación', desc: 'Socialización.' }, { id: 'f6', titulo: 'Autorreflexión', desc: 'Valoración.' } ];
      case 'Ética, Naturaleza y Sociedades': return [ { id: 'f1', titulo: 'Propuestas a seguir', desc: 'Problemática.' }, { id: 'f2', titulo: 'Organizamos los pasos', desc: 'Planificación.' }, { id: 'f3', titulo: 'Seguir el camino', desc: 'Investigación.' }, { id: 'f4', titulo: 'Registro de experiencia', desc: 'Sistematización.' }, { id: 'f5', titulo: 'Valorando mis pasos', desc: 'Evaluación.' } ];
      default: return [ { id: 'f1', titulo: 'Sensibilización', desc: 'Punto de partida.' }, { id: 'f2', titulo: 'Lo que necesito saber', desc: 'Saberes.' }, { id: 'f3', titulo: 'Organicemos', desc: 'Planificación.' }, { id: 'f4', titulo: 'Creatividad en marcha', desc: 'Práctica.' }, { id: 'f5', titulo: 'Compartimos y evaluamos', desc: 'Socialización.' } ];
    }
};

const getDefaultActivity = (idx: number, pdaText: string) => {
    if (idx === 0) return `• LECTURA DE LA REALIDAD:\nPresentar a todos los estudiantes la problemática vinculada a: "${pdaText}".\n\n• DIÁLOGO:\nLluvia de ideas o preguntas detonadoras.`;
    if (idx === 1) return `• ACUERDOS:\nOrganizar a todos los estudiantes en comunidades.\n\n• ACCIONES:\nDefinir qué información necesitamos investigar.`;
    if (idx === 2) return `• ACCIONES EN MARCHA:\nImplementar actividades prácticas. El docente funge como guía.`;
    if (idx === 3) return `• SISTEMATIZACIÓN:\nTodos organizan la información recabada y elaboran su primer borrador o prototipo.`;
    if (idx === 4) return `• SOCIALIZACIÓN:\nPresentación del producto final ante la asamblea.`;
    if (idx === 5) return `• EVALUACIONES:\nValoración cualitativa en asamblea. Promover la Autoevaluación y reflexión final.`;
    return "Actividades en desarrollo...";
};

const createCell = (content: Paragraph[], widthPct: number, bgColor?: string) => {
    return new TableCell({
        width: { size: widthPct, type: WidthType.PERCENTAGE },
        shading: bgColor ? { fill: bgColor } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 30, bottom: 30, left: 80, right: 80 }, 
        children: content
    });
};

export const exportToWord = async (projectData: any, plannedItems: any[], actividades: Record<string, string>, evaluationData: any) => {
    let recursosGlobales = "LTG, Libreta del alumno, Material de papelería, Dispositivo con internet.";
    try {
        const savedRecursos = sessionStorage.getItem('planeador_recursos');
        if (savedRecursos) {
            const parsed = JSON.parse(savedRecursos);
            recursosGlobales = Object.values(parsed).join(", ");
        }
    } catch(e) { console.error("Error leyendo recursos", e); }

    const disciplinaText = plannedItems.length > 0 ? plannedItems[0].disciplina : "General";
    const campoActual = determinarCampo(disciplinaText);
    
    const fases = projectData.estrategia === 'Secuencia Didáctica' 
        ? [ { id: 'f1', titulo: 'Inicio', desc: 'Activación.' }, { id: 'f2', titulo: 'Desarrollo', desc: 'Práctica.' }, { id: 'f3', titulo: 'Cierre', desc: 'Evaluación.' } ]
        : getFasesOficiales(campoActual);
        
    const textoTrimestre = projectData.trimestre ? ` - ${projectData.trimestre.toUpperCase()}` : "";
    const tituloPlaneacion = `PLANEACIÓN DIDÁCTICA${textoTrimestre}`;

    const colorHeaderBg = "1E3A8A"; 
    const colorHeaderTxt = "FFFFFF"; 
    const colorSubBg = "F1F5F9"; 

    const contenidosParrafos = plannedItems.filter(i => i.type === 'content').map(i => new Paragraph({ children: [ new TextRun({ text: `• ${i.text}`, size: 16, bold: true, font: "Calibri" }) ], spacing: { before: 40, after: 40 } }));
    const pdasParrafos = plannedItems.filter(i => i.type === 'pda').map(i => new Paragraph({ children: [ new TextRun({ text: `• ${i.text}`, size: 16, bold: true, font: "Calibri" }) ], spacing: { before: 40, after: 40 } }));
    const recursosParrafos = [pReg(recursosGlobales, 14)];

    let leftLogoCell = new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } }, children: [new Paragraph({ children: [] })] });
    if (projectData.logoIzquierdo) { try { const imgData = processImage(projectData.logoIzquierdo); leftLogoCell = new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } }, children: [new Paragraph({ children: [new ImageRun({ data: imgData.data, transformation: { width: 75, height: 75 }, type: imgData.type as any })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, }); } catch (e) {} }
    
    let rightLogoCell = new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } }, children: [new Paragraph({ children: [] })] });
    if (projectData.logoDerecho) { try { const imgData = processImage(projectData.logoDerecho); rightLogoCell = new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } }, children: [new Paragraph({ children: [new ImageRun({ data: imgData.data, transformation: { width: 75, height: 75 }, type: imgData.type as any })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, }); } catch (e) {} }

    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideVertical: { style: BorderStyle.NONE, size: 0 } },
        rows: [ new TableRow({ children: [ leftLogoCell, new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } }, children: [ pBold(projectData.estado ? `SECRETARÍA DE EDUCACIÓN DE GOBIERNO DEL ESTADO DE ${projectData.estado.toUpperCase()}` : "SECRETARÍA DE EDUCACIÓN", 18, AlignmentType.CENTER), pBold(projectData.modalidad ? `DIRECCIÓN DE EDUCACIÓN ${projectData.modalidad.toUpperCase()}` : "DEPARTAMENTO DE EDUCACIÓN", 16, AlignmentType.CENTER), pBold((projectData.escuela || "ESCUELA SECUNDARIA").toUpperCase(), 16, AlignmentType.CENTER), pBold(`CLAVE: ${projectData.cct || "_________"}   TURNO: ${projectData.turno || "_________"}`, 14, AlignmentType.CENTER), new Paragraph({ children: [new TextRun({ text: tituloPlaneacion, bold: true, size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 150 } }), ], verticalAlign: VerticalAlign.CENTER, }), rightLogoCell, ], }), ],
    });

    const metadataTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({ children: [ createCell([pBold("CAMPO FORMATIVO", 14, AlignmentType.CENTER)], 20, colorSubBg), createCell([pBold(campoActual, 14, AlignmentType.CENTER)], 30), createCell([pBold("METODOLOGÍA", 14, AlignmentType.CENTER)], 20, colorSubBg), createCell([pBold(projectData.estrategia || "Libre", 14, AlignmentType.CENTER)], 30) ]}),
            new TableRow({ children: [ createCell([pBold("DISCIPLINA Y DOCENTE", 14, AlignmentType.CENTER)], 20, colorSubBg), createCell([pBold(`${disciplinaText}: ${projectData.maestro || ""}`, 14, AlignmentType.CENTER)], 30), createCell([pBold("GRADO Y GRUPO", 14, AlignmentType.CENTER)], 20, colorSubBg), createCell([pBold(`${projectData.grado || ""}° "${projectData.grupo || ""}"`, 14, AlignmentType.CENTER)], 30) ]}),
            new TableRow({ children: [ createCell([pBold("PROYECTO", 14, AlignmentType.CENTER)], 20, colorSubBg), createCell([pBold(projectData.proyecto || "", 14, AlignmentType.CENTER)], 30), createCell([pBold("INICIO", 14, AlignmentType.CENTER)], 20, colorSubBg), createCell([pBold(projectData.fechaInicio || "", 14, AlignmentType.CENTER)], 30) ]}),
            new TableRow({ children: [ createCell([pBold("FASE", 14, AlignmentType.CENTER)], 20, colorSubBg), createCell([pBold("6", 14, AlignmentType.CENTER)], 30), createCell([pBold("TÉRMINO", 14, AlignmentType.CENTER)], 20, colorSubBg), createCell([pBold(projectData.fechaFin || "", 14, AlignmentType.CENTER)], 30) ]}),
        ]
    });

    const curriculaTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({ children: [ createCell([pBold("CONTENIDOS", 14, AlignmentType.CENTER, colorHeaderTxt)], 33, colorHeaderBg), createCell([pBold("PDA", 14, AlignmentType.CENTER, colorHeaderTxt)], 33, colorHeaderBg), createCell([pBold("RECURSOS", 14, AlignmentType.CENTER, colorHeaderTxt)], 34, colorHeaderBg) ] }),
            new TableRow({ children: [ createCell(contenidosParrafos, 33), createCell(pdasParrafos, 33), createCell(recursosParrafos, 34) ] })
        ]
    });

    const secuenciaRows: TableRow[] = [
        new TableRow({ children: [ createCell([pBold("FASES / MOMENTOS", 14, AlignmentType.CENTER, colorHeaderTxt)], 20, colorHeaderBg), createCell([pBold("DESARROLLO DE ACTIVIDADES", 14, AlignmentType.CENTER, colorHeaderTxt)], 80, colorHeaderBg) ] })
    ];

    fases.forEach((fase, index) => {
        const actText = actividades[fase.id] || getDefaultActivity(index, "el tema");
        const actParrafos = actText.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line, size: 14, bold: line.trim().startsWith('•'), font: "Calibri" })], spacing: { before: 20, after: 60 } }));
        secuenciaRows.push(new TableRow({ children: [ createCell([ pBold(fase.titulo, 14, AlignmentType.CENTER), pReg(fase.desc, 12, AlignmentType.CENTER, "666666") ], 20), createCell(actParrafos, 80) ] }));
    });
    const secuenciaTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: secuenciaRows });

    const firmasTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideHorizontal: { style: BorderStyle.NONE, size: 0 }, insideVertical: { style: BorderStyle.NONE, size: 0 } },
        rows: [ new TableRow({ children: [ createCell([ pBold("________________________________________________", 16, AlignmentType.CENTER), pBold("FIRMA DEL DOCENTE", 16, AlignmentType.CENTER), pReg(projectData.maestro || "Docente", 16, AlignmentType.CENTER) ], 50), createCell([ pBold("________________________________________________", 16, AlignmentType.CENTER), pBold("Vo. Bo. COORDINADOR ACADÉMICO", 16, AlignmentType.CENTER) ], 50) ] }) ]
    });

    // --- BUSCA ESTA PARTE AL FINAL DE TU ARCHIVO ---

    const doc = new Document({
        styles: { default: { document: { run: { font: "Calibri" } } } },
        sections: [{ 
            properties: { page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 700, right: 700, bottom: 700, left: 700 } } },
            footers: { default: new Footer({ children: [ new Paragraph({ children: [new TextRun({ text: "Documento generado con Planeador NEM Pro", size: 14, color: "888888", italics: true, font: "Calibri" })], alignment: AlignmentType.CENTER }) ] }) },
            children: [ 
                headerTable, 
                new Paragraph({ spacing: { before: 50, after: 50 } }), // Reducido de 150 a 50
                metadataTable, 
                new Paragraph({ spacing: { before: 80, after: 80 } }), // Reducido de 200 a 80
                curriculaTable, 
                new Paragraph({ spacing: { before: 80, after: 80 } }), // Reducido de 200 a 80
                secuenciaTable, 
                new Paragraph({ spacing: { before: 400 } }),          // Reducido de 800 a 400 para las firmas
                firmasTable 
            ]
        }]
    });

    Packer.toBlob(doc).then((blob) => { 
        saveAs(blob, `Planeacion_${projectData.proyecto?.replace(/\s+/g, '_') || 'NEM'}.docx`); 
    }).catch(err => {
        console.error("Error al generar el Word:", err);
    });
};