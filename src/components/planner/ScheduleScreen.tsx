import React, { useState, useEffect } from 'react';
import { Save, Plus, ArrowLeft, Info, Eraser, CalendarDays, Check, X, Trash2, Printer } from 'lucide-react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const MODULES = [1, 2, 3, 4, 5, 6, 7];
const TAILWIND_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500'];

const DISCIPLINAS_POR_GRADO = {
  '1º': [
    "Español", "Inglés", "Artes", "Matemáticas", "Biología", 
    "Geografía", "Historia", "Formación Cívica", "Tecnología", 
    "Educación Física", "Tutoría"
  ],
  '2º': [
    "Español", "Inglés", "Artes", "Matemáticas", "Física", 
    "Historia", "Formación Cívica", "Tecnología", 
    "Educación Física", "Tutoría"
  ],
  '3º': [
    "Español", "Inglés", "Artes", "Matemáticas", "Química", 
    "Historia", "Formación Cívica", "Tecnología", 
    "Educación Física", "Tutoría"
  ]
};

type GradoType = keyof typeof DISCIPLINAS_POR_GRADO;

interface Group {
  id: string;
  name: string;
  discipline: string; 
  color: string;
}

interface ScheduleScreenProps {
  onBack: () => void;
}

export default function ScheduleScreen({ onBack }: ScheduleScreenProps) {
  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('nem_groups');
    if (saved) return JSON.parse(saved);
    return []; 
  });

  const [schedule, setSchedule] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('nem_schedule');
    if (saved) return JSON.parse(saved);
    return {}; 
  });

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);
  
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGrade, setNewGrade] = useState<GradoType>('1º');
  const [newLetter, setNewLetter] = useState('A');
  const [newDiscipline, setNewDiscipline] = useState('');

  useEffect(() => {
    localStorage.setItem('nem_groups', JSON.stringify(groups));
    localStorage.setItem('nem_schedule', JSON.stringify(schedule));
    
    setShowSavedToast(true);
    const timer = setTimeout(() => setShowSavedToast(false), 2000);
    return () => clearTimeout(timer);
  }, [groups, schedule]);

  const handleCellClick = (day: string, mod: number) => {
    const key = `${day}-${mod}`;
    setSchedule(prev => {
      const newSchedule = { ...prev };
      
      if (activeGroupId === null) {
        delete newSchedule[key]; 
      } else if (newSchedule[key] === activeGroupId) {
        delete newSchedule[key]; 
      } else {
        newSchedule[key] = activeGroupId; 
      }
      
      return newSchedule;
    });
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewGrade(e.target.value as GradoType);
    setNewDiscipline(''); 
  };

  const confirmAddGroup = () => {
    const groupName = `${newGrade} ${newLetter}`;
    const disc = newDiscipline.trim();
    
    if (groups.some(g => g.name === groupName && g.discipline === disc)) {
      alert(`El grupo ${groupName} con la disciplina ${disc} ya existe.`);
      return;
    }

    const newColor = TAILWIND_COLORS[groups.length % TAILWIND_COLORS.length];
    const newGroup = { id: Date.now().toString(), name: groupName, discipline: disc, color: newColor };
    
    const sortedGroups = [...groups, newGroup].sort((a, b) => a.name.localeCompare(b.name));
    
    setGroups(sortedGroups);
    setActiveGroupId(newGroup.id);
    
    const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const indiceActual = letras.indexOf(newLetter);
    if (indiceActual < letras.length - 1) {
      setNewLetter(letras[indiceActual + 1]);
    }
  };

  const handleDeleteGroup = (groupId: string, groupName: string, disc: string) => {
    if (window.confirm(`¿Eliminar el grupo ${groupName} ${disc}? Se borrarán también sus horas asignadas.`)) {
      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (activeGroupId === groupId) setActiveGroupId(null);

      setSchedule(prev => {
        const newSchedule = { ...prev };
        Object.keys(newSchedule).forEach(key => {
          if (newSchedule[key] === groupId) delete newSchedule[key];
        });
        return newSchedule;
      });
    }
  };

  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de borrar todo el horario y eliminar los grupos creados? Esta acción no se puede deshacer.')) {
      setSchedule({}); 
      setGroups([]);   
      setActiveGroupId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans animate-fade-in print:bg-white">
      
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between shadow-md shrink-0 sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors" title="Volver">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <CalendarDays size={20} className="text-indigo-400" />
              Mi Carga Horaria
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">Configura tus módulos para la generación precisa de sesiones.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold text-emerald-400 transition-opacity duration-300 ${showSavedToast ? 'opacity-100' : 'opacity-0'}`}>✓ Guardado</span>
          
          <button 
            onClick={() => window.print()}
            className="hidden sm:flex bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-bold items-center gap-2 transition-colors border border-slate-700"
            title="Exportar horario a PDF"
          >
            <Printer size={16} /> PDF
          </button>

          <button 
            onClick={() => {
              localStorage.setItem('nem_schedule_setup_complete', 'true');
              onBack();
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/30"
          >
            <Save size={16} /> <span className="hidden sm:inline">Guardar y Salir</span>
          </button>
        </div>
      </header>

      <div className="hidden print:block text-center mb-6 mt-4">
        <h1 className="text-3xl font-black text-slate-900">Mi Carga Horaria</h1>
        <p className="text-sm font-bold text-slate-500 mt-1">Generado con Planeador NEM Pro</p>
      </div>

      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full print:p-0 print:m-0 print:max-w-full">
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 mb-6 sticky top-[72px] z-10 print:hidden">
          <div className="flex items-start gap-3 mb-4">
            <Info size={20} className="text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600 font-medium flex-1">
              <strong className="text-slate-800">Tips:</strong> Si quieres borrar alguna hora y grupo de tu horario sólo toca el icono de basura. Para agregar varios grupos seguidos (A, B, C...), presiona la palomita (✓) varias veces y la letra avanzará sola.
            </p>
            
            <button
              onClick={() => window.print()}
              className="flex sm:hidden px-3 py-2 rounded-xl font-bold text-xs items-center gap-1 text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors shrink-0"
            >
              <Printer size={16} /> PDF
            </button>

            <button
              onClick={handleClearAll}
              className="hidden sm:flex px-3 py-2 rounded-xl font-bold text-xs items-center gap-1.5 text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors shrink-0"
            >
              <Trash2 size={16} /> Borrar Todo
            </button>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            {groups.map(g => (
              <div 
                key={g.id} 
                className={`flex items-stretch h-[52px] rounded-xl overflow-hidden shadow-sm transition-all ${activeGroupId === g.id ? 'ring-4 ring-indigo-200 scale-105 shadow-md' : 'hover:opacity-90 opacity-90'} ${g.color} text-white`}
              >
                <button
                  onClick={() => setActiveGroupId(g.id)}
                  className="px-3 font-bold text-sm flex flex-col items-start justify-center h-full min-w-[4.5rem]"
                >
                  <span className="leading-tight">{g.name}</span>
                  {g.discipline && <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded leading-none mt-0.5 font-semibold">{g.discipline}</span>}
                </button>
                <button
                  onClick={() => handleDeleteGroup(g.id, g.name, g.discipline)}
                  className="px-2 border-l border-white/20 hover:bg-black/20 transition-colors flex items-center justify-center h-full"
                  title="Eliminar grupo"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            <button
              onClick={() => setActiveGroupId(null)}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border ${activeGroupId === null ? 'bg-slate-800 text-white border-slate-800 ring-4 ring-slate-200 scale-105 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
            >
              <Eraser size={16} /> Borrador
            </button>

            <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>

            {isAddingGroup ? (
              <div className="flex flex-wrap items-center gap-1.5 ml-auto sm:ml-0 bg-indigo-50 p-1.5 rounded-xl border border-indigo-100 animate-fade-in shadow-inner">
                <select 
                  value={newGrade} 
                  onChange={handleGradeChange}
                  className="px-2 py-1.5 text-xs font-bold text-indigo-900 rounded-lg border-none focus:ring-2 focus:ring-indigo-400 outline-none bg-white shadow-sm cursor-pointer"
                >
                  <option value="1º">1º</option>
                  <option value="2º">2º</option>
                  <option value="3º">3º</option>
                </select>
                
                <select 
                  value={newLetter} 
                  onChange={(e) => setNewLetter(e.target.value)}
                  className="px-2 py-1.5 text-xs font-bold text-indigo-900 rounded-lg border-none focus:ring-2 focus:ring-indigo-400 outline-none bg-white shadow-sm cursor-pointer"
                >
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(letter => (
                    <option key={letter} value={letter}>{letter}</option>
                  ))}
                </select>

                <select 
                  value={newDiscipline} 
                  onChange={(e) => setNewDiscipline(e.target.value)}
                  className="px-2 py-1.5 text-xs font-bold text-indigo-900 rounded-lg border-none focus:ring-2 focus:ring-indigo-400 outline-none bg-white shadow-sm cursor-pointer max-w-[150px]"
                >
                  <option value="">(Sin disciplina)</option>
                  {DISCIPLINAS_POR_GRADO[newGrade].map(disc => (
                    <option key={disc} value={disc}>{disc}</option>
                  ))}
                </select>

                <button 
                  onClick={confirmAddGroup} 
                  className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 shadow-sm transition-colors ml-1"
                  title="Guardar y continuar"
                >
                  <Check size={16}/>
                </button>
                <button 
                  onClick={() => setIsAddingGroup(false)} 
                  className="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-lg shadow-sm transition-colors"
                  title="Cerrar"
                >
                  <X size={16}/>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingGroup(true)}
                className="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1 text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors ml-auto sm:ml-0"
              >
                <Plus size={16} /> Nuevo Grupo
              </button>
            )}

            <button
              onClick={handleClearAll}
              className="flex sm:hidden w-full justify-center px-4 py-2.5 mt-2 rounded-xl font-bold text-sm items-center gap-2 text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors print:hidden"
            >
              <Trash2 size={16} /> Borrar Todo
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-slate-300 print:shadow-none print:rounded-none" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse min-w-[700px] print:border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 print:bg-white print:text-black">
                <tr>
                  <th className="p-3 w-20 sm:w-24 border-r border-slate-200 font-bold uppercase tracking-wider text-xs print:border-slate-400">Módulo</th>
                  {DAYS.map(day => (
                    <th key={day} className="p-3 w-32 border-r border-slate-200 font-bold print:border-slate-400">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map(mod => (
                  <React.Fragment key={mod}>
                    <tr>
                      <td className="p-3 border-b border-r border-slate-200 font-bold text-slate-500 bg-slate-50/50 print:bg-white print:text-black print:border-slate-400">
                        M{mod}
                      </td>
                      {DAYS.map(day => {
                        const key = `${day}-${mod}`;
                        const assignedGroupId = schedule[key];
                        const assignedGroup = groups.find(g => g.id === assignedGroupId);

                        return (
                          <td 
                            key={key} 
                            className="border-b border-r border-slate-200 p-1.5 h-16 relative print:border-slate-400 print:p-1"
                          >
                            {assignedGroup ? (
                              <div className={`w-full h-full rounded-lg relative overflow-hidden ${assignedGroup.color} text-white shadow-sm transition-all duration-200 group print:shadow-none print:border print:border-slate-300`}>
                                
                                <button
                                  onClick={() => handleCellClick(day, mod)}
                                  className="w-full h-full flex flex-col items-center justify-center focus:outline-none"
                                  title="Clic para editar"
                                >
                                  <span className="font-bold text-sm sm:text-base">{assignedGroup.name}</span>
                                  {assignedGroup.discipline && (
                                    <span className="text-[10px] sm:text-xs bg-black/20 px-1.5 py-0.5 rounded mt-0.5 font-bold tracking-wide uppercase">
                                      {assignedGroup.discipline}
                                    </span>
                                  )}
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSchedule(prev => {
                                      const newSchedule = { ...prev };
                                      delete newSchedule[key];
                                      return newSchedule;
                                    });
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-black/20 hover:bg-red-500 rounded text-white transition-colors z-10 print:hidden"
                                  title="Quitar grupo de esta hora"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleCellClick(day, mod)}
                                className="w-full h-full rounded-lg flex flex-col items-center justify-center transition-all duration-200 active:scale-95 leading-tight bg-white text-slate-300 border-2 border-dashed border-slate-200 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-400 print:border-none"
                              >
                                <span className="print:hidden">+</span>
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {mod === 4 && (
                      <tr>
                        <td colSpan={6} className="bg-slate-100 text-slate-400 font-black text-xs py-2 tracking-[0.3em] text-center border-b border-slate-200 print:bg-white print:text-black print:border-slate-400 print:border-y-2">
                          R E C E S O
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}