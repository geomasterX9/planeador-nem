import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, PageOrientation, VerticalAlign, BorderStyle, ImageRun, Footer } from "docx";
import { saveAs } from "file-saver";

// --- FUNCIONES "AYUDANTES" PREMIUM (AJUSTADAS PARA COMPACTACIÓN Y CALIBRI) ---
const pBold = (text: string, size: number = 14, align: any = AlignmentType.LEFT, color: string = "000000") => 
    new Paragraph({ children: [new TextRun({ text, bold: true, size, color, font: "Calibri" })], alignment: align, spacing: { before: 20, after: 20 } });

const pReg = (text: string, size: number = 14, align: any = AlignmentType.LEFT, color: string = "000000") => 
    new Paragraph({ children: [new TextRun({ text, size, color, font: "Calibri" })], alignment: align, spacing: { before: 20, after: 20 } });

// TU PROCESADOR DE IMÁGENES ORIGINAL (El que no falla)
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

// Creador de celdas hiper-compacto para ahorrar espacio en la hoja
const createCell = (content: Paragraph[], widthPct: number, bgColor?: string) => {
    return new TableCell({
        width: { size: widthPct, type: WidthType.PERCENTAGE },
        shading: bgColor ? { fill: bgColor } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 30, bottom: 30, left: 80, right: 80 }, 
        children: content
    });
};

// ... (mismas importaciones y funciones ayudantes pBold, pReg, processImage anteriores)

