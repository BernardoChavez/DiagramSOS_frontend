import React from 'react';

const COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function MultiplayerCursors({ collaborators }) {
  if (!collaborators || Object.keys(collaborators).length === 0) return null;

  return (
    <>
      {Object.values(collaborators).map((collab, index) => {
        const color = COLORS[index % COLORS.length];
        return (
          <div
            key={collab.id}
            className="absolute pointer-events-none z-50 transition-all duration-75 ease-linear"
            style={{
              transform: `translate(${collab.x}px, ${collab.y}px)`,
              left: 0,
              top: 0
            }}
          >
            {/* Cursor SVG */}
            <svg
              width="24"
              height="36"
              viewBox="0 0 24 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-md"
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7871 12.3673H5.65376Z"
                fill={color}
              />
            </svg>
            <div
              className="px-2 py-1 bg-white text-xs font-semibold rounded shadow-sm whitespace-nowrap ml-4 -mt-2"
              style={{ color, border: `1px solid ${color}` }}
            >
              {collab.email ? collab.email.split('@')[0] : 'Colaborador'}
            </div>
          </div>
        );
      })}
    </>
  );
}
