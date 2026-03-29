import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, PageOrientation, VerticalAlign, BorderStyle, ImageRun, Footer, TableLayoutType } from "docx";

// --- FUNCIONES "AYUDANTES" PREMIUM ---
const pBold = (text: string, size: number = 16, align: any = AlignmentType.LEFT, color: string = "000000") => 
    new Paragraph({ children: [new TextRun({ text, bold: true, size, color })], alignment: align, spacing: { before: 60, after: 60 } });

const pReg = (text: string, size: number = 16, align: any = AlignmentType.LEFT, color: string = "000000") => 
    new Paragraph({ children: [new TextRun({ text, size, color })], alignment: align, spacing: { before: 60, after: 60 } });

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
    if (idx === 0) return `🔸 LECTURA DE LA REALIDAD 🔸\n--------------------------------------------------\nPresentar a todos los estudiantes la problemática vinculada a: "${pdaText}".\n\n🔸 DIÁLOGO 🔸\n--------------------------------------------------\nLluvia de ideas o preguntas detonadoras.`;
    if (idx === 1) return `🔸 ACUERDOS 🔸\n--------------------------------------------------\nOrganizar a todos los estudiantes en comunidades.\n\n🔸 ACCIONES 🔸\n--------------------------------------------------\nDefinir qué información necesitamos investigar.`;
    if (idx === 2) return `🔸 ACCIONES EN MARCHA 🔸\n--------------------------------------------------\nImplementar actividades prácticas. El docente funge como guía.`;
    if (idx === 3) return `🔸 SISTEMATIZACIÓN 🔸\n--------------------------------------------------\nTodos organizan la información recabada y elaboran su primer borrador o prototipo.`;
    if (idx === 4) return `🔸 SOCIALIZACIÓN 🔸\n--------------------------------------------------\nPresentación del producto final ante la asamblea.`;
    if (idx === 5) return `🔸 EVALUACIONES 🔸\n--------------------------------------------------\nValoración cualitativa en asamblea. Promover la Autoevaluación y reflexión final.`;
    return "Actividades en desarrollo...";
};

