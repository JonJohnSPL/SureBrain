import { useEffect, useState } from 'react';
import type { CanvasNode, Connection } from '../../types/entities';
import { ENTITY_CONFIGS } from '../../types/entities';

const NODE_COLORS = [
  '#2D6A4F', '#264653', '#6A040F', '#7B2D8E',
  '#1B4965', '#A4133C', '#386641', '#5A189A',
  '#0B525B', '#9D4EDD', '#3A0CA3', '#E85D04',
];

type FieldType = 'text' | 'number' | 'boolean' | 'select';

interface DetailPanelProps {
  node: CanvasNode;
  allNodes: CanvasNode[];
  connections: Connection[];
  hasChildren: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onDelete: () => void;
  onUpdateColor: (color: string) => void;
  onUpdateData: (updates: Record<string, unknown>) => void;
  onSelectNode: (id: string) => void;
  onDeleteConnection: (id: string) => void;
  onToggleCollapse: () => void;
}

interface FieldConfig {
  label: string;
  key: string;
  value: unknown;
  type?: FieldType;
}

export function DetailPanel({
  node, allNodes, connections,
  hasChildren, isCollapsed,
  onClose, onDelete, onUpdateColor, onUpdateData,
  onSelectNode, onDeleteConnection, onToggleCollapse,
}: DetailPanelProps) {
  const config = ENTITY_CONFIGS[node.entityType];
  const [draftValues, setDraftValues] = useState<Record<string, unknown>>(
    () => ({ ...(node.data as unknown as Record<string, unknown>) })
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setDraftValues({ ...(node.data as unknown as Record<string, unknown>) });
    setShowDeleteConfirm(false);
  }, [node]);

  const updateDraftValue = (key: string, value: unknown) => {
    setDraftValues(prev => ({ ...prev, [key]: value }));
  };

  const commitField = (key: string, type: FieldType = 'text') => {
    const rawValue = draftValues[key];

    if (type === 'boolean') {
      onUpdateData({ [key]: Boolean(rawValue) });
      return;
    }

    if (type === 'number') {
      if (rawValue === '' || rawValue === null || rawValue === undefined) {
        onUpdateData({ [key]: null });
        return;
      }

      const parsed = Number(rawValue);
      onUpdateData({ [key]: Number.isNaN(parsed) ? null : parsed });
      return;
    }

    const normalized = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
    onUpdateData({ [key]: normalized || null });
  };

  // Build entity-specific fields
  const renderFields = () => {
    const data = node.data as unknown as Record<string, unknown>;
    const fields: FieldConfig[] = [];

    switch (node.entityType) {
      case 'client':
        fields.push(
          { label: 'Status', key: 'client_status', value: data.client_status, type: 'select' },
          { label: 'SureChem ID', key: 'surechem_id', value: data.surechem_id },
          { label: 'Contract Type', key: 'contract_type', value: data.contract_type, type: 'select' },
          { label: 'Industry', key: 'industry_sector', value: data.industry_sector, type: 'select' },
          { label: 'Region', key: 'region', value: data.region },
          { label: 'Payment Terms', key: 'payment_terms', value: data.payment_terms },
        );
        break;
      case 'client_project':
        fields.push(
          { label: 'Status', key: 'project_status', value: data.project_status, type: 'select' },
          { label: 'Project Manager', key: 'project_manager', value: data.project_manager },
          { label: 'SPL Account Rep', key: 'spl_account_rep', value: data.spl_account_rep },
          { label: 'Turnaround SLA', key: 'turnaround_sla', value: data.turnaround_sla },
          { label: 'Expected Volume', key: 'expected_sample_volume', value: data.expected_sample_volume, type: 'number' },
        );
        break;
      case 'sample_site':
        fields.push(
          { label: 'Site Type', key: 'site_type', value: data.site_type, type: 'select' },
          { label: 'State', key: 'state', value: data.state },
          { label: 'County/Basin', key: 'county_basin', value: data.county_basin },
          { label: 'GPS Lat', key: 'gps_lat', value: data.gps_lat, type: 'number' },
          { label: 'GPS Lng', key: 'gps_lng', value: data.gps_lng, type: 'number' },
          { label: 'H2S Expected', key: 'h2s_expected', value: data.h2s_expected, type: 'boolean' },
          { label: 'Active', key: 'active', value: data.active, type: 'boolean' },
        );
        break;
      case 'sample_technician':
        fields.push(
          { label: 'Affiliation', key: 'company_affiliation', value: data.company_affiliation, type: 'select' },
          { label: 'Active', key: 'active', value: data.active, type: 'boolean' },
        );
        break;
      case 'lab_facility':
        fields.push(
          { label: 'Lab Code', key: 'lab_code', value: data.lab_code },
          { label: 'Director', key: 'lab_director', value: data.lab_director },
          { label: 'Manager', key: 'lab_manager', value: data.lab_manager },
          { label: 'Operating Hours', key: 'operating_hours', value: data.operating_hours },
        );
        break;
      case 'instrument':
        fields.push(
          { label: 'Internal ID', key: 'internal_id', value: data.internal_id },
          { label: 'Manufacturer', key: 'manufacturer', value: data.manufacturer },
          { label: 'Model', key: 'model', value: data.model },
          { label: 'Serial #', key: 'serial_number', value: data.serial_number },
          { label: 'Type', key: 'instrument_type', value: data.instrument_type, type: 'select' },
          { label: 'Status', key: 'status', value: data.status, type: 'select' },
          { label: 'Detector', key: 'detector_type', value: data.detector_type, type: 'select' },
          { label: 'Column Config', key: 'column_config', value: data.column_config },
          { label: 'Software Ver', key: 'software_version', value: data.software_version },
        );
        break;
      case 'test_method':
        fields.push(
          { label: 'Method ID', key: 'method_id', value: data.method_id },
          { label: 'Carbon Range', key: 'carbon_range', value: data.carbon_range, type: 'select' },
          { label: 'Run Time (min)', key: 'run_time_minutes', value: data.run_time_minutes, type: 'number' },
          { label: 'Dup Tolerance', key: 'duplicate_tolerance', value: data.duplicate_tolerance, type: 'number' },
          { label: 'Cal Standard', key: 'calibration_standard', value: data.calibration_standard },
          { label: 'Revision Year', key: 'revision_year', value: data.revision_year, type: 'number' },
        );
        break;
      case 'sample':
        fields.push(
          { label: 'Lab Sample ID', key: 'lab_sample_id', value: data.lab_sample_id },
          { label: 'Client Sample ID', key: 'client_sample_id', value: data.client_sample_id },
          { label: 'Sample Type', key: 'sample_type', value: data.sample_type, type: 'select' },
          { label: 'Status', key: 'sample_status', value: data.sample_status, type: 'select' },
          { label: 'Priority', key: 'priority', value: data.priority, type: 'select' },
          { label: 'Container', key: 'container_type', value: data.container_type, type: 'select' },
          { label: 'Pressure (PSI)', key: 'pressure_psi', value: data.pressure_psi, type: 'number' },
          { label: 'Temp (F)', key: 'temperature_f', value: data.temperature_f, type: 'number' },
        );
        break;
      case 'result':
        fields.push(
          { label: 'Analyst', key: 'analyst', value: data.analyst },
          { label: 'Review Status', key: 'review_status', value: data.review_status, type: 'select' },
          { label: 'Reviewed By', key: 'reviewed_by', value: data.reviewed_by },
          { label: 'Report Status', key: 'report_status', value: data.report_status, type: 'select' },
          { label: 'Report Format', key: 'report_format', value: data.report_format },
        );
        break;
    }

    return fields.map(field => (
      <div className="field-group" key={field.key}>
        <label className="field-label">{field.label}</label>
        {field.type === 'boolean' ? (
          <label className="field-toggle">
            <input
              type="checkbox"
              checked={Boolean(draftValues[field.key])}
              onChange={(e) => {
                updateDraftValue(field.key, e.target.checked);
                onUpdateData({ [field.key]: e.target.checked });
              }}
            />
            <span>{draftValues[field.key] ? 'Yes' : 'No'}</span>
          </label>
        ) : (
          <input
            className="field-input"
            value={(draftValues[field.key] as string | number | null | undefined) ?? ''}
            onChange={(e) => updateDraftValue(field.key, e.target.value)}
            onBlur={() => commitField(field.key, field.type)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        )}
      </div>
    ));
  };

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          <span className="detail-badge" style={{ background: node.color }}>{config.icon}</span>
          <span className="detail-title">{node.label}</span>
        </div>
        <button className="btn btn--close" onClick={onClose}>x</button>
      </div>

      <div className="detail-type">{config.label}</div>

      {/* Color picker */}
      <div className="field-group">
        <label className="field-label">Color</label>
        <div className="color-grid">
          {NODE_COLORS.map(c => (
            <div
              key={c}
              className={`color-swatch ${node.color === c ? 'color-swatch--active' : ''}`}
              style={{ background: c }}
              onClick={() => onUpdateColor(c)}
            />
          ))}
        </div>
      </div>

      {/* Entity-specific fields */}
      {renderFields()}

      {hasChildren && (
        <div className="field-group">
          <label className="field-label">Children</label>
          <button className="btn" onClick={onToggleCollapse}>
            {isCollapsed ? 'Expand children' : 'Collapse children'}
          </button>
        </div>
      )}

      {/* Notes */}
      <div className="field-group">
        <label className="field-label">Notes</label>
        <textarea
          className="field-textarea"
          value={(draftValues.notes as string | undefined) || ''}
          onChange={(e) => updateDraftValue('notes', e.target.value)}
          onBlur={() => commitField('notes')}
          placeholder="Add notes..."
        />
      </div>

      {/* Connections */}
      <div className="field-group">
        <label className="field-label">Connections ({connections.length})</label>
        {connections.map(conn => {
          const otherId = conn.from_entity_id === node.id ? conn.to_entity_id : conn.from_entity_id;
          const other = allNodes.find(n => n.id === otherId);
          if (!other) return null;
          const isSeq = conn.connection_type === 'sequential';
          return (
            <div key={conn.id} className="connection-row">
              <span className={`conn-type-icon ${isSeq ? 'seq' : 'assoc'}`}>
                {isSeq ? '->' : '<->'}
              </span>
              <span className="conn-other-label" onClick={() => onSelectNode(other.id)}>
                {other.label}
              </span>
              {conn.label && <span className="conn-label-text">({conn.label})</span>}
              <button className="conn-delete" onClick={() => onDeleteConnection(conn.id)}>x</button>
            </div>
          );
        })}
        {connections.length === 0 && (
          <div className="conn-empty">No connections. Drag from a port to connect.</div>
        )}
      </div>

      {/* Delete */}
      <div className="detail-footer">
        {showDeleteConfirm ? (
          <div className="delete-confirm">
            <span>Delete this {config.label.toLowerCase()}?</span>
            <button className="btn btn--danger" onClick={onDelete}>Yes, Delete</button>
            <button className="btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn btn--danger-outline" onClick={() => setShowDeleteConfirm(true)}>
            Delete {config.label}
          </button>
        )}
      </div>
    </div>
  );
}
