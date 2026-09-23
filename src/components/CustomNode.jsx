import { Handle, Position } from '@xyflow/react';
import { Key } from 'lucide-react';

export default function CustomNode({ data }) {
  return (
    <div className="bg-white border border-slate-300 rounded-lg shadow-md min-w-[200px] overflow-hidden font-sans">
      <div className="bg-blue-600 px-4 py-2 border-b border-blue-700">
        <h3 className="text-white font-bold text-sm tracking-wide">{data.tableName}</h3>
      </div>
      
      <div className="p-0 flex flex-col">
        {data.columns?.map((col, index) => (
          <div key={index} className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
            <div className="flex items-center gap-2">
              {col.isPrimary && <Key size={12} className="text-amber-500" />}
              <span className={`text-xs ${col.isPrimary ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                {col.name}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase">{col.type}</span>
          </div>
        ))}
      </div>

      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-slate-400" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-blue-500" />
    </div>
  );
}
