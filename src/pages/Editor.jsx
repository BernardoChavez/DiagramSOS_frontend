import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlow, Controls, Background, addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Download, Users, ArrowLeft, Menu, UserPlus, Upload } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import AIAssistant from '../components/AIAssistant';
import TableNode from '../components/TableNode';
import RelationEdge from '../components/RelationEdge';
import ContextMenu from '../components/ContextMenu';
import MultiplayerCursors from '../components/MultiplayerCursors';
import InviteModal from '../components/InviteModal';
import useMultiplayer from '../hooks/useMultiplayer';
import { getProjects, saveCanvas, exportXMICall, importXMICall } from '../services/api';

const nodeTypes = { tableNode: TableNode };
const edgeTypes = { relationEdge: RelationEdge };

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [menu, setMenu] = useState(null);
  const [connectionType, setConnectionType] = useState('Associate');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [procedureModalNodeId, setProcedureModalNodeId] = useState(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const {
    collaborators,
    error: multiplayerError,
    sendCursorMove,
    sendNodesChange,
    sendEdgesChange,
    onRemoteNodeChange,
    onRemoteEdgeChange
  } = useMultiplayer(id);

  useEffect(() => {
    onRemoteNodeChange.current = (changes) => {
      setNodes(nds => applyNodeChanges(changes, nds));
    };
    onRemoteEdgeChange.current = (changes) => {
      setEdges(eds => applyEdgeChanges(changes, eds));
    };
  }, [setNodes, setEdges, onRemoteNodeChange, onRemoteEdgeChange]);

  useEffect(() => {
    window.openProcedureModal = (nodeId) => {
      setProcedureModalNodeId(nodeId);
    };
    return () => {
      delete window.openProcedureModal;
    };
  }, []);

  // Cargar proyecto
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await getProjects();
        const project = res.data.find(p => p.id === parseInt(id));
        if (project && project.canvas_data && project.canvas_data.nodes) {
          setNodes(project.canvas_data.nodes);

          const validHandles = ['left-source', 'right-source', 'top-source', 'bottom-source', 'left-target', 'right-target', 'top-target', 'bottom-target'];
          const legacyFixedEdges = (project.canvas_data.edges || []).map(edge => {
            const newEdge = { ...edge };
            if (newEdge.sourceHandle && !validHandles.includes(newEdge.sourceHandle)) {
              if (newEdge.sourceHandle.includes('left')) newEdge.sourceHandle = 'left-source';
              else newEdge.sourceHandle = 'right-source';
            }
            if (newEdge.targetHandle && !validHandles.includes(newEdge.targetHandle)) {
              if (newEdge.targetHandle.includes('right')) newEdge.targetHandle = 'right-target';
              else newEdge.targetHandle = 'left-target';
            }
            return newEdge;
          });

          setEdges(legacyFixedEdges);
        } else {
          // Nodo inicial por defecto si esta vacio
          setNodes([{
            id: '1',
            type: 'tableNode',
            position: { x: 250, y: 100 },
            data: { tableName: 'nueva_tabla', columns: [{ name: 'id', type: 'Integer', isPrimary: true }] },
          }]);
        }
      } catch (error) {
        console.error("Error cargando proyecto", error);
      }
    };
    fetchProject();
  }, [id]);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
    sendNodesChange(changes);
  }, [sendNodesChange]);
  
  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
    sendEdgesChange(changes);
  }, [sendEdgesChange]);

  const handlePointerMove = useCallback((e) => {
    sendCursorMove(e.clientX, e.clientY);
  }, [sendCursorMove]);

  const onConnect = useCallback(
    (params) => {
      const fixedParams = { ...params };

      // Inject FK for 1:N relations
      if (['Associate', 'Compose', 'Aggregate'].includes(connectionType)) {
        const sourceNode = nodes.find(n => n.id === params.source);
        if (sourceNode) {
          const fkName = `${sourceNode.data.tableName}_id`;
          setNodes(nds => nds.map(node => {
            if (node.id === params.target) {
              const hasFk = node.data.columns.some(col => col.name === fkName);
              if (!hasFk) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    columns: [...node.data.columns, { name: fkName, type: 'Integer', isPrimary: false }]
                  }
                };
              }
            }
            return node;
          }));
        }
      }

      setEdges((eds) => addEdge({
        ...fixedParams,
        type: 'relationEdge',
        data: {
          relationType: connectionType
        }
      }, eds));
    },
    [connectionType, nodes]
  );

  const onReconnect = useCallback(
    (oldEdge, newConnection) => {
      setEdges((els) => {
        // Find the edge being reconnected and update its source/target handles
        return els.map((edge) => {
          if (edge.id === oldEdge.id) {
            return {
              ...edge,
              source: newConnection.source,
              target: newConnection.target,
              sourceHandle: newConnection.sourceHandle,
              targetHandle: newConnection.targetHandle,
            };
          }
          return edge;
        });
      });
    },
    []
  );

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      setMenu({
        id: node.id,
        top: event.clientY,
        left: event.clientX,
      });
    },
    [setMenu]
  );

  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveCanvas(id, { nodes, edges });
      alert("¡Diagrama guardado correctamente!");
    } catch (error) {
      console.error("Error guardando canvas", error);
      alert("Error al guardar el diagrama.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiUrl}/generator/generate-springboot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        throw new Error('Error al generar el backend');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'springboot-api.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exportando a Spring Boot", error);
      alert("Error al exportar a Spring Boot.");
    }
  };

  const handleExportXMI = async () => {
    try {
      const response = await exportXMICall(id);
      const blob = new Blob([response.data], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_${id}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting XMI", error);
      alert("Error al exportar XMI.");
    }
  };

  const handleImportXMI = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const res = await importXMICall(id, file);
      if (res.data && res.data.nodes) {
        setNodes(res.data.nodes);
        setEdges(res.data.edges || []);
        alert("¡Diagrama importado correctamente desde EA!");
      }
    } catch (error) {
      console.error("Error importing XMI", error);
      alert("Error al importar el archivo XMI.");
    }
    event.target.value = null;
  };

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (typeof type === 'undefined' || !type) return;

    const position = { x: event.clientX - 350, y: event.clientY - 100 }; // Ajuste burdo de posición
    const newNode = {
      id: `${nodes.length + 1}`,
      type,
      position,
      data: { tableName: `tabla_${nodes.length + 1}`, columns: [{ name: 'id', type: 'Integer', isPrimary: true }] },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes]);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Topbar Inline */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20 relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Menu size={20} />
          </button>
          <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md hidden md:block">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-slate-800">DiagramSoS Editor</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
            <Users size={16} className="text-blue-600" />
            <span>Colaboradores: {Object.keys(collaborators).length + 1}</span>
          </div>
          <button onClick={() => setIsInviteOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors">
            <UserPlus size={16} />
            <span>Invitar</span>
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium">
            <Save size={16} />
            <span>{isSaving ? 'Guardando...' : 'Guardar Versión'}</span>
          </button>
          <button onClick={() => document.getElementById('xmi-upload').click()} className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 rounded-md text-sm font-medium transition-colors">
            <Upload size={16} />
            <span>Importar EA</span>
          </button>
          <input type="file" id="xmi-upload" accept=".xml" className="hidden" onChange={handleImportXMI} />
          
          <button onClick={handleExportXMI} className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium transition-colors shadow-sm">
            <Download size={16} />
            <span>Exportar EA</span>
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors shadow-sm">
            <Download size={16} />
            <span>Spring Boot</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          connectionType={connectionType}
          setConnectionType={setConnectionType}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          nodes={nodes}
        />
        <main 
          className="flex-1 relative w-full" 
          onDrop={handleDrop} 
          onDragOver={handleDragOver}
          onPointerMove={handlePointerMove}
        >
          {multiplayerError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded-md shadow-md z-50 text-sm font-medium">
              {multiplayerError}
            </div>
          )}
          <MultiplayerCursors collaborators={collaborators} />
          <svg style={{ position: "absolute", width: 0, height: 0 }}>
            <defs>
              <marker id="marker-compose" markerWidth="12" markerHeight="12" refX="12" refY="6" orient="auto">
                <path d="M0 6 L6 0 L12 6 L6 12 Z" fill="#64748b" />
              </marker>
              <marker id="marker-compose-start" markerWidth="12" markerHeight="12" refX="0" refY="6" orient="auto">
                <path d="M0 6 L6 0 L12 6 L6 12 Z" fill="#64748b" />
              </marker>
              <marker id="marker-aggregate" markerWidth="12" markerHeight="12" refX="12" refY="6" orient="auto">
                <path d="M0 6 L6 0 L12 6 L6 12 Z" fill="white" stroke="#64748b" strokeWidth="1" />
              </marker>
              <marker id="marker-aggregate-start" markerWidth="12" markerHeight="12" refX="0" refY="6" orient="auto">
                <path d="M0 6 L6 0 L12 6 L6 12 Z" fill="white" stroke="#64748b" strokeWidth="1" />
              </marker>
              <marker id="marker-generalize" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
                <path d="M0 0 L10 5 L0 10 Z" fill="white" stroke="#64748b" strokeWidth="1" />
              </marker>
              <marker id="marker-arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
                <path d="M0 0 L10 5 L0 10" fill="none" stroke="#64748b" strokeWidth="1.5" />
              </marker>
            </defs>
          </svg>
          <ReactFlow connectionMode="loose"
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
          >
            <Background color="#ccc" gap={16} size={1} />
            <Controls />
            {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
          </ReactFlow>
        </main>
      </div>

      {procedureModalNodeId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-96 p-4">
            <h2 className="text-lg font-bold mb-4">Definir Procedimientos</h2>
            <div className="space-y-3 mb-4">
              {(nodes.find(n => n.id === procedureModalNodeId)?.data?.customProcedures || []).map((proc, idx) => (
                <div key={idx} className="bg-slate-50 p-2 rounded text-sm border border-slate-200">
                  <div className="font-bold text-slate-700">{proc.method_name}</div>
                  <div className="text-xs text-slate-500">{proc.description}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const name = prompt("Nombre del método (ej. findByNombre):");
                if (!name) return;
                const ret = prompt("Tipo de retorno (ej. List<" + nodes.find(n => n.id === procedureModalNodeId)?.data?.tableName + ">):") || "Object";
                const params = prompt("Parámetros (ej. String nombre):") || "";

                setNodes(nds => nds.map(node => {
                  if (node.id === procedureModalNodeId) {
                    const current = node.data.customProcedures || [];
                    return {
                      ...node,
                      data: {
                        ...node.data,
                        customProcedures: [...current, {
                          method_name: name,
                          return_type: ret,
                          params: params,
                          description: `Método ${name}`
                        }]
                      }
                    };
                  }
                  return node;
                }));
              }}
              className="w-full py-2 bg-blue-50 text-blue-600 rounded mb-2 hover:bg-blue-100 font-medium"
            >
              + Agregar Procedimiento
            </button>
            <button
              onClick={() => setProcedureModalNodeId(null)}
              className="w-full py-2 bg-slate-800 text-white rounded hover:bg-slate-900 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      <AIAssistant
        nodes={nodes}
        projectId={id}
        onAIGenerate={(newNodes, newEdges) => {
          const idMap = {};
          const uniqueNodes = newNodes.map(n => {
            const newId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            idMap[n.id] = newId;
            return { ...n, id: newId };
          });
          const uniqueEdges = newEdges.map(e => ({
            ...e,
            id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            source: idMap[e.source] || e.source,
            target: idMap[e.target] || e.target,
            sourceHandle: e.sourceHandle || "right-source",
            targetHandle: e.targetHandle || "left-target",
          }));

          setNodes((nds) => [...nds, ...uniqueNodes]);
          setEdges((eds) => [...eds, ...uniqueEdges]);
        }}
      />
      <InviteModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        projectId={id} 
      />
    </div>
  );
}
