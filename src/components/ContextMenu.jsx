import React from 'react';
import { useReactFlow } from '@xyflow/react';
import { Trash2, Settings, Edit3, Share2 } from 'lucide-react';

export default function ContextMenu({ id, top, left, right, bottom, onClick }) {
  const { getNode, setNodes, setEdges } = useReactFlow();
  const node = getNode(id);

  if (!node) return null;

  const duplicateNode = () => {
    const position = {
      x: node.position.x + 50,
      y: node.position.y + 50,
    };

    setNodes((nodes) => [
      ...nodes,
      {
        ...node,
        id: `${node.id}-copy-${Date.now()}`,
        position,
        selected: false,
      },
    ]);
  };

  const deleteNode = () => {
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <div
      style={{ top, left, right, bottom }}
      className="absolute z-50 bg-white border border-slate-200 shadow-xl rounded-md w-48 py-1 font-sans text-sm"
      onClick={onClick}
    >
      <div className="px-3 py-1 text-xs font-semibold text-slate-400 border-b border-slate-100 uppercase tracking-wider mb-1">
        {node.data.tableName || 'Elemento'}
      </div>
      
      <button 
        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick();
          if (window.openProcedureModal) window.openProcedureModal(id);
        }}
      >
        <Settings size={14} className="text-slate-400" /> Definir Procedimientos
      </button>
      <button className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 transition-colors">
        <Edit3 size={14} className="text-slate-400" /> Caracteristicas
      </button>
      <button className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 transition-colors" onClick={duplicateNode}>
        <Share2 size={14} className="text-slate-400" /> Clonar Elemento
      </button>

      <div className="h-px bg-slate-200 my-1 mx-2" />

      <button 
        className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
        onClick={deleteNode}
      >
        <Trash2 size={14} /> Eliminar
      </button>
    </div>
  );
}
