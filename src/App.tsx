import { useState, useRef, useCallback, useEffect } from 'react';
import { useLabMapper, ENTITY_CONFIGS } from './hooks/useLabMapper';
import type { EntityType, ConnectionMode, CanvasNode } from './types/entities';
import { DetailPanel } from './components/panels/DetailPanel';
import { Toolbar } from './components/ui/Toolbar';
import { AddNodeMenu } from './components/ui/AddNodeMenu';
import './styles/app.css';

export default function App() {
  const mapper = useLabMapper();
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragPositionRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const pointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Canvas state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Interaction state
  const [mode, setMode] = useState<ConnectionMode>('associative');
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<{ id: string; type: EntityType } | null>(null);
  const [connectPreview, setConnectPreview] = useState<{ x: number; y: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [connectionLabelDraft, setConnectionLabelDraft] = useState('');

  // Filter state
  const [visibleTypes, setVisibleTypes] = useState<Set<EntityType>>(
    new Set(Object.keys(ENTITY_CONFIGS) as EntityType[])
  );

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Computed ──
  const visibleNodes = mapper.nodes.filter(n => visibleTypes.has(n.entityType));
  const selectedNodeData = mapper.nodes.find(n => n.id === selectedNode);
  const selectedConnData = mapper.connections.find(c => c.id === selectedConnection);

  useEffect(() => {
    setConnectionLabelDraft(selectedConnData?.label || '');
  }, [selectedConnData?.id, selectedConnData?.label]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    dragOffsetRef.current = dragOffset;
  }, [dragOffset]);

  // ── Node center for connections ──
  const nodeCenter = useCallback((node: CanvasNode) => ({
    x: (node.x + 80) * zoom + pan.x,
    y: (node.y + 24) * zoom + pan.y,
  }), [pan, zoom]);

  // ── Bezier path ──
  function bezierPath(x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1;
    const cp = Math.min(Math.abs(dx) * 0.5, 120);
    return `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
  }

  function arrowHead(x2: number, y2: number, x1: number, y1: number) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const s = 10;
    return `M ${x2} ${y2} L ${x2 - s * Math.cos(angle - Math.PI / 6)} ${y2 - s * Math.sin(angle - Math.PI / 6)} M ${x2} ${y2} L ${x2 - s * Math.cos(angle + Math.PI / 6)} ${y2 - s * Math.sin(angle + Math.PI / 6)}`;
  }

  const updateDraggedNodeFromPointer = useCallback((clientX: number, clientY: number, nextPan = panRef.current) => {
    if (!dragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - dragOffsetRef.current.x - nextPan.x) / zoomRef.current;
    const y = (clientY - rect.top - dragOffsetRef.current.y - nextPan.y) / zoomRef.current;

    dragPositionRef.current = { id: dragging, x, y };
    mapper.setNodePositionLocal(dragging, x, y);
  }, [dragging, mapper]);

  // ── Canvas mouse handlers ──
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setSelectedNode(null);
      setSelectedConnection(null);
      setEditingLabel(null);
      setContextMenu(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    pointerRef.current = { clientX: e.clientX, clientY: e.clientY };

    if (isPanning) {
      const nextPan = { x: e.clientX - panStart.x, y: e.clientY - panStart.y };
      panRef.current = nextPan;
      setPan(nextPan);
    }
    if (dragging) {
      updateDraggedNodeFromPointer(e.clientX, e.clientY);
    }
    if (connecting) {
      const rect = canvasRef.current!.getBoundingClientRect();
      setConnectPreview({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    pointerRef.current = null;
    if (dragPositionRef.current) {
      const { id, x, y } = dragPositionRef.current;
      mapper.updateNodePosition(id, x, y);
      dragPositionRef.current = null;
    }
    setDragging(null);
    if (connecting) {
      setConnecting(null);
      setConnectPreview(null);
    }
  };

  const handleCanvasMouseLeave = () => {
    pointerRef.current = null;
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      const rect = canvasRef.current!.getBoundingClientRect();
      setContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // ── Node mouse handlers ──
  const handleNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();
    if (connecting) {
      mapper.addConnection(
        connecting.type, connecting.id,
        node.entityType, node.id,
        mode
      );
      setConnecting(null);
      setConnectPreview(null);
      return;
    }
    const rect = canvasRef.current!.getBoundingClientRect();
    const nextOffset = {
      x: e.clientX - rect.left - pan.x - node.x * zoom,
      y: e.clientY - rect.top - pan.y - node.y * zoom,
    };
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
    setDragging(node.id);
    setSelectedNode(node.id);
    setSelectedConnection(null);
  };

  const handleStartConnect = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();
    setConnecting({ id: node.id, type: node.entityType });
    const rect = canvasRef.current!.getBoundingClientRect();
    setConnectPreview({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // ── Zoom ──
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        setZoom(z => Math.min(3, Math.max(0.2, z * delta)));
        return;
      }

      const horizontalDelta = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      const verticalDelta = e.shiftKey ? 0 : e.deltaY;

      setPan(prev => ({
        x: prev.x - horizontalDelta,
        y: prev.y - verticalDelta,
      }));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const threshold = 80;
    const maxSpeed = 18;
    let frameId = 0;

    const tick = () => {
      const pointer = pointerRef.current;
      const rect = canvasRef.current?.getBoundingClientRect();

      if (pointer && rect) {
        let scrollX = 0;
        let scrollY = 0;

        if (pointer.clientX < rect.left + threshold) {
          scrollX = -((rect.left + threshold - pointer.clientX) / threshold) * maxSpeed;
        } else if (pointer.clientX > rect.right - threshold) {
          scrollX = ((pointer.clientX - (rect.right - threshold)) / threshold) * maxSpeed;
        }

        if (pointer.clientY < rect.top + threshold) {
          scrollY = -((rect.top + threshold - pointer.clientY) / threshold) * maxSpeed;
        } else if (pointer.clientY > rect.bottom - threshold) {
          scrollY = ((pointer.clientY - (rect.bottom - threshold)) / threshold) * maxSpeed;
        }

        if (scrollX !== 0 || scrollY !== 0) {
          const nextPan = {
            x: panRef.current.x - scrollX,
            y: panRef.current.y - scrollY,
          };

          panRef.current = nextPan;
          setPan(nextPan);

          if (dragging) {
            updateDraggedNodeFromPointer(pointer.clientX, pointer.clientY, nextPan);
          }
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [dragging, updateDraggedNodeFromPointer]);

  // ── Node shape styles ──
  function nodeShapeStyle(shape: string): React.CSSProperties {
    switch (shape) {
      case 'diamond':
        return { borderRadius: 4, transform: 'rotate(0deg)' }; // We'll use CSS clip-path
      case 'hexagon':
        return { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };
      case 'process':
        return { borderRadius: 4, borderWidth: 3 };
      case 'trapezoid':
        return { clipPath: 'polygon(10% 100%, 0% 0%, 100% 0%, 90% 100%)' };
      case 'parallelogram':
        return { clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' };
      default:
        return { borderRadius: 8 };
    }
  }

  // ── Render ──
  if (mapper.loading) {
    return (
      <div className="loading-screen">
        <div className="loading-icon">[]</div>
        <div>Loading SPL Lab Mapper...</div>
        {!mapper.isSupabaseConfigured && (
          <div className="loading-hint">Running in local mode - configure Supabase for persistence</div>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        nodeCount={mapper.nodes.length}
        connCount={mapper.connections.length}
        visibleTypes={visibleTypes}
        onToggleType={(t) => {
          setVisibleTypes(prev => {
            const next = new Set(prev);
            next.has(t) ? next.delete(t) : next.add(t);
            return next;
          });
        }}
        onExport={mapper.exportJSON}
        onShowHelp={() => setShowHelp(!showHelp)}
        isSupabaseConfigured={mapper.isSupabaseConfigured}
        zoom={zoom}
        onZoomReset={() => setZoom(1)}
      />

      {mapper.error && (
        <div className="app-banner app-banner--error">
          Data sync issue: {mapper.error}
        </div>
      )}

      {showHelp && (
        <div className="help-overlay">
          <div className="help-title">SPL Lab Mapper - Controls</div>
          <div><span className="help-key">Double-click</span> canvas - add entity menu</div>
          <div><span className="help-key">Drag</span> a node - move it</div>
          <div><span className="help-key">Click</span> a node - view/edit details</div>
          <div><span className="help-key">Double-click</span> a node - rename it</div>
          <div><span className="help-key">Port</span> (right side) - drag to connect</div>
          <div><span className="help-key">Move near edge</span> - auto-scroll canvas</div>
          <div><span className="help-key">Scroll wheel</span> - pan canvas</div>
          <div><span className="help-key">Ctrl/Cmd + wheel</span> - zoom in/out</div>
          <div><span className="help-key">Drag</span> empty canvas - pan</div>
          <div><span className="help-key">Right-click</span> canvas - add entity menu</div>
          <div className="help-sub">Toggle entity types in the filter bar to show/hide layers.</div>
          <button className="btn" onClick={() => setShowHelp(false)}>Got it</button>
        </div>
      )}

      <div
        ref={canvasRef}
        className="canvas"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseLeave}
        onDoubleClick={handleCanvasDoubleClick}
        onContextMenu={handleContextMenu}
        style={{ cursor: isPanning ? 'grabbing' : connecting ? 'crosshair' : 'default' }}
      >
        {/* Grid */}
        <div
          className="canvas-bg"
          style={{
            backgroundPosition: `${pan.x % (30 * zoom)}px ${pan.y % (30 * zoom)}px`,
            backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
          }}
        />

        {/* Connections SVG */}
        <svg className="connections-svg">
          {mapper.connections.map(conn => {
            const fromNode = visibleNodes.find(n => n.id === conn.from_entity_id);
            const toNode = visibleNodes.find(n => n.id === conn.to_entity_id);
            if (!fromNode || !toNode) return null;

            const p1 = nodeCenter(fromNode);
            const p2 = nodeCenter(toNode);
            const isSeq = conn.connection_type === 'sequential';
            const isSelected = selectedConnection === conn.id;
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            return (
              <g key={conn.id}>
                <path
                  d={bezierPath(p1.x, p1.y, p2.x, p2.y)}
                  stroke="transparent" strokeWidth={16} fill="none"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); setSelectedConnection(conn.id); setSelectedNode(null); }}
                />
                <path
                  d={bezierPath(p1.x, p1.y, p2.x, p2.y)}
                  stroke={isSelected ? '#facc15' : isSeq ? '#0d9488' : '#6366f1'}
                  strokeWidth={isSelected ? 2.5 : 1.8}
                  fill="none"
                  strokeDasharray={isSeq ? 'none' : '6 4'}
                  opacity={isSelected ? 1 : 0.6}
                />
                {isSeq && (
                  <path
                    d={arrowHead(p2.x, p2.y, p1.x, p1.y)}
                    stroke={isSelected ? '#facc15' : '#0d9488'}
                    strokeWidth={2} fill="none" opacity={isSelected ? 1 : 0.7}
                  />
                )}
                <text
                  x={midX} y={midY - 6}
                  textAnchor="middle"
                  fill={isSelected ? '#facc15' : '#94a3b8'}
                  fontSize={11}
                  fontFamily="'IBM Plex Sans', sans-serif"
                  fontWeight={500}
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); setSelectedConnection(conn.id); setSelectedNode(null); }}
                >
                  {conn.label || (isSeq ? '->' : '<->')}
                </text>
              </g>
            );
          })}
          {connecting && connectPreview && (() => {
            const fromNode = mapper.nodes.find(n => n.id === connecting.id);
            if (!fromNode) return null;
            const p1 = nodeCenter(fromNode);
            return (
              <path
                d={bezierPath(p1.x, p1.y, connectPreview.x, connectPreview.y)}
                stroke={mode === 'sequential' ? '#0d9488' : '#6366f1'}
                strokeWidth={1.5} fill="none" opacity={0.5}
                strokeDasharray="4 4"
              />
            );
          })()}
        </svg>

        {/* Nodes */}
        {visibleNodes.map(node => {
          const config = ENTITY_CONFIGS[node.entityType];
          const isSelected = selectedNode === node.id;
          const shapeStyle = nodeShapeStyle(node.shape);

          return (
            <div
              key={node.id}
              className={`node ${isSelected ? 'node--selected' : ''} ${dragging === node.id ? 'node--dragging' : ''}`}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingLabel(node.id);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              style={{
                left: node.x * zoom + pan.x,
                top: node.y * zoom + pan.y,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                background: `linear-gradient(135deg, ${node.color}dd, ${node.color}88)`,
                border: isSelected ? '2px solid #facc15' : `2px solid ${node.color}`,
                boxShadow: isSelected
                  ? `0 0 20px ${node.color}55, 0 4px 20px rgba(0,0,0,0.4)`
                  : `0 4px 16px rgba(0,0,0,0.3)`,
                ...shapeStyle,
              }}
            >
              {/* Entity type badge */}
              <span className="node-badge" style={{ background: `${node.color}cc` }}>
                {config.icon}
              </span>

              {/* Label */}
              {editingLabel === node.id ? (
                <input
                  ref={inputRef}
                  className="node-input"
                  defaultValue={node.label}
                  onBlur={(e) => {
                    const val = e.target.value.trim() || node.label;
                    mapper.updateEntityData(node.id, node.entityType, {
                      [config.labelField]: val,
                    });
                    setEditingLabel(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') setEditingLabel(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="node-label">{node.label}</span>
              )}

              {/* Type label */}
              <span className="node-type">{config.label}</span>

              {/* Connect port */}
              <div
                className="node-port"
                onMouseDown={(e) => handleStartConnect(e, node)}
                style={{
                  background: mode === 'sequential' ? '#0d9488' : '#6366f1',
                }}
              />
            </div>
          );
        })}

        {/* Context / Add Menu */}
        {contextMenu && (
          <AddNodeMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onAdd={async (entityType, label) => {
              const x = (contextMenu.x - pan.x) / zoom;
              const y = (contextMenu.y - pan.y) / zoom;
              await mapper.addNode(entityType, label, x, y);
              setContextMenu(null);
            }}
            onClose={() => setContextMenu(null)}
          />
        )}

        {/* Empty state */}
        {mapper.nodes.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">[]</div>
            <div className="empty-title">SPL Lab Mapper</div>
            <div className="empty-sub">Double-click or right-click to add your first entity</div>
            {!mapper.isSupabaseConfigured && (
              <div className="empty-hint">
                Running in local mode. Add your Supabase credentials in .env to enable persistence.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedNodeData && (
        <DetailPanel
          node={selectedNodeData}
          allNodes={mapper.nodes}
          connections={mapper.connections.filter(c =>
            c.from_entity_id === selectedNodeData.id || c.to_entity_id === selectedNodeData.id
          )}
          onClose={() => setSelectedNode(null)}
          onDelete={() => { mapper.deleteNode(selectedNodeData.id); setSelectedNode(null); }}
          onUpdateColor={(color) => mapper.updateNodeColor(selectedNodeData.id, color)}
          onUpdateData={(updates) => mapper.updateEntityData(selectedNodeData.id, selectedNodeData.entityType, updates)}
          onSelectNode={(id) => setSelectedNode(id)}
          onDeleteConnection={(id) => mapper.deleteConnection(id)}
        />
      )}

      {/* Connection panel */}
      {selectedConnData && (
        <div className="conn-panel">
          <div className="conn-panel-title">Connection</div>
          <div className="conn-panel-nodes">
            <span className="conn-node-name">{mapper.nodes.find(n => n.id === selectedConnData.from_entity_id)?.label}</span>
            <span className={`conn-arrow ${selectedConnData.connection_type}`}>
              {selectedConnData.connection_type === 'sequential' ? ' -> ' : ' <-> '}
            </span>
            <span className="conn-node-name">{mapper.nodes.find(n => n.id === selectedConnData.to_entity_id)?.label}</span>
          </div>
          <div className="field-group">
            <label className="field-label">Label</label>
            <input
              className="field-input"
              value={connectionLabelDraft}
              onChange={(e) => setConnectionLabelDraft(e.target.value)}
              onBlur={() => mapper.updateConnectionLabel(selectedConnData.id, connectionLabelDraft.trim())}
              placeholder="Describe this connection..."
            />
          </div>
          <div className="conn-panel-actions">
            <button className="btn btn--danger" onClick={() => { mapper.deleteConnection(selectedConnData.id); setSelectedConnection(null); }}>
              Delete
            </button>
            <button className="btn" onClick={() => setSelectedConnection(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
