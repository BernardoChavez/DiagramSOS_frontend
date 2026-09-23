import { Save, Download, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-10">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">DiagramSoS Editor</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
          <Users size={16} className="text-green-600" />
          <span>Colaboradores: 1</span>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium">
          <Save size={16} />
          <span>Guardar Versión</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
          <Download size={16} />
          <span>Exportar Spring Boot</span>
        </button>
      </div>
    </header>
  );
}
