import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  ENTITY_CONFIGS as ENTITY_CONFIGS_OBJ,
  getEntityLabel as getEntityLabelFn,
} from '../types/entities';
import type { AnyEntity, EntityType, Connection, CanvasNode } from '../types/entities';

// Re-export for convenience
export { ENTITY_CONFIGS, getEntityLabel } from '../types/entities';

// ── Local storage fallback when Supabase isn't configured ──
const LOCAL_KEY = 'spl-lab-mapper-local';

function loadLocal(): { nodes: CanvasNode[]; connections: Connection[] } {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { nodes: [], connections: [] };
}

function saveLocal(data: { nodes: CanvasNode[]; connections: Connection[] }) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

// ── Hook ──
export function useLabMapper() {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Load all data ──
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      const local = loadLocal();
      setNodes(local.nodes);
      setConnections(local.connections);
      setLoading(false);
      return;
    }

    try {
      const allNodes: CanvasNode[] = [];

      for (const [entityType, config] of Object.entries(ENTITY_CONFIGS_OBJ)) {
        const { data, error: fetchError } = await supabase
          .from(config.tableName)
          .select('*');

        if (fetchError) {
          console.error(`Error fetching ${config.tableName}:`, fetchError);
          continue;
        }

        if (data) {
          for (const row of data) {
            const entity = { ...row, _type: entityType } as AnyEntity;
            allNodes.push({
              id: row.id,
              entityType: entityType as EntityType,
              label: getEntityLabelFn(entity),
              x: row.canvas_x || 0,
              y: row.canvas_y || 0,
              color: row.canvas_color || config.defaultColor,
              shape: config.shape,
              data: entity,
            });
          }
        }
      }

      const { data: connData, error: connError } = await supabase.from('connections').select('*');

      if (connError) {
        console.error('Error fetching connections:', connError);
      }

      setNodes(allNodes);
      setConnections(connData || []);

      if (connError) {
        setError(connError.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Persist to local when not using Supabase ──
  useEffect(() => {
    if (!isSupabaseConfigured && !loading) {
      saveLocal({ nodes, connections });
    }
  }, [nodes, connections, loading]);

  // ── Update node position ──
  const setNodePositionLocal = useCallback((id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  }, []);

  const updateNodePosition = useCallback(async (id: string, x: number, y: number) => {
    setNodePositionLocal(id, x, y);
    if (isSupabaseConfigured) {
      const node = nodes.find(n => n.id === id);
      if (!node) return;
      const config = ENTITY_CONFIGS_OBJ[node.entityType];
      await supabase
        .from(config.tableName)
        .update({ canvas_x: x, canvas_y: y })
        .eq('id', id);
    }
  }, [isSupabaseConfigured, nodes, setNodePositionLocal]);

  const updateManyNodePositions = useCallback(async (positions: Array<{ id: string; x: number; y: number }>) => {
    if (positions.length === 0) return;

    const positionMap = new Map(positions.map(position => [position.id, position]));

    setNodes(prev => prev.map(node => {
      const nextPosition = positionMap.get(node.id);
      return nextPosition ? { ...node, x: nextPosition.x, y: nextPosition.y } : node;
    }));

    if (isSupabaseConfigured) {
      await Promise.all(positions.map(async ({ id, x, y }) => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        const config = ENTITY_CONFIGS_OBJ[node.entityType];
        await supabase
          .from(config.tableName)
          .update({ canvas_x: x, canvas_y: y })
          .eq('id', id);
      }));
    }
  }, [isSupabaseConfigured, nodes]);

  // ── Update node color ──
  const updateNodeColor = useCallback(async (id: string, color: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, color } : n));

    if (isSupabaseConfigured) {
      const node = nodes.find(n => n.id === id);
      if (!node) return;
      const config = ENTITY_CONFIGS_OBJ[node.entityType];
      await supabase
        .from(config.tableName)
        .update({ canvas_color: color })
        .eq('id', id);
    }
  }, [nodes]);

  // ── Add a new entity ──
  const addNode = useCallback(async (
    entityType: EntityType,
    label: string,
    x: number,
    y: number,
    extraData?: Record<string, unknown>
  ) => {
    const configs = ENTITY_CONFIGS_OBJ;
    const getLabel = getEntityLabelFn;
    const config = configs[entityType];
    const id = crypto.randomUUID();

    const baseRecord: Record<string, unknown> = {
      id,
      [config.labelField]: label,
      canvas_x: x,
      canvas_y: y,
      canvas_color: config.defaultColor,
      ...extraData,
    };

    if (isSupabaseConfigured) {
      const { error: insertError } = await supabase
        .from(config.tableName)
        .insert(baseRecord);

      if (insertError) {
        setError(insertError.message);
        return null;
      }
    }

    const entity = { ...baseRecord, _type: entityType } as AnyEntity;
    const newNode: CanvasNode = {
      id,
      entityType,
      label,
      x, y,
      color: config.defaultColor,
      shape: config.shape,
      data: entity,
    };

    setNodes(prev => [...prev, newNode]);
    return newNode;
  }, []);

  // ── Delete a node ──
  const deleteNode = useCallback(async (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    if (isSupabaseConfigured) {
      const config = ENTITY_CONFIGS_OBJ[node.entityType];
      await supabase.from(config.tableName).delete().eq('id', id);
      await supabase.from('connections')
        .delete()
        .or(`from_entity_id.eq.${id},to_entity_id.eq.${id}`);
    }

    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c =>
      c.from_entity_id !== id && c.to_entity_id !== id
    ));
  }, [nodes]);

  // ── Add connection ──
  const addConnection = useCallback(async (
    fromType: EntityType, fromId: string,
    toType: EntityType, toId: string,
    connType: 'sequential' | 'associative',
    label?: string
  ) => {
    if (fromId === toId) return null;

    // Check for existing
    const exists = connections.find(c =>
      c.from_entity_id === fromId && c.to_entity_id === toId &&
      c.from_entity_type === fromType && c.to_entity_type === toType &&
      c.connection_type === connType
    );
    if (exists) return null;

    const id = crypto.randomUUID();
    const conn: Connection = {
      id,
      from_entity_type: fromType,
      from_entity_id: fromId,
      to_entity_type: toType,
      to_entity_id: toId,
      connection_type: connType,
      label,
    };

    if (isSupabaseConfigured) {
      const { error: insertError } = await supabase
        .from('connections')
        .insert(conn);

      if (insertError) {
        setError(insertError.message);
        return null;
      }
    }

    setConnections(prev => [...prev, conn]);
    return conn;
  }, [connections]);

  // ── Delete connection ──
  const deleteConnection = useCallback(async (id: string) => {
    if (isSupabaseConfigured) {
      await supabase.from('connections').delete().eq('id', id);
    }
    setConnections(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── Update connection label ──
  const updateConnectionLabel = useCallback(async (id: string, label: string) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, label } : c));
    if (isSupabaseConfigured) {
      await supabase.from('connections').update({ label }).eq('id', id);
    }
  }, []);

  // ── Update entity data ──
  const updateEntityData = useCallback(async (
    id: string,
    entityType: EntityType,
    updates: Record<string, unknown>
  ) => {
    if (isSupabaseConfigured) {
      const config = ENTITY_CONFIGS_OBJ[entityType];
      await supabase.from(config.tableName).update(updates).eq('id', id);
    }

    setNodes(prev => prev.map(n => {
      if (n.id !== id) return n;
      const newData = { ...n.data, ...updates } as AnyEntity;
      const getLabel = getEntityLabelFn;
      return {
        ...n,
        data: newData,
        label: getLabel(newData),
      };
    }));
  }, []);

  // ── Export all data as JSON ──
  const exportJSON = useCallback(() => {
    const exportData = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      nodes: nodes.map(n => ({
        ...n,
        data: { ...n.data },
      })),
      connections,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spl-lab-map-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, connections]);

  return {
    nodes, connections,
    loading, error,
    loadAll,
    addNode, deleteNode,
    setNodePositionLocal, updateNodePosition, updateManyNodePositions, updateNodeColor,
    addConnection, deleteConnection, updateConnectionLabel,
    updateEntityData,
    exportJSON,
    isSupabaseConfigured,
  };
}
