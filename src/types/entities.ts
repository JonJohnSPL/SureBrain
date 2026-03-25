// ============================================================
// SPL Lab Mapper — Type Definitions
// ============================================================

// ── Entity Types ──
export type EntityType =
  | 'client'
  | 'client_project'
  | 'sample_site'
  | 'sample_technician'
  | 'lab_facility'
  | 'sample'
  | 'instrument'
  | 'test_method'
  | 'result';

export type ConnectionMode = 'sequential' | 'associative';

// ── Enums ──
export type ClientStatus = 'new_prospect' | 'onboarding' | 'active' | 'inactive' | 'churned';
export type ContractType = 'spot' | 'contract' | 'blanket_po';
export type IndustrySector = 'upstream' | 'midstream' | 'downstream' | 'pipeline' | 'utility' | 'other';
export type ProjectStatus = 'pending' | 'active' | 'on_hold' | 'completed' | 'archived';
export type SiteType = 'wellhead' | 'pipeline' | 'plant_inlet' | 'plant_outlet' | 'meter_station' | 'storage' | 'other';
export type TechAffiliation = 'spl_internal' | 'client_field_tech' | 'third_party_contractor';
export type SampleType = 'gas' | 'liquid' | 'lpg' | 'ngl' | 'condensate' | 'water';
export type ContainerType = 'cylinder' | 'spot_bottle' | 'piston_cylinder' | 'bag' | 'other';
export type SampleStatus = 'received' | 'in_queue' | 'in_progress' | 'reviewed' | 'reported' | 'archived';
export type SamplePriority = 'standard' | 'rush' | 'hold';
export type InstrumentType = 'benchtop_gc' | 'micro_gc' | 'cryoscope' | 'density_meter' | 'other';
export type InstrumentStatus = 'operational' | 'maintenance' | 'calibrating' | 'down' | 'retired';
export type DetectorType = 'tcd' | 'fid' | 'tcd_fid' | 'other' | 'none';
export type CarbonRange = 'c6_gas' | 'c10_gas' | 'c6_liq';
export type ReviewStatus = 'pending_review' | 'reviewed' | 'flagged' | 'approved';
export type ReportStatus = 'draft' | 'sent' | 'revised' | 'final';

// ── Base canvas properties shared by all entities ──
export interface CanvasEntity {
  id: string;
  canvas_x: number;
  canvas_y: number;
  canvas_color: string;
  notes?: string;
  linked_docs?: string[];
  created_at?: string;
  updated_at?: string;
}

// ── Entity Interfaces ──
export interface Client extends CanvasEntity {
  _type: 'client';
  company_name: string;
  client_status: ClientStatus;
  surechem_id?: string;
  primary_contact?: Record<string, string>;
  billing_contact?: Record<string, string>;
  contract_type?: ContractType;
  payment_terms?: string;
  industry_sector?: IndustrySector;
  region?: string;
  special_requirements?: string;
  onboard_date?: string;
}

export interface ClientProject extends CanvasEntity {
  _type: 'client_project';
  project_name: string;
  client_id: string;
  project_status: ProjectStatus;
  project_manager?: string;
  spl_account_rep?: string;
  scope_of_work?: string;
  test_methods_required?: string[];
  expected_sample_volume?: number;
  turnaround_sla?: string;
  reporting_format?: string;
  start_date?: string;
  end_date?: string;
  surechem_project_ref?: string;
}

export interface SampleSite extends CanvasEntity {
  _type: 'sample_site';
  site_name: string;
  project_id: string;
  site_type?: SiteType;
  gps_lat?: number;
  gps_lng?: number;
  state?: string;
  county_basin?: string;
  sample_point_description?: string;
  expected_composition?: string;
  h2s_expected?: boolean;
  sampling_frequency?: string;
  active?: boolean;
}

export interface SampleTechnician extends CanvasEntity {
  _type: 'sample_technician';
  tech_name: string;
  company_affiliation?: TechAffiliation;
  certifications?: string[];
  contact_info?: Record<string, string>;
  active?: boolean;
}

export interface LabFacility extends CanvasEntity {
  _type: 'lab_facility';
  lab_name: string;
  lab_code: string;
  address?: Record<string, string>;
  lab_director?: string;
  lab_manager?: string;
  capabilities?: string[];
  certifications?: string[];
  operating_hours?: string;
}

export interface Sample extends CanvasEntity {
  _type: 'sample';
  lab_sample_id?: string;
  client_sample_id?: string;
  site_id?: string;
  collected_by?: string;
  lab_id?: string;
  collection_date?: string;
  received_date?: string;
  sample_type?: SampleType;
  container_type?: ContainerType;
  pressure_psi?: number;
  temperature_f?: number;
  requested_tests?: string[];
  sample_status?: SampleStatus;
  priority?: SamplePriority;
  coc_document?: string;
  coc_notes?: string;
}

