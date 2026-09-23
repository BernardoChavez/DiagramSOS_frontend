import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Folder, LogOut, Trash2 } from 'lucide-react';
import { getProjects, createProject, deleteProject } from '../services/api';
import { importNewProjectFromXMICall } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProject(newProject);
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (error) {
      console.error("Error creating project", error);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Evitar navegar al editor
    if (window.confirm("¿Seguro que deseas eliminar este proyecto?")) {
      try {
        await deleteProject(id);
        fetchProjects();
      } catch (error) {
        console.error("Error deleting", error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleImportNewXMI = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const res = await importNewProjectFromXMICall(file);
      if (res.data && res.data.id) {
        alert("¡Proyecto creado e importado correctamente!");
        fetchProjects();
        // Opcional: navegar directo al editor -> navigate(`/editor/${res.data.id}`);
      }
    } catch (error) {
      console.error("Error importing XMI", error);
      alert("Error al importar el archivo XMI.");
    }
    event.target.value = null;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Tus Proyectos</h1>
            <p className="text-slate-500 mt-1">Sesión iniciada como <span className="font-medium text-slate-700">{user?.username}</span></p>
          </div>
          <div className="flex gap-4">
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">
              <LogOut size={18} />
              <span>Salir</span>
            </button>
            <button onClick={() => document.getElementById('dashboard-xmi-upload').click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
              <Upload size={18} />
              <span>Importar</span>
            </button>
            <input type="file" id="dashboard-xmi-upload" accept=".xml" className="hidden" onChange={handleImportNewXMI} />
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span>Nuevo Proyecto</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group" onClick={() => navigate(`/editor/${project.id}`)}>
              <button 
                onClick={(e) => handleDelete(e, project.id)}
                className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
              >
                <Trash2 size={18} />
              </button>
              <div className="flex items-center gap-3 mb-4 text-blue-600">
                <Folder size={24} />
                <h3 className="text-lg font-semibold text-slate-800">{project.name}</h3>
              </div>
              <p className="text-sm text-slate-500">{project.description || 'Sin descripción'}</p>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
              No tienes proyectos aún. ¡Crea uno nuevo!
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Crear Proyecto</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                <input type="text" required value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Descripción</label>
                <textarea value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