export const exportToWord = async (projectData: any, plannedItems: any[], actividades: Record<string, string>, evaluationData: any) => {
    // 1. Extraer Recursos Globales (puedes adaptarlo si los guardas en un campo específico del proyecto)
    let recursosGlobales = "LTG, Libreta del alumno, Material de papelería, Dispositivo con internet.";
    try {
        const savedRecursos = sessionStorage.getItem('planeador_recursos_global');
        if (savedRecursos) recursosGlobales = savedRecursos;
    } catch(e) {}

    const disciplinaText = plannedItems.length > 0 ? plannedItems[0].disciplina : "General";
    const campoActual = determinarCampo(disciplinaText);
    
    const fases = projectData.estrategia === 'Secuencia Didáctica' 
        ? [ { id: 'f1', titulo: 'Inicio', desc: 'Activación.' }, { id: 'f2', titulo: 'Desarrollo', desc: 'Práctica.' }, { id: 'f3', titulo: 'Cierre', desc: 'Evaluación.' } ]
        : getFasesOficiales(campoActual);
        
    // --- LÓGICA DEL TRIMESTRE DESDE CONFIGURACIÓN ---
    const textoTrimestre = projectData.trimestre ? ` - ${projectData.trimestre.toUpperCase()}` : "";
    const tituloPlaneacion = `PLANEACIÓN DIDÁCTICA${textoTrimestre}`;

    // COLORES
    const colorHeaderBg = "1E3A8A"; 
    const colorHeaderTxt = "FFFFFF"; 
    const colorSubBg = "F1F5F9"; 

    // Procesar Contenidos y PDAs
    const contenidosParrafos = plannedItems.filter(i => i.type === 'content').map(i => 
        new Paragraph({ children: [new TextRun({ text: `• ${i.text}`, size: 14, font: "Calibri" })], spacing: { after: 60 } })
    );
    const pdasParrafos = plannedItems.filter(i => i.type === 'pda').map(i => 
        new Paragraph({ children: [new TextRun({ text: `• ${i.text}`, size: 14, font: "Calibri" })], spacing: { after: 60 } })
    );
    const recursosParrafos = recursosGlobales.split('\n').map(line => 
        new Paragraph({ children: [new TextRun({ text: line, size: 14, font: "Calibri" })], spacing: { after: 40 } })
    );

    // --- TABLA 2: CONTENIDOS, PDAs Y RECURSOS (LA QUE PIDIÓ MODIFICAR) ---
    const curriculaTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({ 
                children: [ 
                    createCell([pBold("CONTENIDOS", 14, AlignmentType.CENTER, colorHeaderTxt)], 33, colorHeaderBg), 
                    createCell([pBold("PDA", 14, AlignmentType.CENTER, colorHeaderTxt)], 33, colorHeaderBg),
                    createCell([pBold("RECURSOS", 14, AlignmentType.CENTER, colorHeaderTxt)], 34, colorHeaderBg) 
                ] 
            }),
            new TableRow({ 
                children: [ 
                    createCell(contenidosParrafos, 33), 
                    createCell(pdasParrafos, 33),
                    createCell(recursosParrafos, 34) 
                ] 
            })
        ]
    });

    // --- TABLA 3: FASES Y ACTIVIDADES (ESPACIO INMENSO) ---
    const secuenciaRows: TableRow[] = [
        new TableRow({ 
            children: [ 
                createCell([pBold("FASES / MOMENTOS", 14, AlignmentType.CENTER, colorHeaderTxt)], 20, colorHeaderBg), 
                createCell([pBold("DESARROLLO DE ACTIVIDADES", 14, AlignmentType.CENTER, colorHeaderTxt)], 80, colorHeaderBg)
            ] 
        })
    ];

    fases.forEach((fase, index) => {
        let actText = (actividades && actividades[fase.id]) ? actividades[fase.id] : getDefaultActivity(index, "el tema");
        
        const actParrafos = actText.split('\n').map(line => {
            const isHeader = line.trim().startsWith('•');
            return new Paragraph({ 
                children: [new TextRun({ text: line, size: 14, bold: isHeader, font: "Calibri" })], 
                spacing: { before: 20, after: isHeader ? 20 : 80 } 
            });
        });

        secuenciaRows.push(new TableRow({
            children: [
                createCell([ pBold(fase.titulo, 14, AlignmentType.CENTER), pReg(fase.desc, 12, AlignmentType.CENTER, "666666") ], 20),
                createCell(actParrafos, 80)
            ]
        }));
    });

    const secuenciaTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: secuenciaRows });

    // ... (El resto del código de encabezados, metadata, evaluación y exportación se mantiene igual)
};

    // TABLA 4: FIRMAS FINALES
    const firmasTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideHorizontal: { style: BorderStyle.NONE, size: 0 }, insideVertical: { style: BorderStyle.NONE, size: 0 } },
        rows: [
            new TableRow({
                children: [
                    createCell([ pBold("________________________________________________", 16, AlignmentType.CENTER), pBold("FIRMA DEL DOCENTE", 16, AlignmentType.CENTER), pReg(projectData.maestro || "Nombre del Docente", 16, AlignmentType.CENTER) ], 50),
                    createCell([ pBold("________________________________________________", 16, AlignmentType.CENTER), pBold("Vo. Bo. COORDINADOR ACADÉMICO / DIRECCIÓN", 16, AlignmentType.CENTER) ], 50)
                ]
            })
        ]
    });

    const docChildren: any[] = [
        headerTable, new Paragraph({ children: [], spacing: { before: 150 } }),
        metadataTable, new Paragraph({ children: [], spacing: { before: 200 } }),
        curriculaTable, new Paragraph({ children: [], spacing: { before: 200 } }),
        secuenciaTable, new Paragraph({ children: [], spacing: { before: 800 } }),
        firmasTable
    ];

    // --- SECCIÓN DE EVALUACIÓN MANTENIDA INTACTA (CON CALIBRI) ---
    if (evaluationData && Array.isArray(evaluationData.herramientas)) {
        docChildren.push(new Paragraph({ children: [new TextRun({ text: "INSTRUMENTOS DE EVALUACIÓN FORMATIVA", bold: true, size: 24, color: colorHeaderBg, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { before: 800, after: 300 } }));

        if (evaluationData.herramientas.includes('Listas de cotejo') && (evaluationData.cotejo || []).length > 0) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "LISTA DE COTEJO", bold: true, size: 18, font: "Calibri" })], spacing: { before: 200, after: 100 } }));
            const cotejoRows = [
                new TableRow({
                    tableHeader: true,
                    children: [
                        createCell([pBold("No.", 14, AlignmentType.CENTER, colorHeaderTxt)], 10, colorHeaderBg),
                        createCell([pBold("INDICADORES / CRITERIOS OBSERVABLES", 14, AlignmentType.CENTER, colorHeaderTxt)], 50, colorHeaderBg),
                        createCell([pBold("SÍ / LO LOGRÓ", 14, AlignmentType.CENTER, colorHeaderTxt)], 20, colorHeaderBg),
                        createCell([pBold("NO / EN PROCESO", 14, AlignmentType.CENTER, colorHeaderTxt)], 20, colorHeaderBg)
                    ]
                })
            ];
            evaluationData.cotejo.forEach((criterio: string, i: number) => {
                cotejoRows.push(new TableRow({ children: [ createCell([pBold((i + 1).toString(), 14, AlignmentType.CENTER)], 10), createCell([pReg(criterio, 14, AlignmentType.LEFT)], 50), createCell([pReg(" ", 14)], 20), createCell([pReg(" ", 14)], 20) ] }));
            });
            docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: cotejoRows }));
        }

        if (evaluationData.herramientas.includes('Guías de observación') && (evaluationData.observacion || []).length > 0) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "GUÍA DE OBSERVACIÓN", bold: true, size: 18, font: "Calibri" })], spacing: { before: 400, after: 100 } }));
            const obsRows = [
                new TableRow({
                    tableHeader: true,
                    children: [
                        createCell([pBold("No.", 14, AlignmentType.CENTER, colorHeaderTxt)], 10, colorHeaderBg),
                        createCell([pBold("ASPECTOS A OBSERVAR", 14, AlignmentType.CENTER, colorHeaderTxt)], 50, colorHeaderBg),
                        createCell([pBold("REGISTRO / NOTAS", 14, AlignmentType.CENTER, colorHeaderTxt)], 40, colorHeaderBg)
                    ]
                })
            ];
            evaluationData.observacion.forEach((criterio: string, i: number) => {
                obsRows.push(new TableRow({ children: [ createCell([pBold((i + 1).toString(), 14, AlignmentType.CENTER)], 10), createCell([pReg(criterio, 14, AlignmentType.LEFT)], 50), createCell([new Paragraph({ children: [new TextRun({ text: " ", font: "Calibri" })], spacing: { before: 200, after: 200 } })], 40) ] }));
            });
            docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: obsRows }));
        }

        if (evaluationData.herramientas.includes('Escalas estimativas') && (evaluationData.escala || []).length > 0) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "ESCALA ESTIMATIVA", bold: true, size: 18, font: "Calibri" })], spacing: { before: 400, after: 100 } }));
            const escalaRows = [
                new TableRow({
                    tableHeader: true,
                    children: [
                        createCell([pBold("CRITERIO / RASGO", 14, AlignmentType.CENTER, colorHeaderTxt)], 40, colorHeaderBg),
                        createCell([pBold("SIEMPRE", 12, AlignmentType.CENTER, colorHeaderTxt)], 15, colorHeaderBg),
                        createCell([pBold("CASI SIEMPRE", 12, AlignmentType.CENTER, colorHeaderTxt)], 15, colorHeaderBg),
                        createCell([pBold("A VECES", 12, AlignmentType.CENTER, colorHeaderTxt)], 15, colorHeaderBg),
                        createCell([pBold("NUNCA", 12, AlignmentType.CENTER, colorHeaderTxt)], 15, colorHeaderBg)
                    ]
                })
            ];
            evaluationData.escala.forEach((criterio: string) => {
                escalaRows.push(new TableRow({ children: [ createCell([pReg(criterio, 14, AlignmentType.LEFT)], 40), createCell([pReg(" ")], 15), createCell([pReg(" ")], 15), createCell([pReg(" ")], 15), createCell([pReg(" ")], 15) ] }));
            });
            docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: escalaRows }));
        }

        if (evaluationData.herramientas.includes('Rúbricas') && (evaluationData.rubrica || []).length > 0) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "RÚBRICA DE EVALUACIÓN", bold: true, size: 18, font: "Calibri" })], spacing: { before: 400, after: 100 } }));
            const rubricaHeaders = evaluationData.rubricaHeaders || ["Sobresaliente", "Suficiente", "En Proceso", "Requiere Apoyo"];
            const rubricaRows = [
                new TableRow({
                    tableHeader: true,
                    children: [
                        createCell([pBold("CRITERIO A EVALUAR", 14, AlignmentType.CENTER, colorHeaderTxt)], 20, colorHeaderBg),
                        createCell([pBold(rubricaHeaders[0] || "", 14, AlignmentType.CENTER, colorHeaderTxt)], 20, colorHeaderBg),
                        createCell([pBold(rubricaHeaders[1] || "", 14, AlignmentType.CENTER, colorHeaderTxt)], 20, colorHeaderBg),
                        createCell([pBold(rubricaHeaders[2] || "", 14, AlignmentType.CENTER, colorHeaderTxt)], 20, colorHeaderBg),
                        createCell([pBold(rubricaHeaders[3] || "", 14, AlignmentType.CENTER, colorHeaderTxt)], 20, colorHeaderBg),
                    ]
                })
            ];
            evaluationData.rubrica.forEach((row: any) => {
                rubricaRows.push(new TableRow({ children: [ createCell([pBold(row.criterio || "", 14, AlignmentType.LEFT)], 20), createCell([pReg(row.nivel4 || " ", 14, AlignmentType.LEFT)], 20), createCell([pReg(row.nivel3 || " ", 14, AlignmentType.LEFT)], 20), createCell([pReg(row.nivel2 || " ", 14, AlignmentType.LEFT)], 20), createCell([pReg(row.nivel1 || " ", 14, AlignmentType.LEFT)], 20) ] }));
            });
            docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rubricaRows }));
        }

        if (evaluationData.herramientas.includes('Cuestionarios') && evaluationData.cuestionario) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "CUESTIONARIO", bold: true, size: 18, font: "Calibri" })], spacing: { before: 400, after: 100 } }));
            evaluationData.cuestionario.split('\n').forEach((line: string) => {
                if(line.trim() !== '') docChildren.push(new Paragraph({ children: [new TextRun({ text: line, size: 16, font: "Calibri" })], spacing: { after: 100 } }));
            });
        }

        if (evaluationData.herramientas.includes('Exámenes escritos') && evaluationData.examen) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "EXAMEN ESCRITO", bold: true, size: 18, font: "Calibri" })], spacing: { before: 400, after: 100 } }));
            evaluationData.examen.split('\n').forEach((line: string) => {
                if(line.trim() !== '') docChildren.push(new Paragraph({ children: [new TextRun({ text: line, size: 16, font: "Calibri" })], spacing: { after: 100 } }));
            });
        }

        if (evaluationData.retroalimentacion) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "RETROALIMENTACIÓN FORMATIVA Y EL PAPEL DEL ERROR", bold: true, size: 18, font: "Calibri" })], spacing: { before: 400, after: 100 } }));
            docChildren.push(new Paragraph({ children: [new TextRun({ text: evaluationData.retroalimentacion, size: 16, font: "Calibri" })] }));
        }
    }

    const doc = new Document({
        styles: { default: { document: { run: { font: "Calibri" } } } },
        sections: [{ 
            properties: { 
                page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 700, right: 700, bottom: 700, left: 700 } } 
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "Documento generado con Planeador NEM Pro - Plataforma de Innovación Docente", size: 14, color: "888888", italics: true, font: "Calibri" })],
                            alignment: AlignmentType.CENTER,
                        })
                    ]
                })
            },
            children: docChildren 
        }]
    });

    Packer.toBlob(doc)
        .then((blob) => { 
            saveAs(blob, projectData.proyecto ? `Planeacion_${projectData.proyecto.replace(/\s+/g, '_')}.docx` : "Planeacion_NEM.docx"); 
        })
        .catch(err => {
            console.error("⛔ Error al empaquetar el Word:", err);
            alert("Hubo un error al generar el Word. Revisa la consola para más detalles.");
        });
};