export interface Instrument extends CanvasEntity {
  _type: 'instrument';
  instrument_name: string;
  internal_id: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  instrument_type: InstrumentType;
  lab_id: string;
  status?: InstrumentStatus;
  last_calibration?: string;
  next_calibration_due?: string;
  maintenance_log?: Record<string, unknown>[];
  column_config?: string;
  detector_type?: DetectorType;
  software_version?: string;
  supply_consumables?: Record<string, unknown>[];
}

export interface TestMethod extends CanvasEntity {
  _type: 'test_method';
  method_id: string;
  method_name: string;
  carbon_range: CarbonRange;
  sample_types_supported?: string[];
  run_time_minutes?: number;
  calibration_standard?: string;
  duplicate_tolerance?: number;
  reporting_precision?: string;
  qc_protocol?: string;
  revision_year?: number;
}

export interface Result extends CanvasEntity {
  _type: 'result';
  sample_id: string;
  method_id?: string;
  instrument_id?: string;
  run_datetime?: string;
  analyst?: string;
  raw_data_file?: string;
  duplicate_check?: Record<string, unknown>;
  review_status?: ReviewStatus;
  reviewed_by?: string;
  review_notes?: string;
  report_status?: ReportStatus;
  report_sent_date?: string;
  report_format?: string;
}

// ── Union type for any entity on the canvas ──
export type AnyEntity =
  | Client
  | ClientProject
  | SampleSite
  | SampleTechnician
  | LabFacility
  | Sample
  | Instrument
  | TestMethod
  | Result;

// ── Connection ──
export interface Connection {
  id: string;
  from_entity_type: EntityType;
  from_entity_id: string;
  to_entity_type: EntityType;
  to_entity_id: string;
  connection_type: ConnectionMode;
  label?: string;
}

// ── Canvas View ──
export interface CanvasView {
  id: string;
  view_name: string;
  description?: string;
  pan_x: number;
  pan_y: number;
  zoom: number;
  filters?: Record<string, unknown>;
}

// ── Node on canvas (generic wrapper) ──
export interface CanvasNode {
  id: string;
  entityType: EntityType;
  label: string;
  x: number;
  y: number;
  color: string;
  shape: NodeShape;
  data: AnyEntity;
}

export type NodeShape = 'rectangle' | 'diamond' | 'hexagon' | 'trapezoid' | 'parallelogram' | 'note' | 'process';

// ── Entity config ──
export interface EntityConfig {
  type: EntityType;
  label: string;
  tableName: string;
  labelField: string;
  defaultColor: string;
  shape: NodeShape;
  icon: string;
}

export const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
  client: {
    type: 'client',
    label: 'Client',
    tableName: 'clients',
    labelField: 'company_name',
    defaultColor: '#2D6A4F',
    shape: 'rectangle',
    icon: '◆',
  },
  client_project: {
    type: 'client_project',
    label: 'Project',
    tableName: 'client_projects',
    labelField: 'project_name',
    defaultColor: '#264653',
    shape: 'rectangle',
    icon: '◈',
  },
  sample_site: {
    type: 'sample_site',
    label: 'Site',
    tableName: 'sample_sites',
    labelField: 'site_name',
    defaultColor: '#6A040F',
    shape: 'rectangle',
    icon: '◉',
  },
  sample_technician: {
    type: 'sample_technician',
    label: 'Tech',
    tableName: 'sample_technicians',
    labelField: 'tech_name',
    defaultColor: '#7B2D8E',
    shape: 'rectangle',
    icon: '◎',
  },
  lab_facility: {
    type: 'lab_facility',
    label: 'Lab',
    tableName: 'lab_facilities',
    labelField: 'lab_name',
    defaultColor: '#1B4965',
    shape: 'process',
    icon: '⬡',
  },
  sample: {
    type: 'sample',
    label: 'Sample',
    tableName: 'samples',
    labelField: 'lab_sample_id',
    defaultColor: '#A4133C',
    shape: 'hexagon',
    icon: '⬢',
  },
  instrument: {
    type: 'instrument',
    label: 'Instrument',
    tableName: 'instruments',
    labelField: 'instrument_name',
    defaultColor: '#386641',
    shape: 'trapezoid',
    icon: '▲',
  },
  test_method: {
    type: 'test_method',
    label: 'Method',
    tableName: 'test_methods',
    labelField: 'method_name',
    defaultColor: '#5A189A',
    shape: 'diamond',
    icon: '◇',
  },
  result: {
    type: 'result',
    label: 'Result',
    tableName: 'results',
    labelField: 'id',
    defaultColor: '#0B525B',
    shape: 'rectangle',
    icon: '▣',
  },
};

// Helper to get display label from any entity
export function getEntityLabel(entity: AnyEntity): string {
  switch (entity._type) {
    case 'client': return entity.company_name;
    case 'client_project': return entity.project_name;
    case 'sample_site': return entity.site_name;
    case 'sample_technician': return entity.tech_name;
    case 'lab_facility': return entity.lab_name;
    case 'sample': return entity.lab_sample_id || entity.id.slice(0, 8);
    case 'instrument': return entity.instrument_name;
    case 'test_method': return entity.method_id;
    case 'result': return `Result ${entity.id.slice(0, 8)}`;
  }
}
