import { useState } from 'react';
import type { EntityType } from '../../types/entities';
import { ENTITY_CONFIGS } from '../../types/entities';

interface AddNodeMenuProps {
  x: number;
  y: number;
  onAdd: (entityType: EntityType, label: string) => void;
  onClose: () => void;
}

export function AddNodeMenu({ x, y, onAdd, onClose }: AddNodeMenuProps) {
  const [selected, setSelected] = useState<EntityType | null>(null);
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    if (!selected || !label.trim()) return;
    onAdd(selected, label.trim());
  };

  return (
    <>
      <div className="menu-backdrop" onClick={onClose} />
      <div className="add-menu" style={{ left: x, top: y }}>
        <div className="add-menu-title">Add Entity</div>

        {!selected ? (
          <div className="add-menu-grid">
            {(Object.entries(ENTITY_CONFIGS) as [EntityType, typeof ENTITY_CONFIGS[EntityType]][]).map(([type, config]) => (
              <button
                key={type}
                className="add-menu-item"
                onClick={() => { setSelected(type); setLabel(''); }}
                style={{ borderLeft: `3px solid ${config.defaultColor}` }}
              >
                <span className="add-menu-icon">{config.icon}</span>
                <span>{config.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="add-menu-input-area">
            <div className="add-menu-selected">
              {ENTITY_CONFIGS[selected].icon} {ENTITY_CONFIGS[selected].label}
            </div>
            <input
              autoFocus
              className="field-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onClose(); }}
              placeholder={`Name this ${ENTITY_CONFIGS[selected].label.toLowerCase()}...`}
            />
            <div className="add-menu-actions">
              <button className="btn" onClick={() => setSelected(null)}>← Back</button>
              <button className="btn btn--primary" onClick={handleAdd} disabled={!label.trim()}>
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
