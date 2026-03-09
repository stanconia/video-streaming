import React, { useRef, useEffect, useState, useCallback } from 'react';

interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
}

interface Props {
  isActive: boolean;
  canDraw: boolean;
  onSendUpdate: (changes: any) => void;
  onRegisterRemoteDraw: (cb: ((changes: any) => void) | null) => void;
  incomingSnapshot: any;
  onClearSnapshot: () => void;
}

export const WhiteboardPanel: React.FC<Props> = ({
  isActive,
  canDraw,
  onSendUpdate,
  onRegisterRemoteDraw,
  incomingSnapshot,
  onClearSnapshot,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [color] = useState('#000000');
  const [lineWidth] = useState(3);

  const drawLine = useCallback((segment: LineSegment) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = segment.color;
    ctx.lineWidth = segment.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(segment.x2, segment.y2);
    ctx.stroke();
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Initialize canvas with white background
  useEffect(() => {
    clearCanvas();
  }, [clearCanvas]);

  // Register the draw callback so incoming WebSocket updates draw directly on canvas
  useEffect(() => {
    onRegisterRemoteDraw((changes: any) => {
      if (changes.type === 'line') {
        drawLine(changes.segment);
      } else if (changes.type === 'clear') {
        clearCanvas();
      }
    });
    return () => onRegisterRemoteDraw(null);
  }, [drawLine, clearCanvas, onRegisterRemoteDraw]);

  // Handle incoming snapshot (e.g., clear command)
  useEffect(() => {
    if (incomingSnapshot) {
      if (incomingSnapshot.type === 'clear') {
        clearCanvas();
      }
      onClearSnapshot();
    }
  }, [incomingSnapshot, clearCanvas, onClearSnapshot]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    isDrawing.current = true;
    lastPos.current = getCanvasCoords(e);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canDraw || !isDrawing.current || !lastPos.current) return;
    const pos = getCanvasCoords(e);
    const segment: LineSegment = {
      x1: lastPos.current.x,
      y1: lastPos.current.y,
      x2: pos.x,
      y2: pos.y,
      color,
      width: lineWidth,
    };
    drawLine(segment);
    onSendUpdate({ type: 'line', segment });
    lastPos.current = pos;
  };

  const handlePointerUp = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  const handleClear = () => {
    clearCanvas();
    onSendUpdate({ type: 'clear' });
  };

  if (!isActive) return null;

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <span style={styles.title}>Whiteboard</span>
        {!canDraw && <span style={styles.readOnly}>Read only</span>}
        {canDraw && (
          <button style={styles.clearButton} onClick={handleClear}>
            Clear
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={640}
        height={400}
        style={{
          ...styles.canvas,
          cursor: canDraw ? 'crosshair' : 'default',
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '12px',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#e0e0e0',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  readOnly: {
    color: '#f0c040',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  clearButton: {
    padding: '4px 12px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  canvas: {
    width: '100%',
    height: 'auto',
    border: '1px solid #333',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    touchAction: 'none',
  },
};
