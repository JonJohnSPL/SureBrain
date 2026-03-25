import type { ConnectionMode, EntityType } from '../../types/entities';
import { ENTITY_CONFIGS } from '../../types/entities';

interface ToolbarProps {
  mode: ConnectionMode;
  onModeChange: (m: ConnectionMode) => void;
  nodeCount: number;
  connCount: number;
  visibleTypes: Set<EntityType>;
  onToggleType: (t: EntityType) => void;
  onExport: () => void;
  onShowHelp: () => void;
  isSupabaseConfigured: boolean;
  zoom: number;
  onZoomReset: () => void;
}

export function Toolbar({
  mode, onModeChange, nodeCount, connCount,
  visibleTypes, onToggleType, onExport, onShowHelp,
  isSupabaseConfigured, zoom, onZoomReset,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-brand">
          <span className="brand-icon">[]</span>
          SPL Lab Mapper
        </div>

        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'sequential' ? 'mode-btn--active mode-btn--seq' : ''}`}
            onClick={() => onModeChange('sequential')}
          >
            Seq
          </button>
          <button
            className={`mode-btn ${mode === 'associative' ? 'mode-btn--active mode-btn--assoc' : ''}`}
            onClick={() => onModeChange('associative')}
          >
            Assoc
          </button>
        </div>
      </div>

      <div className="toolbar-filters">
        {(Object.entries(ENTITY_CONFIGS) as [EntityType, typeof ENTITY_CONFIGS[EntityType]][]).map(([type, config]) => (
          <button
            key={type}
            className={`filter-chip ${visibleTypes.has(type) ? 'filter-chip--active' : ''}`}
            onClick={() => onToggleType(type)}
            style={{
              borderColor: visibleTypes.has(type) ? config.defaultColor : undefined,
              background: visibleTypes.has(type) ? `${config.defaultColor}22` : undefined,
            }}
          >
            <span className="filter-icon">{config.icon}</span>
            {config.label}
          </button>
        ))}
      </div>

      <div className="toolbar-right">
        <button className="btn" onClick={onZoomReset} title="Reset zoom">
          {Math.round(zoom * 100)}%
        </button>
        <button className="btn" onClick={onExport}>Export</button>
        <button className="btn btn--help" onClick={onShowHelp}>?</button>
        <span className="toolbar-stats">
          {nodeCount} nodes | {connCount} links
        </span>
        <span className={`status-dot ${isSupabaseConfigured ? 'status-dot--online' : 'status-dot--local'}`}
              title={isSupabaseConfigured ? 'Connected to Supabase' : 'Local mode'} />
      </div>
    </div>
  );
}
