-- ============================================================
-- SPL Lab Mapper — Full Database Schema
-- Supabase PostgreSQL Migration
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. CLIENTS
-- ============================================================
create type client_status as enum (
  'new_prospect', 'onboarding', 'active', 'inactive', 'churned'
);
create type contract_type as enum (
  'spot', 'contract', 'blanket_po'
);
create type industry_sector as enum (
  'upstream', 'midstream', 'downstream', 'pipeline', 'utility', 'other'
);

create table clients (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  client_status client_status not null default 'new_prospect',
  surechem_id text,
  primary_contact jsonb default '{}',
  billing_contact jsonb default '{}',
  contract_type contract_type,
  payment_terms text,
  industry_sector industry_sector,
  region text,
  special_requirements text,
  onboard_date date,
  linked_docs text[] default '{}',
  notes text,
  -- canvas positioning
  canvas_x float default 0,
  canvas_y float default 0,
  canvas_color text default '#2D6A4F',
  -- timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. CLIENT PROJECTS
-- ============================================================
create type project_status as enum (
  'pending', 'active', 'on_hold', 'completed', 'archived'
);
create type reporting_format as enum (
  'standard', 'custom_template', 'api_feed'
);

create table client_projects (
  id uuid primary key default uuid_generate_v4(),
  project_name text not null,
  client_id uuid not null references clients(id) on delete cascade,
  project_status project_status not null default 'pending',
  project_manager text,
  spl_account_rep text,
  scope_of_work text,
  test_methods_required text[] default '{}',
  expected_sample_volume int,
  turnaround_sla text,
  reporting_format reporting_format default 'standard',
  start_date date,
  end_date date,
  surechem_project_ref text,
  linked_docs text[] default '{}',
  notes text,
  canvas_x float default 0,
  canvas_y float default 0,
  canvas_color text default '#264653',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 3. SAMPLE SITES
-- ============================================================
create type site_type as enum (
  'wellhead', 'pipeline', 'plant_inlet', 'plant_outlet',
  'meter_station', 'storage', 'other'
);

create table sample_sites (
  id uuid primary key default uuid_generate_v4(),
  site_name text not null,
  project_id uuid not null references client_projects(id) on delete cascade,
  site_type site_type default 'other',
  gps_lat float,
  gps_lng float,
  state text,
  county_basin text,
  sample_point_description text,
  expected_composition text,
  h2s_expected boolean default false,
  sampling_frequency text,
  active boolean default true,
  linked_docs text[] default '{}',
  notes text,
  canvas_x float default 0,
  canvas_y float default 0,
  canvas_color text default '#6A040F',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 4. SAMPLE TECHNICIANS
-- ============================================================
create type tech_affiliation as enum (
  'spl_internal', 'client_field_tech', 'third_party_contractor'
);

create table sample_technicians (
  id uuid primary key default uuid_generate_v4(),
  tech_name text not null,
  company_affiliation tech_affiliation default 'spl_internal',
  certifications text[] default '{}',
  contact_info jsonb default '{}',
  active boolean default true,
  linked_docs text[] default '{}',
  notes text,
  canvas_x float default 0,
  canvas_y float default 0,
  canvas_color text default '#7B2D8E',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Junction: techs <-> sites
create table tech_site_assignments (
  tech_id uuid not null references sample_technicians(id) on delete cascade,
  site_id uuid not null references sample_sites(id) on delete cascade,
  primary key (tech_id, site_id)
);

-- ============================================================
-- 5. LAB FACILITIES
-- ============================================================
create table lab_facilities (
  id uuid primary key default uuid_generate_v4(),
  lab_name text not null,
  lab_code text not null unique,
  address jsonb default '{}',
  lab_director text,
  lab_manager text,
  capabilities text[] default '{}',
  certifications text[] default '{}',
  operating_hours text,
  linked_docs text[] default '{}',
  notes text,
  canvas_x float default 0,
  canvas_y float default 0,
  canvas_color text default '#1B4965',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 6. SAMPLES
-- ============================================================
create type sample_type as enum (
  'gas', 'liquid', 'lpg', 'ngl', 'condensate', 'water'
);
create type container_type as enum (
  'cylinder', 'spot_bottle', 'piston_cylinder', 'bag', 'other'
);
create type sample_status as enum (
  'received', 'in_queue', 'in_progress', 'reviewed', 'reported', 'archived'
);
create type sample_priority as enum (
  'standard', 'rush', 'hold'
);

create table samples (
  id uuid primary key default uuid_generate_v4(),
  lab_sample_id text, -- internal lab number
  client_sample_id text,
  site_id uuid references sample_sites(id) on delete set null,
  collected_by uuid references sample_technicians(id) on delete set null,
  lab_id uuid references lab_facilities(id) on delete set null,
  collection_date timestamptz,
  received_date timestamptz,
  sample_type sample_type,
  container_type container_type,
  pressure_psi float,
  temperature_f float,
  requested_tests text[] default '{}',
  sample_status sample_status default 'received',
  priority sample_priority default 'standard',
  coc_document text, -- URL
  coc_notes text,
  linked_docs text[] default '{}',
  notes text,
  canvas_x float default 0,
  canvas_y float default 0,
  canvas_color text default '#A4133C',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 7. INSTRUMENTS
-- ============================================================
create type instrument_type as enum (
  'benchtop_gc', 'micro_gc', 'cryoscope', 'density_meter', 'other'
);
create type instrument_status as enum (
  'operational', 'maintenance', 'calibrating', 'down', 'retired'
);
create type detector_type as enum (
  'tcd', 'fid', 'tcd_fid', 'other', 'none'
);

create table instruments (
  id uuid primary key default uuid_generate_v4(),
  instrument_name text not null,
  internal_id text not null unique, -- System 1, 1510-GC2, 990, etc.
  manufacturer text,
  model text,
  serial_number text,
  instrument_type instrument_type not null,
  lab_id uuid not null references lab_facilities(id) on delete cascade,
  status instrument_status default 'operational',
  last_calibration timestamptz,
  next_calibration_due timestamptz,
  maintenance_log jsonb default '[]',
  column_config text,
  detector_type detector_type default 'none',
  software_version text,
  supply_consumables jsonb default '[]',
  linked_docs text[] default '{}',
  notes text,
  canvas_x float default 0,
  canvas_y float default 0,
  canvas_color text default '#386641',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 8. TEST METHODS
-- ============================================================
create type carbon_range as enum (
  'c6_gas', 'c10_gas', 'c6_liq'
);

create table test_methods (
  id uuid primary key default uuid_generate_v4(),
  method_id text not null unique, -- GPA 2261, GPA 2286, etc.
  method_name text not null,
  carbon_range carbon_range not null,
  sample_types_supported text[] default '{}',
  run_time_minutes int,
  calibration_standard text,
  duplicate_tolerance float default 0.4,
  reporting_precision text,
  qc_protocol text,
  revision_year int,
  linked_docs text[] default '{}',
  notes text,
  canvas_x float default 0,
  canvas_y float default 0,
  canvas_color text default '#5A189A',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Junction: methods <-> instruments (many-to-many)
create table method_instrument_compat (
  method_id uuid not null references test_methods(id) on delete cascade,
  instrument_id uuid not null references instruments(id) on delete cascade,
  is_primary boolean default true,
  notes text,
  primary key (method_id, instrument_id)
);

-- ============================================================
-- 9. RESULTS (Review + Report)
-- ============================================================
create type review_status as enum (
  'pending_review', 'reviewed', 'flagged', 'approved'
);
create type report_status as enum (
  'draft', 'sent', 'revised', 'final'
);

create table results (
  id uuid primary key default uuid_generate_v4(),
  sample_id uuid not null references samples(id) on delete cascade,
  method_id uuid references test_methods(id) on delete set null,
  instrument_id uuid references instruments(id) on delete set null,
  run_datetime timestamptz,
  analyst text,
  raw_data_file text,
  duplicate_check jsonb default '{}',
  review_status review_status default 'pending_review',
  reviewed_by text,
  review_notes text,
  report_status report_status default 'draft',
  report_sent_date timestamptz,
  report_format text,
  linked_docs text[] default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 10. GENERIC CONNECTIONS (for concept mapper canvas)
-- ============================================================
create type connection_type as enum (
  'sequential', 'associative'
);

create table connections (
  id uuid primary key default uuid_generate_v4(),
  from_entity_type text not null, -- 'client', 'project', 'site', etc.
  from_entity_id uuid not null,
  to_entity_type text not null,
  to_entity_id uuid not null,
  connection_type connection_type not null default 'associative',
  label text,
  created_at timestamptz default now(),
  unique(from_entity_type, from_entity_id, to_entity_type, to_entity_id, connection_type)
);

-- ============================================================
-- 11. SAVED VIEWS / CANVAS STATE
-- ============================================================
create table canvas_views (
  id uuid primary key default uuid_generate_v4(),
  view_name text not null,
  description text,
  pan_x float default 0,
  pan_y float default 0,
  zoom float default 1,
  filters jsonb default '{}', -- which entity types are visible, etc.
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_projects_client on client_projects(client_id);
create index idx_sites_project on sample_sites(project_id);
create index idx_samples_site on samples(site_id);
create index idx_samples_lab on samples(lab_id);
create index idx_samples_status on samples(sample_status);
create index idx_instruments_lab on instruments(lab_id);
create index idx_results_sample on results(sample_id);
create index idx_connections_from on connections(from_entity_type, from_entity_id);
create index idx_connections_to on connections(to_entity_type, to_entity_id);

-- ============================================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_clients_updated before update on clients for each row execute function update_updated_at();
create trigger trg_projects_updated before update on client_projects for each row execute function update_updated_at();
create trigger trg_sites_updated before update on sample_sites for each row execute function update_updated_at();
create trigger trg_techs_updated before update on sample_technicians for each row execute function update_updated_at();
create trigger trg_labs_updated before update on lab_facilities for each row execute function update_updated_at();
create trigger trg_samples_updated before update on samples for each row execute function update_updated_at();
create trigger trg_instruments_updated before update on instruments for each row execute function update_updated_at();
create trigger trg_methods_updated before update on test_methods for each row execute function update_updated_at();
create trigger trg_results_updated before update on results for each row execute function update_updated_at();
create trigger trg_views_updated before update on canvas_views for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (basic — expand with auth later)
-- ============================================================
alter table clients enable row level security;
alter table client_projects enable row level security;
alter table sample_sites enable row level security;
alter table sample_technicians enable row level security;
alter table lab_facilities enable row level security;
alter table samples enable row level security;
alter table instruments enable row level security;
alter table test_methods enable row level security;
alter table results enable row level security;
alter table connections enable row level security;
alter table canvas_views enable row level security;

-- Permissive policies (authenticated users can do everything for now)
-- You can tighten these later with role-based access
create policy "Authenticated full access" on clients for all using (true) with check (true);
create policy "Authenticated full access" on client_projects for all using (true) with check (true);
create policy "Authenticated full access" on sample_sites for all using (true) with check (true);
create policy "Authenticated full access" on sample_technicians for all using (true) with check (true);
create policy "Authenticated full access" on lab_facilities for all using (true) with check (true);
create policy "Authenticated full access" on samples for all using (true) with check (true);
create policy "Authenticated full access" on instruments for all using (true) with check (true);
create policy "Authenticated full access" on test_methods for all using (true) with check (true);
create policy "Authenticated full access" on results for all using (true) with check (true);
create policy "Authenticated full access" on connections for all using (true) with check (true);
create policy "Authenticated full access" on canvas_views for all using (true) with check (true);
