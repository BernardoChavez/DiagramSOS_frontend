import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow } from '@xyflow/react';
import { RefreshCw, Trash2 } from 'lucide-react';

const relationshipTypes = ['Associate', 'Generalize', 'Compose', 'Aggregate', 'Realize'];

export default function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) {
  const { setEdges, setNodes, getNode, getEdge } = useReactFlow();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const relationType = data?.relationType || 'Associate';

  let customMarkerEnd = undefined;
  let strokeDasharray = 'none';

  const getMarkerUrl = (id) => `url(${window.location.pathname}${window.location.search}#${id})`;

  if (relationType === 'Compose') customMarkerEnd = getMarkerUrl('marker-compose');
  if (relationType === 'Aggregate') customMarkerEnd = getMarkerUrl('marker-aggregate');
  if (relationType === 'Generalize' || relationType === 'Realize') customMarkerEnd = getMarkerUrl('marker-generalize');
  if (relationType === 'Dependency' || relationType === 'Template') customMarkerEnd = getMarkerUrl('marker-arrow');
  
  if (relationType === 'Realize' || relationType === 'Dependency' || relationType === 'Template') strokeDasharray = '5 5';

  const removeEdge = (evt) => {
    evt.stopPropagation();
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={customMarkerEnd} 
        style={{ ...style, strokeWidth: 2, stroke: '#64748b', strokeDasharray }} 
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan flex items-center gap-1"
        >
          {relationType === 'Associate' && (
            <select
              className="bg-blue-50 text-blue-600 font-bold text-[10px] pl-1 pr-4 py-0.5 rounded border border-blue-200 shadow-sm opacity-80 hover:opacity-100 hover:bg-blue-100 transition-colors appearance-none cursor-pointer outline-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232563EB%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.2rem top 50%',
                backgroundSize: '0.4rem auto',
              }}
              value={data?.cardinality || '1:N'}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                const val = e.target.value;
                
                if (val === 'N:M') {
                  const edge = getEdge(id);
                  if (!edge) return;
                  
                  const sourceNode = getNode(edge.source);
                  const targetNode = getNode(edge.target);
                  if (!sourceNode || !targetNode) return;

                  const midX = (sourceNode.position.x + targetNode.position.x) / 2;
                  const midY = (sourceNode.position.y + targetNode.position.y) / 2 - 50;
                  
                  const newTableName = `${sourceNode.data.tableName}_${targetNode.data.tableName}`;
                  const newNodeId = `node_${Date.now()}`;
                  const sourceFkName = `${sourceNode.data.tableName}_id`;
                  const targetFkName = `${targetNode.data.tableName}_id`;

                  const newNode = {
                    id: newNodeId,
                    type: 'tableNode',
                    position: { x: midX, y: midY },
                    data: { 
                      tableName: newTableName, 
                      columns: [
                        { name: 'id', type: 'Integer', isPrimary: true },
                        { name: sourceFkName, type: 'Integer', isPrimary: false },
                        { name: targetFkName, type: 'Integer', isPrimary: false }
                      ] 
                    },
                  };

                  // Remove FK from target node and add new node
                  setNodes(nds => {
                    const updatedNodes = nds.map(node => {
                      if (node.id === targetNode.id) {
                        return {
                          ...node,
                          data: {
                            ...node.data,
                            columns: node.data.columns.filter(col => col.name !== sourceFkName)
                          }
                        };
                      }
                      return node;
                    });
                    return [...updatedNodes, newNode];
                  });

                  const s1Source = sourceNode.position.x < midX ? 'right-source' : 'left-source';
                  const s1Target = sourceNode.position.x < midX ? 'left-target' : 'right-target';
                  
                  const s2Source = targetNode.position.x < midX ? 'right-source' : 'left-source';
                  const s2Target = targetNode.position.x < midX ? 'left-target' : 'right-target';

                  // Delete old edge, add two new edges
                  setEdges(eds => {
                    const filteredEdges = eds.filter(e => e.id !== id);
                    return [
                      ...filteredEdges,
                      { id: `xy-edge__${sourceNode.id}-${newNodeId}`, source: sourceNode.id, target: newNodeId, sourceHandle: s1Source, targetHandle: s1Target, type: 'relationEdge', data: { relationType: 'Associate', cardinality: '1:N' } },
                      { id: `xy-edge__${targetNode.id}-${newNodeId}`, source: targetNode.id, target: newNodeId, sourceHandle: s2Source, targetHandle: s2Target, type: 'relationEdge', data: { relationType: 'Associate', cardinality: '1:N' } }
                    ];
                  });
                } else {
                  const edge = getEdge(id);
                  if (edge) {
                    const sourceNode = getNode(edge.source);
                    const targetNode = getNode(edge.target);
                    if (sourceNode && targetNode) {
                      const sourceFkName = `${sourceNode.data.tableName}_id`;
                      const targetFkName = `${targetNode.data.tableName}_id`;
                      
                      setNodes(nds => nds.map(node => {
                        let newColumns = [...node.data.columns];
                        
                        if (node.id === targetNode.id) {
                          if (val === '1:N' || val === '1:1') {
                            if (!newColumns.some(c => c.name === sourceFkName)) {
                              newColumns.push({ name: sourceFkName, type: 'Integer', isPrimary: false });
                            }
                          } else if (val === 'N:1') {
                            newColumns = newColumns.filter(c => c.name !== sourceFkName);
                          }
                        }
                        
                        if (node.id === sourceNode.id) {
                          if (val === 'N:1') {
                            if (!newColumns.some(c => c.name === targetFkName)) {
                              newColumns.push({ name: targetFkName, type: 'Integer', isPrimary: false });
                            }
                          } else if (val === '1:N' || val === '1:1') {
                            newColumns = newColumns.filter(c => c.name !== targetFkName);
                          }
                        }
                        
                        return {
                          ...node,
                          data: { ...node.data, columns: newColumns }
                        };
                      }));
                    }
                  }
                  
                  setEdges(eds => eds.map(e => e.id === id ? { ...e, data: { ...e.data, cardinality: val } } : e));
                }
              }}
              title="Seleccionar cardinalidad"
            >
              <option value="1:1">1:1</option>
              <option value="1:N">1:N</option>
              <option value="N:1">N:1</option>
              <option value="N:M">N:M</option>
            </select>
          )}
          <button
            className="bg-white border border-red-200 p-1 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm opacity-60 hover:opacity-100"
            onClick={removeEdge}
            title="Eliminar relación"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