// --- FUNCIÓN PRINCIPAL DE EXPORTACIÓN ---
export const exportToWord = async (projectData: any, plannedItems: any[], actividades: Record<string, string>, evaluationData: any) => {
    let recursos: Record<string, string> = {};
    try {
        const savedRecursos = sessionStorage.getItem('planeador_recursos');
        if (savedRecursos) recursos = JSON.parse(savedRecursos);
    } catch(e) { console.error("Error leyendo recursos", e); }

    const disciplinaText = plannedItems.length > 0 ? plannedItems[0].disciplina : "General";
    const campoActual = determinarCampo(disciplinaText);
    
    const fases = projectData.estrategia === 'Secuencia Didáctica' 
        ? [ { id: 'f1', titulo: 'Inicio', desc: 'Activación.' }, { id: 'f2', titulo: 'Desarrollo', desc: 'Práctica.' }, { id: 'f3', titulo: 'Cierre', desc: 'Evaluación.' } ]
        : getFasesOficiales(campoActual);
        
    const sesionesTotales = Number(projectData.sesiones) || 0;
    const textoEstado = projectData.estado ? `SECRETARÍA DE EDUCACIÓN DE GOBIERNO DEL ESTADO DE ${projectData.estado.toUpperCase()}` : "SECRETARÍA DE EDUCACIÓN DE GOBIERNO DEL ESTADO";
    const textoModalidad = projectData.modalidad ? `DIRECCIÓN DE EDUCACIÓN ${projectData.modalidad.toUpperCase()}` : "DEPARTAMENTO DE EDUCACIÓN SECUNDARIA TÉCNICA";

    // PALETA DE COLORES PREMIUM
    const colorHeaderBg = "1E3A8A"; 
    const colorHeaderTxt = "FFFFFF"; 
    const colorSubBg = "F1F5F9"; 
    const colorContentTag = "DBEAFE";
    const colorPdaTag = "FFEDD5";

    const contenidosParrafos = plannedItems.filter(i => i.type === 'content').length > 0 ? plannedItems.filter(i => i.type === 'content').map(i => new Paragraph({ children: [ new TextRun({ text: `  ${(i.disciplina || 'GENERAL').toUpperCase()}  `, bold: true, color: "1D4ED8", shading: { fill: colorContentTag }, size: 14 }), new TextRun({ text: `   ${i.text}`, size: 18, bold: true }) ], bullet: { level: 0 }, spacing: { after: 60 } })) : [new Paragraph({ children: [new TextRun({ text: "Sin contenidos", size: 18, bold: true })] })];
    const pdasParrafos = plannedItems.filter(i => i.type === 'pda').length > 0 ? plannedItems.filter(i => i.type === 'pda').map(i => new Paragraph({ children: [ new TextRun({ text: `  ${(i.disciplina || 'GENERAL').toUpperCase()}  `, bold: true, color: "C2410C", shading: { fill: colorPdaTag }, size: 14 }), new TextRun({ text: `   ${i.text}`, size: 18, bold: true }) ], bullet: { level: 0 }, spacing: { after: 60 } })) : [new Paragraph({ children: [new TextRun({ text: "Sin PDAs", size: 18, bold: true })] })];
    
    const ejesSeguros = Array.isArray(projectData.ejes) ? projectData.ejes : [];
    const ejesTexto = ejesSeguros.length > 0 ? ejesSeguros.join(", ") : "Ninguno";
    const ejesParrafos = [pReg(ejesTexto, 16)];
    
    const estEvalSeguras = Array.isArray(projectData.estrategiaEvaluacion) ? projectData.estrategiaEvaluacion : [];
    const herramSeguras = Array.isArray(projectData.herramientas) ? projectData.herramientas : [];
    const gruposSeguros = Array.isArray(projectData.grupo) ? projectData.grupo.join(", ") : (projectData.grupo || "");

    const evalParrafos = [
        new Paragraph({ children: [new TextRun({ text: "Estrategias: ", bold: true, size: 16 }), new TextRun({ text: estEvalSeguras.join(", ") || "Ninguna", size: 16 })] }),
        new Paragraph({ children: [new TextRun({ text: "Instrumentos: ", bold: true, size: 16 }), new TextRun({ text: herramSeguras.join(", ") || "Ninguno", size: 16 })] })
    ];

    let leftLogoCell = new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] });
    if (projectData.logoIzquierdo) { try { const imgData = processImage(projectData.logoIzquierdo); leftLogoCell = new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new ImageRun({ data: imgData.data, transformation: { width: 75, height: 75 }, type: imgData.type as any })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, }); } catch (e) {} }
    
    let rightLogoCell = new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] });
    if (projectData.logoDerecho) { try { const imgData = processImage(projectData.logoDerecho); rightLogoCell = new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new ImageRun({ data: imgData.data, transformation: { width: 75, height: 75 }, type: imgData.type as any })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, }); } catch (e) {} }

    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        columnWidths: [2888, 8664, 2888], 
        borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideVertical: { style: BorderStyle.NONE, size: 0 } },
        rows: [ 
            new TableRow({ 
                children: [ 
                    leftLogoCell, 
                    new TableCell({ 
                        width: { size: 60, type: WidthType.PERCENTAGE }, 
                        children: [ 
                            pBold(textoEstado, 22, AlignmentType.CENTER), 
                            pBold(textoModalidad, 18, AlignmentType.CENTER), 
                            pBold((projectData.escuela || "ESCUELA SECUNDARIA").toUpperCase(), 18, AlignmentType.CENTER), 
                            pBold(`CLAVE: ${projectData.cct || "_________"}   TURNO: ${projectData.turno || "_________"}`, 16, AlignmentType.CENTER), 
                            new Paragraph({ children: [new TextRun({ text: `PLANEACIÓN DIDÁCTICA - ${projectData.trimestre || ""}`.toUpperCase(), bold: true, size: 20 })], alignment: AlignmentType.CENTER, spacing: { before: 150 } }),
                            new Paragraph({ children: [new TextRun({ text: `PERIODO DE APLICACIÓN: DEL ${projectData.fechaInicio || "___"} AL ${projectData.fechaFin || "___"}`, bold: true, size: 14, color: "333333" })], alignment: AlignmentType.CENTER, spacing: { before: 40 } }) 
                        ], 
                        verticalAlign: VerticalAlign.CENTER, 
                    }), 
                    rightLogoCell, 
                ], 
            }), 
        ],
    });

    const metadataTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        columnWidths: [2888, 4332, 2888, 4332], 
        rows: [
            new TableRow({ children: [ new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pBold("CAMPO FORMATIVO", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg } }), new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [pBold(campoActual, 16, AlignmentType.CENTER)] }), new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pBold("METODOLOGÍA", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg } }), new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [pBold(projectData.estrategia || "Libre", 16, AlignmentType.CENTER)] }) ]}),
            new TableRow({ children: [ new TableCell({ children: [pBold("DISCIPLINA Y DOCENTE", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg } }), new TableCell({ children: [pBold(`${disciplinaText}: ${projectData.maestro || ""}`, 16, AlignmentType.CENTER)] }), new TableCell({ children: [pBold("GRADO Y GRUPO", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg } }), new TableCell({ children: [pBold(`${projectData.grado || ""}° "${gruposSeguros}"`, 16, AlignmentType.CENTER)] }) ]}),
            new TableRow({ children: [ new TableCell({ children: [pBold("PROYECTO", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg } }), new TableCell({ children: [pBold(projectData.proyecto || "", 16, AlignmentType.CENTER)] }), new TableCell({ children: [pBold("INICIO", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg } }), new TableCell({ children: [pBold(projectData.fechaInicio || "", 14, AlignmentType.CENTER)] }) ]}),
            new TableRow({ children: [ new TableCell({ children: [pBold("FASE", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg } }), new TableCell({ children: [pBold("6", 16, AlignmentType.CENTER)] }), new TableCell({ children: [pBold("TÉRMINO", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg } }), new TableCell({ children: [pBold(projectData.fechaFin || "", 14, AlignmentType.CENTER)] }) ]}),
            new TableRow({ children: [ new TableCell({ children: [pBold("EJES ARTICULADORES", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg } }), new TableCell({ children: ejesParrafos }), new TableCell({ children: [pBold("EVIDENCIAS / PRODUCTO", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg } }), new TableCell({ children: [pReg(" ", 16, AlignmentType.CENTER)] }) ]}),
            new TableRow({ children: [ new TableCell({ children: [pBold("TOTAL SESIONES", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg } }), new TableCell({ children: [pBold(sesionesTotales > 0 ? sesionesTotales.toString() : "___", 16, AlignmentType.CENTER)] }), new TableCell({ children: [pBold("EVALUACIÓN FORMATIVA", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg } }), new TableCell({ children: evalParrafos }) ]}),
            new TableRow({ children: [ new TableCell({ children: [pBold("CONTEXTO SOCIOEDUCATIVO", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg }, verticalAlign: VerticalAlign.CENTER }), new TableCell({ children: [pReg(projectData.contexto || "Sin contexto definido.", 16, AlignmentType.JUSTIFIED)], columnSpan: 3 }) ]}),
            new TableRow({ children: [ new TableCell({ children: [pBold("CONTENIDOS", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg }, verticalAlign: VerticalAlign.CENTER }), new TableCell({ children: contenidosParrafos, columnSpan: 3 }) ]}),
            new TableRow({ children: [ new TableCell({ children: [pBold("PDAs", 16, AlignmentType.CENTER)], shading: { fill: colorSubBg }, verticalAlign: VerticalAlign.CENTER }), new TableCell({ children: pdasParrafos, columnSpan: 3 }) ]})
        ]
    });

    const mainTableRows: TableRow[] = [];
    mainTableRows.push(new TableRow({
        tableHeader: true,
        children: [
            new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [pBold("FASES Y MOMENTOS", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
            new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, children: [pBold("ACTIVIDADES DE LA SECUENCIA DIDÁCTICA", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
            new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [pBold("RECURSOS", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } })
        ]
    }));

    fases.forEach((fase, index) => {
        const rowChildren: TableCell[] = [];
        rowChildren.push(new TableCell({ 
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [ pBold(fase.titulo.toUpperCase(), 16, AlignmentType.CENTER), new Paragraph({ children: [new TextRun({ text: fase.desc, size: 14, color: "666666" })], alignment: AlignmentType.CENTER }) ],
            verticalAlign: VerticalAlign.CENTER
        }));
        
        let actText = (actividades && actividades[fase.id]) ? actividades[fase.id] : "";
        if (!actText || actText.trim() === "" || actText === "Sin redactar...") {
            const pdaDestacado = plannedItems.find(item => item.type === 'pda')?.text || "el tema central definido";
            actText = getDefaultActivity(index, pdaDestacado);
        }

        const actParrafos: Paragraph[] = [];
        actText.split('\n').forEach(line => {
            const text = line.trim();
            if (!text) { actParrafos.push(new Paragraph({ text: "", spacing: { after: 60 } })); return; }
            const isHeader = text.startsWith('•') || text.startsWith('🔸');
            const isSeparator = text.startsWith('---');

            if (isSeparator) { actParrafos.push(new Paragraph({ children: [new TextRun({ text: text, size: 12, color: "94A3B8" })], alignment: AlignmentType.CENTER, spacing: { after: 60 } })); } 
            else { actParrafos.push(new Paragraph({ children: [new TextRun({ text: text, size: 16, bold: isHeader, color: (isHeader && text.includes('🔸')) ? "C2410C" : "000000" })], alignment: isHeader ? AlignmentType.CENTER : AlignmentType.JUSTIFIED, spacing: { after: isHeader ? 20 : 80 } })); }
        });
        rowChildren.push(new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, children: actParrafos, verticalAlign: VerticalAlign.CENTER }));

        let recText = (recursos && recursos[fase.id]) ? recursos[fase.id] : "LTG, Libreta, Material de papelería.";
        const recParrafos: Paragraph[] = [];
        recText.split('\n').forEach(line => { const text = line.trim(); if (text) recParrafos.push(new Paragraph({ children: [new TextRun({ text: text, size: 14 })], alignment: AlignmentType.CENTER, spacing: { after: 40 } })); });
        rowChildren.push(new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: recParrafos, verticalAlign: VerticalAlign.CENTER }));
        mainTableRows.push(new TableRow({ children: rowChildren }));
    });

    const docChildren: any[] = [
        headerTable, new Paragraph({ children: [], spacing: { before: 150 } }),
        metadataTable, new Paragraph({ children: [], spacing: { before: 200 } }),
        new Table({ 
            width: { size: 100, type: WidthType.PERCENTAGE }, 
            layout: TableLayoutType.FIXED, 
            columnWidths: [1444, 11552, 1444], 
            rows: mainTableRows 
        })
    ];

    if (evaluationData && Array.isArray(evaluationData.herramientas)) {
        docChildren.push(new Paragraph({ children: [new TextRun({ text: "INSTRUMENTOS DE EVALUACIÓN FORMATIVA", bold: true, size: 24, color: colorHeaderBg })], alignment: AlignmentType.CENTER, spacing: { before: 800, after: 300 } }));

        if (evaluationData.herramientas.includes('Listas de cotejo') && (evaluationData.cotejo || []).length > 0) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "LISTA DE COTEJO", bold: true, size: 18 })], spacing: { before: 200, after: 100 } }));
            const cotejoRows = [
                new TableRow({
                    tableHeader: true,
                    children: [
                        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [pBold("No.", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [pBold("INDICADORES / CRITERIOS OBSERVABLES", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pBold("SÍ / LO LOGRÓ", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pBold("NO / EN PROCESO", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } })
                    ]
                })
            ];
            evaluationData.cotejo.forEach((criterio: string, i: number) => {
                cotejoRows.push(new TableRow({ children: [ new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [pBold((i + 1).toString(), 16, AlignmentType.CENTER)] }), new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [pReg(criterio, 16, AlignmentType.LEFT)] }), new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pReg(" ", 16)] }), new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pReg(" ", 16)] }) ] }));
            });
            docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, columnWidths: [1444, 7220, 2888, 2888], rows: cotejoRows }));
        }

        if (evaluationData.herramientas.includes('Guías de observación') && (evaluationData.observacion || []).length > 0) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "GUÍA DE OBSERVACIÓN", bold: true, size: 18 })], spacing: { before: 400, after: 100 } }));
            const obsRows = [
                new TableRow({
                    tableHeader: true,
                    children: [
                        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [pBold("No.", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [pBold("ASPECTOS A OBSERVAR", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [pBold("REGISTRO / NOTAS", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } })
                    ]
                })
            ];
            evaluationData.observacion.forEach((criterio: string, i: number) => {
                obsRows.push(new TableRow({ children: [ new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [pBold((i + 1).toString(), 16, AlignmentType.CENTER)] }), new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [pReg(criterio, 16, AlignmentType.LEFT)] }), new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: " " })], spacing: { before: 200, after: 200 } })] }) ] }));
            });
            docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, columnWidths: [1444, 7220, 5776], rows: obsRows }));
        }

        if (evaluationData.herramientas.includes('Escalas estimativas') && (evaluationData.escala || []).length > 0) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "ESCALA ESTIMATIVA", bold: true, size: 18 })], spacing: { before: 400, after: 100 } }));
            const escalaRows = [
                new TableRow({
                    tableHeader: true,
                    children: [
                        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [pBold("CRITERIO / RASGO", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                        new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [pBold("SIEMPRE", 12, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                        new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [pBold("CASI SIEMPRE", 12, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                        new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [pBold("A VECES", 12, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                        new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [pBold("NUNCA", 12, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } })
                    ]
                })
            ];
            evaluationData.escala.forEach((criterio: string) => {
                escalaRows.push(new TableRow({ children: [ new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [pReg(criterio, 16, AlignmentType.LEFT)] }), new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [pReg(" ")] }), new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [pReg(" ")] }), new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [pReg(" ")] }), new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [pReg(" ")] }) ] }));
            });
            docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, columnWidths: [5776, 2166, 2166, 2166, 2166], rows: escalaRows }));
        }

        if (evaluationData.herramientas.includes('Rúbricas') && (evaluationData.rubrica || []).length > 0) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "RÚBRICA DE EVALUACIÓN", bold: true, size: 18 })], spacing: { before: 400, after: 100 } }));
            const rubricaHeaders = evaluationData.rubricaHeaders || ["Sobresaliente", "Suficiente", "En Proceso", "Requiere Apoyo"];
            const rubricaRows = [
                new TableRow({
                    tableHeader: true,
                    children: [
                        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pBold("CRITERIO A EVALUAR", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pBold(rubricaHeaders[0] || "", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pBold(rubricaHeaders[1] || "", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pBold(rubricaHeaders[2] || "", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pBold(rubricaHeaders[3] || "", 14, AlignmentType.CENTER, colorHeaderTxt)], shading: { fill: colorHeaderBg } }),
                    ]
                })
            ];
            evaluationData.rubrica.forEach((row: any) => {
                rubricaRows.push(new TableRow({ children: [ 
                    new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pBold(row.criterio || "", 14, AlignmentType.LEFT)] }), 
                    new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pReg(row.nivel4 || " ", 14, AlignmentType.LEFT)] }), 
                    new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pReg(row.nivel3 || " ", 14, AlignmentType.LEFT)] }), 
                    new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pReg(row.nivel2 || " ", 14, AlignmentType.LEFT)] }), 
                    new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [pReg(row.nivel1 || " ", 14, AlignmentType.LEFT)] }) 
                ] }));
            });
            docChildren.push(new Table({ 
                width: { size: 100, type: WidthType.PERCENTAGE }, 
                layout: TableLayoutType.FIXED, 
                columnWidths: [2888, 2888, 2888, 2888, 2888],
                rows: rubricaRows 
            }));
        }

        if (evaluationData.herramientas.includes('Cuestionarios') && evaluationData.cuestionario) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "CUESTIONARIO", bold: true, size: 18 })], spacing: { before: 400, after: 100 } }));
            evaluationData.cuestionario.split('\n').forEach((line: string) => {
                if(line.trim() !== '') docChildren.push(new Paragraph({ children: [new TextRun({ text: line, size: 16 })], spacing: { after: 100 } }));
            });
        }

        if (evaluationData.herramientas.includes('Exámenes escritos') && evaluationData.examen) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "EXAMEN ESCRITO", bold: true, size: 18 })], spacing: { before: 400, after: 100 } }));
            evaluationData.examen.split('\n').forEach((line: string) => {
                if(line.trim() !== '') docChildren.push(new Paragraph({ children: [new TextRun({ text: line, size: 16 })], spacing: { after: 100 } }));
            });
        }

        if (evaluationData.retroalimentacion) {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: "RETROALIMENTACIÓN FORMATIVA Y EL PAPEL DEL ERROR", bold: true, size: 18 })], spacing: { before: 400, after: 100 } }));
            docChildren.push(new Paragraph({ children: [new TextRun({ text: evaluationData.retroalimentacion, size: 16 })] }));
        }
    }

    const firmasTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        columnWidths: [7220, 7220],
        borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideVertical: { style: BorderStyle.NONE, size: 0 } },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                            new Paragraph({ children: [new TextRun({ text: "________________________________________________", size: 16 })], alignment: AlignmentType.CENTER, spacing: { before: 800, after: 100 } }),
                            pBold("FIRMA DEL DOCENTE", 14, AlignmentType.CENTER),
                            pReg((projectData.maestro || "").toUpperCase(), 14, AlignmentType.CENTER)
                        ]
                    }),
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                            new Paragraph({ children: [new TextRun({ text: "________________________________________________", size: 16 })], alignment: AlignmentType.CENTER, spacing: { before: 800, after: 100 } }),
                            pBold("Vo. Bo. COORDINADOR ACADÉMICO", 14, AlignmentType.CENTER)
                        ]
                    })
                ]
            })
        ]
    });

    docChildren.push(firmasTable);

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
                            children: [new TextRun({ text: "Documento generado con Planeador NEM Pro - Plataforma de Innovación Docente", size: 14, color: "888888", italics: true })],
                            alignment: AlignmentType.CENTER,
                        })
                    ]
                })
            },
            children: docChildren 
        }]
    });

    return await Packer.toBlob(doc);
};