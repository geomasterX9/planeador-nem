import React, { useState } from 'react';
import { Table, CheckSquare, Eye, Plus } from 'lucide-react';

export const EvaluationWidget = () => {
  const [tipo, setTipo] = useState<string>('');
  
  // Estado simple para evitar errores
  const [rubricaRows, setRubricaRows] = useState([{ criterio: '', nivel: '' }]);
  const [cotejoItems, setCotejoItems] = useState([{ texto: '' }]);

  return (
    <div className="bg-white p-4 rounded border border-slate-200 mt-4 shadow-sm">
      
      {/* Selector Principal */}
      <div className="mb-4">
        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
          Instrumento de Evaluación
        </label>
        <select 
          className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-slate-50"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">-- Seleccionar Instrumento --</option>
          <option value="rubrica">Rúbrica</option>
          <option value="lista">Lista de Cotejo</option>
          <option value="guia">Guía de Observación</option>
        </select>
      </div>

      {/* Opción 1: Rúbrica */}
      {tipo === 'rubrica' && (
        <div className="p-3 bg-blue-50 rounded border border-blue-100">
          <div className="flex items-center gap-2 mb-3 text-blue-800 font-semibold text-sm">
            <Table size={16} /> Diseñador de Rúbrica
          </div>
          {rubricaRows.map((row, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input placeholder="Criterio (ej. Ortografía)" className="flex-1 text-xs p-2 border rounded" />
              <input placeholder="Nivel esperado" className="flex-1 text-xs p-2 border rounded" />
            </div>
          ))}
          <button onClick={() => setRubricaRows([...rubricaRows, {criterio:'', nivel:''}])} className="text-xs text-blue-600 font-bold hover:underline">
            + Agregar Criterio
          </button>
        </div>
      )}

      {/* Opción 2: Lista de Cotejo */}
      {tipo === 'lista' && (
        <div className="p-3 bg-green-50 rounded border border-green-100">
          <div className="flex items-center gap-2 mb-3 text-green-800 font-semibold text-sm">
            <CheckSquare size={16} /> Lista de Cotejo
          </div>
          {cotejoItems.map((item, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <input type="checkbox" disabled className="w-4 h-4" />
              <input placeholder="Indicador (ej. Participa activamente...)" className="flex-1 text-xs p-2 border rounded" />
            </div>
          ))}
          <button onClick={() => setCotejoItems([...cotejoItems, {texto:''}])} className="text-xs text-green-600 font-bold hover:underline">
            + Agregar Indicador
          </button>
        </div>
      )}

      {/* Opción 3: Guía */}
      {tipo === 'guia' && (
        <div className="p-3 bg-purple-50 rounded border border-purple-100">
          <div className="flex items-center gap-2 mb-2 text-purple-800 font-semibold text-sm">
            <Eye size={16} /> Aspectos a Observar
          </div>
          <textarea className="w-full h-20 text-xs p-2 border rounded" placeholder="Escribe aquí..."></textarea>
        </div>
      )}
    </div>
  );
};