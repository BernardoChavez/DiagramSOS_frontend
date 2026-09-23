import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Key, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function TableNode({ id, data }) {
  const { updateNodeData, setNodes } = useReactFlow();
  const [isEditingName, setIsEditingName] = useState(false);

  const removeTable = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
  };

  const addColumn = () => {
    const newColumns = [...(data.columns || []), { name: 'nueva_columna', type: 'VARCHAR', isPrimary: false, visibility: 'private' }];
    updateNodeData(id, { columns: newColumns });
  };

  const updateColumn = (index, field, value) => {
    const newColumns = [...data.columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    updateNodeData(id, { columns: newColumns });
  };

  const removeColumn = (index) => {
    const newColumns = data.columns.filter((_, i) => i !== index);
    updateNodeData(id, { columns: newColumns });
  };

  const updateTableName = (e) => {
    updateNodeData(id, { tableName: e.target.value });
  };

  return (
    <div className="group bg-white border border-slate-300 rounded-sm shadow-xl min-w-[260px] font-mono relative hover:border-slate-800 hover:shadow-lg transition-all duration-300">
      {/* Handle Global Left */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-10 !h-10 !bg-transparent !border-0 !opacity-0 z-10"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-4 !h-4 !rounded-full !bg-white !border-[3px] !border-slate-800 opacity-0 group-hover:opacity-100 hover:!bg-slate-200 hover:!scale-125 transition-all duration-200 z-20 cursor-crosshair shadow-sm"
      />

      {/* Handle Global Right */}
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-10 !h-10 !bg-transparent !border-0 !opacity-0 z-10"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!w-4 !h-4 !rounded-full !bg-white !border-[3px] !border-slate-800 opacity-0 group-hover:opacity-100 hover:!bg-slate-200 hover:!scale-125 transition-all duration-200 z-20 cursor-crosshair shadow-sm"
      />

      {/* Handle Global Top */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-10 !h-10 !bg-transparent !border-0 !opacity-0 z-10"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!w-4 !h-4 !rounded-full !bg-white !border-[3px] !border-slate-800 opacity-0 group-hover:opacity-100 hover:!bg-slate-200 hover:!scale-125 transition-all duration-200 z-20 cursor-crosshair shadow-sm"
      />

      {/* Handle Global Bottom */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-10 !h-10 !bg-transparent !border-0 !opacity-0 z-10"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!w-4 !h-4 !rounded-full !bg-white !border-[3px] !border-slate-800 opacity-0 group-hover:opacity-100 hover:!bg-slate-200 hover:!scale-125 transition-all duration-200 z-20 cursor-crosshair shadow-sm"
      />
      <div
        className="bg-slate-800 px-3 py-2 border-b border-slate-900 cursor-text group flex items-center justify-between rounded-t-sm"
        onDoubleClick={() => setIsEditingName(true)}
        onClick={() => !isEditingName && setIsEditingName(true)}
      >
        <div className="flex-1">
          {isEditingName ? (
            <input
              autoFocus
              className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-800 px-1 py-0.5 rounded-sm outline-none"
              value={data.tableName}
              onChange={updateTableName}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
            />
          ) : (
            <h3 className="text-white font-bold text-sm tracking-widest text-center group-hover:text-slate-300 transition-colors uppercase">
              {data.tableName}
            </h3>
          )}
        </div>

        {/* Boton Eliminar Tabla */}
        <button
          onClick={(e) => { e.stopPropagation(); removeTable(); }}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-opacity ml-2 focus:outline-none"
          title="Eliminar tabla"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-0 flex flex-col bg-white">
        {data.columns?.map((col, index) => (
          <div key={index} className="flex items-center gap-2 px-2 py-1.5 border-b border-slate-100 last:border-b-0 group/row hover:bg-slate-50 transition-colors relative">

            <button
              onClick={() => updateColumn(index, 'isPrimary', !col.isPrimary)}
              className={`focus:outline-none flex-shrink-0 w-5 text-center text-xs font-bold transition-colors ${col.isPrimary ? "text-amber-500" : "text-slate-300 hover:text-amber-300"}`}
              title="Marcar como Primary Key"
            >
              -
            </button>

            <input
              className={`text-xs w-full bg-transparent outline-none border-b border-transparent focus:border-slate-400 ${col.isPrimary ? 'font-bold text-slate-800' : 'text-slate-600'}`}
              value={col.name}
              onChange={(e) => updateColumn(index, 'name', e.target.value)}
              placeholder="nombre"
            />

            <select
              className="text-[10px] w-24 flex-shrink-0 text-left text-slate-500 uppercase bg-transparent outline-none border-b border-transparent focus:border-slate-400 cursor-pointer p-0"
              value={col.type}
              onChange={(e) => updateColumn(index, 'type', e.target.value)}
            >
              <option value="INTEGER">INTEGER</option>
              <option value="VARCHAR">VARCHAR</option>
              <option value="TEXT">TEXT</option>
              <option value="BOOLEAN">BOOLEAN</option>
              <option value="DATE">DATE</option>
              <option value="TIMESTAMP">TIMESTAMP</option>
              <option value="DECIMAL">DECIMAL</option>
              <option value="FLOAT">FLOAT</option>
              <option value="DOUBLE">DOUBLE</option>
            </select>

            <button
              onClick={() => removeColumn(index)}
              className="flex-shrink-0 opacity-0 group-hover/row:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
              title="Eliminar columna"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 px-2 py-1.5 border-t border-slate-200 rounded-b-sm">
        <button
          onClick={addColumn}
          className="flex items-center justify-center gap-1 w-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 py-1 rounded-sm transition-colors uppercase tracking-wider"
        >
          <Plus size={12} /> Agregar columna
        </button>
      </div>

    </div>
  );
}
