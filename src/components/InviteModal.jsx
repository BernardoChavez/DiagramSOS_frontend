import { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function InviteModal({ isOpen, onClose, projectId }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleInvite = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      const response = await api.post(`/projects/${projectId}/invite`, { email });
      alert(response.data.message || "Invitación enviada");
      onClose();
      setEmail('');
    } catch (error) {
      alert(error.response?.data?.detail || "Error al enviar invitación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-96 overflow-hidden">
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
          <h2 className="font-bold">Invitar Colaborador</h2>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            Ingresa el correo del colaborador. Se le enviará un email con el enlace a este proyecto. (Máx. 3 personas en total en la sala).
          </p>
          <input
            type="email"
            className="w-full border border-slate-300 rounded px-3 py-2 mb-4 focus:outline-none focus:border-blue-500"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button
            onClick={handleInvite}
            disabled={isLoading || !email}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2 font-medium disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Enviar Invitación
          </button>
        </div>
      </div>
    </div>
  );
}
