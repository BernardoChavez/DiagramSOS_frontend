import { useState, useEffect, useRef, useCallback } from 'react';

export default function useMultiplayer(projectId) {
  const [collaborators, setCollaborators] = useState({});
  const [error, setError] = useState(null);
  const ws = useRef(null);
  
  // Callbacks for when we receive updates from others
  const onRemoteNodeChange = useRef(null);
  const onRemoteEdgeChange = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    let currentUserId = null;
    try {
      currentUserId = parseInt(JSON.parse(atob(token.split('.')[1])).sub, 10);
    } catch (e) {
      console.error("Error parsing token", e);
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    const wsUrlBase = apiUrl.replace(/^http/, 'ws');
    const wsUrl = `${wsUrlBase}/collaboration/${projectId}/ws?token=${token}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Connected to multiplayer room');
      setError(null);
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'ROOM_STATE':
            const initialCollabs = {};
            message.users.forEach(u => {
              // Filtrar el propio usuario (evitar cursores fantasma de sí mismo)
              if (u.id !== currentUserId) {
                initialCollabs[u.id] = { ...u, x: 0, y: 0 };
              }
            });
            setCollaborators(initialCollabs);
            break;

          case 'USER_JOINED':
            if (message.user.id !== currentUserId) {
              setCollaborators(prev => ({
                ...prev,
                [message.user.id]: { ...message.user, x: 0, y: 0 }
              }));
            }
            break;
            
          case 'USER_LEFT':
            setCollaborators(prev => {
              const newCollabs = { ...prev };
              delete newCollabs[message.user.id];
              return newCollabs;
            });
            break;
            
          case 'CURSOR_MOVED':
            setCollaborators(prev => ({
              ...prev,
              [message.userId]: {
                ...prev[message.userId],
                x: message.x,
                y: message.y
              }
            }));
            break;

          case 'NODES_CHANGED':
            if (onRemoteNodeChange.current) {
              onRemoteNodeChange.current(message.changes);
            }
            break;

          case 'EDGES_CHANGED':
            if (onRemoteEdgeChange.current) {
              onRemoteEdgeChange.current(message.changes);
            }
            break;

          case 'ERROR':
            setError(message.message);
            break;
            
          default:
            break;
        }
      } catch (err) {
        console.error("Error parsing WS message", err);
      }
    };

    ws.current.onclose = (event) => {
      console.log('Disconnected from multiplayer room', event.code);
      if (event.code === 4003) {
        setError("Sala llena o sin permisos");
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [projectId]);

  // Methods to send events to others
  const sendCursorMove = useCallback((x, y) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'CURSOR_MOVED',
        userId: JSON.parse(atob(localStorage.getItem('token').split('.')[1])).sub,
        x, y
      }));
    }
  }, []);

  const sendNodesChange = useCallback((changes) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Filter out 'position' updates that are still dragging to avoid spam, maybe?
      // For simplicity, we send them, but in a real app we might throttle.
      ws.current.send(JSON.stringify({
        type: 'NODES_CHANGED',
        changes
      }));
    }
  }, []);

  const sendEdgesChange = useCallback((changes) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'EDGES_CHANGED',
        changes
      }));
    }
  }, []);

  return {
    collaborators,
    error,
    sendCursorMove,
    sendNodesChange,
    sendEdgesChange,
    onRemoteNodeChange,
    onRemoteEdgeChange
  };
}
