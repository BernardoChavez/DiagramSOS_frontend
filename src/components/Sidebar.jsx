import { Database, Minus, ArrowUpRight, Maximize, Spline, Waypoints, Search, FolderTree, Lock, Unlock, Shield } from 'lucide-react';

export default function Sidebar({ connectionType, setConnectionType, isOpen, setIsOpen, nodes = [] }) {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const getVisibilityIcon = (vis) => {
    if (vis === 'public') return <Unlock size={12} className="text-green-500" />;
    if (vis === 'protected') return <Shield size={12} className="text-amber-500" />;
    return <Lock size={12} className="text-blue-500" />; // default private
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside 
        className={`
          fixed md:relative top-14 md:top-0 left-0 h-[calc(100vh-3.5rem)] md:h-full
          w-80 bg-white border-r border-slate-200 flex flex-col shadow-[2px_0_12px_-4px_rgba(0,0,0,0.1)] 
          z-30 transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 md:ml-0' : '-translate-x-full md:translate-x-0 md:-ml-80'}
        `}
      >
      <div className="flex-1 overflow-y-auto p-4">
        
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Explorador de Proyecto</h2>
        <div className="space-y-2 mb-6 border border-slate-200 rounded-lg p-2 bg-slate-50 min-h-[150px] max-h-[300px] overflow-y-auto">
          {nodes.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-4">No hay clases en el proyecto</div>
          ) : (
            nodes.map(node => (
              <div key={node.id} className="text-sm">
                <div className="flex items-center gap-2 text-slate-700 font-bold py-1">
                  <Database size={14} className="text-slate-500" />
                  {node.data?.tableName || 'Sin nombre'}
                </div>
                <div className="pl-6 border-l border-slate-200 ml-2 space-y-1 mt-1">
                  {node.data?.columns?.map((col, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900">
                      {getVisibilityIcon(col.visibility)}
                      <span className={col.isPrimary ? "font-bold text-slate-800 underline" : ""}>
                        {col.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Paleta (Arrastra al lienzo)</h2>
        <div className="space-y-2">
          <div 
            className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-grab hover:border-blue-400 hover:shadow-sm transition-all"
            onDragStart={(event) => onDragStart(event, 'tableNode')}
            draggable
          >
            <Database size={20} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Nueva Clase / Tabla</span>
          </div>
        </div>

        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mt-6 mb-4">Relaciones (UML)</h2>
        <div className="space-y-2">
          
          {[
            { id: 'Associate', label: 'Associate', icon: <Minus size={16} /> },
            { id: 'Generalize', label: 'Generalize', icon: <ArrowUpRight size={16} /> },
            { id: 'Compose', label: 'Compose', icon: <Maximize size={16} /> },
            { id: 'Aggregate', label: 'Aggregate', icon: <Spline size={16} /> },
            { id: 'Realize', label: 'Realize', icon: <Waypoints size={16} /> },
            { id: 'Dependency', label: 'Dependency', icon: <Search size={16} /> },
          ].map((rel) => (
            <button
              key={rel.id}
              onClick={() => setConnectionType?.(rel.id)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${
                connectionType === rel.id 
                  ? 'bg-blue-50 border-blue-400 shadow-sm text-blue-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
            >
              <div className={connectionType === rel.id ? 'text-blue-500' : 'text-slate-400'}>
                {rel.icon}
              </div>
              <span className="text-sm font-medium">{rel.label}</span>
            </button>
          ))}
          
        </div>
      </div>
    </aside>
    </>
  );
}
