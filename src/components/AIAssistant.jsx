import { MessageSquare, Sparkles, Image as ImageIcon, Loader2, X, ChevronUp, ChevronDown, Mic, MicOff } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

export default function AIAssistant({ nodes = [], onAIGenerate, projectId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setPrompt(currentTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setPrompt("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          base64: reader.result,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIAssistant = async () => {
    if (!prompt && !selectedImage) return;
    setIsLoading(true);

    try {
      const response = await api.post('/ai/generate', { 
        prompt: prompt || "Genera el diagrama a partir de la imagen adjunta",
        image_base64: selectedImage?.base64,
        mime_type: selectedImage?.type,
        current_schema: nodes.map(n => ({ id: n.id, table_name: n.data?.tableName })),
        project_id: projectId ? parseInt(projectId) : null
      });

      const data = response.data;
      if (data.nodes && data.edges) {
        onAIGenerate(data.nodes, data.edges);
      }
      
      setPrompt("");
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error(error);
      alert("Error al generar el diagrama con IA.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Panel de chat */}
      <div 
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 ease-out origin-bottom-right mb-4 w-[350px] ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles size={18} className="text-blue-400" />
            Asistente IA
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4 bg-slate-50 flex flex-col gap-3 max-h-[400px] overflow-y-auto">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm rounded-tl-none border border-blue-100 shadow-sm">
            ¡Hola! Dime qué tablas necesitas o sube una foto de tu diseño en papel. Por ejemplo: <strong>"Conecta la tabla user con una nueva tabla perfil"</strong>.
          </div>
          
          {selectedImage && (
            <div className="relative self-end">
              <img src={selectedImage.base64} alt="Upload preview" className="h-24 rounded-lg border border-slate-300 object-cover shadow-sm" />
              <button onClick={() => { setSelectedImage(null); fileInputRef.current.value = ""; }} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow hover:bg-slate-900">
                <X size={12}/>
              </button>
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-slate-200 bg-white">
          <div className="relative flex items-end gap-2">
            <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden flex items-center pl-3">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAIAssistant()}
                placeholder="Pide tablas o relaciones..." 
                className="flex-1 py-3 text-sm bg-transparent focus:outline-none text-slate-700"
                disabled={isLoading}
              />
              
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                disabled={isLoading}
              />
              
              {recognitionRef.current && (
                <button
                  className={`p-2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-blue-500'}`}
                  onClick={toggleListening}
                  disabled={isLoading}
                  title={isListening ? "Detener grabación" : "Dictar por voz"}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}

              <button 
                className="p-2 text-slate-400 hover:text-blue-500 transition-colors" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Subir foto de diagrama"
              >
                <ImageIcon size={18} />
              </button>
            </div>
            
            <button 
              className="p-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              onClick={handleAIAssistant}
              disabled={isLoading || (!prompt && !selectedImage)}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ChevronUp size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'bg-slate-800' : 'bg-blue-600'} text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}
