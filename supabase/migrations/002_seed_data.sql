-- ============================================================
-- SPL Lab Mapper — Seed Data
-- Pre-populate with known SPL Pittsburgh entities
-- ============================================================

-- Lab Facility
insert into lab_facilities (id, lab_name, lab_code, lab_director, lab_manager, capabilities, certifications, operating_hours, notes, canvas_x, canvas_y, canvas_color)
values (
  '00000000-0000-0000-0000-000000000001',
  'SPL Pittsburgh',
  'PIT',
  'Joseph Ponminissery',
  'Jonathan John',
  array['GPA 2261', 'GPA 2286', 'GPA 2177', 'GPA 2186', 'GPA 2103'],
  array['GPA Member'],
  'Standard business hours',
  'Main laboratory facility in Pittsburgh, PA',
  400, 500, '#1B4965'
);

insert into lab_facilities (id, lab_name, lab_code, lab_director, lab_manager, capabilities, notes, canvas_x, canvas_y, canvas_color)
values (
  '00000000-0000-0000-0000-000000000002',
  'SPL Greeley',
  'GRE',
  null, null,
  array['GPA 2261', 'GPA 2286'],
  'Colorado laboratory facility in Greeley, CO',
  700, 500, '#0B525B'
);

-- Test Methods
insert into test_methods (id, method_id, method_name, carbon_range, sample_types_supported, duplicate_tolerance, notes, canvas_x, canvas_y, canvas_color) values
  ('10000000-0000-0000-0000-000000000001', 'GPA 2261', 'Extended Natural Gas Analysis (C6+)', 'c6_gas', array['gas'], 0.4, 'Standard custody transfer method. C6+ extended analysis.', 200, 700, '#5A189A'),
  ('10000000-0000-0000-0000-000000000002', 'GPA 2286', 'Extended Natural Gas Analysis (C10+)', 'c10_gas', array['gas'], 0.4, 'Rich gas and NGL-bearing streams through C10+.', 350, 700, '#5A189A'),
  ('10000000-0000-0000-0000-000000000003', 'GPA 2177', 'Natural Gas Analysis (C6+ Alt)', 'c6_gas', array['gas'], 0.4, 'C6+ with alternative column configuration.', 500, 700, '#5A189A'),
  ('10000000-0000-0000-0000-000000000004', 'GPA 2186', 'Natural Gas Analysis (C6+ Detector Variant)', 'c6_gas', array['gas'], 0.4, 'C6+ with different detector configuration.', 650, 700, '#5A189A'),
  ('10000000-0000-0000-0000-000000000005', 'GPA 2103', 'Liquid Hydrocarbon Analysis', 'c6_liq', array['liquid', 'lpg', 'ngl'], 0.4, 'Liquid/LPG analysis. Requires Cryette for molecular weight and Anton-Paar for density.', 800, 700, '#5A189A');

-- Instruments
insert into instruments (id, instrument_name, internal_id, manufacturer, model, instrument_type, lab_id, detector_type, notes, canvas_x, canvas_y, canvas_color) values
  ('20000000-0000-0000-0000-000000000001', 'Scion Benchtop GC', 'System 1', 'Scion', 'Benchtop GC', 'benchtop_gc', '00000000-0000-0000-0000-000000000001', 'tcd_fid', 'Benchtop GC for GPA 2186 and GPA 2103.', 100, 900, '#386641'),
  ('20000000-0000-0000-0000-000000000002', 'Shimadzu 2014', '1510-GC2', 'Shimadzu', '2014', 'benchtop_gc', '00000000-0000-0000-0000-000000000001', 'tcd_fid', 'Benchtop GC for GPA 2177 and GPA 2186 (hub).', 280, 900, '#386641'),
  ('20000000-0000-0000-0000-000000000003', 'Agilent 990 Micro GC', '990', 'Agilent', '990', 'micro_gc', '00000000-0000-0000-0000-000000000001', 'tcd', 'Micro GC for GPA 2261 and GPA 2286.', 460, 900, '#0D9488'),
  ('20000000-0000-0000-0000-000000000004', 'Inficon 3K Micro GC', '1510_GC5', 'Inficon', '3000', 'micro_gc', '00000000-0000-0000-0000-000000000001', 'tcd', 'Micro GC for GPA 2261 and GPA 2286.', 640, 900, '#0D9488'),
  ('20000000-0000-0000-0000-000000000005', 'Cryette Molecular Weight', 'CRYO-1', 'Precision Systems', 'Cryette', 'cryoscope', '00000000-0000-0000-0000-000000000001', 'none', 'Determines molecular weight via freezing point depression. Used with GPA 2103.', 820, 900, '#E85D04'),
  ('20000000-0000-0000-0000-000000000006', 'Anton-Paar Density Meter', 'DENS-1', 'Anton-Paar', 'DMA', 'density_meter', '00000000-0000-0000-0000-000000000001', 'none', 'Provides specific gravity / API gravity. Used with GPA 2103.', 1000, 900, '#E85D04');

-- Method-Instrument Compatibility (the many-to-many from the diagram)
insert into method_instrument_compat (method_id, instrument_id, is_primary, notes) values
  -- GPA 2261 → Agilent 990, Inficon 3K
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', true, 'Primary micro GC for 2261'),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', true, 'Backup micro GC for 2261'),
  -- GPA 2286 → Agilent 990, Inficon 3K
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', true, 'Primary micro GC for 2286'),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', true, 'Backup micro GC for 2286'),
  -- GPA 2177 → Shimadzu 2014
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', true, 'Alt column config on Shimadzu'),
  -- GPA 2186 → Scion Benchtop, Shimadzu 2014 (hub)
  ('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', true, 'Primary benchtop for 2186'),
  ('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', false, 'Hub point — secondary'),
  -- GPA 2103 → Scion Benchtop, Cryette, Anton-Paar
  ('10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', true, 'Primary benchtop for liquid analysis'),
  ('10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', true, 'Molecular weight measurement'),
  ('10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006', true, 'Density measurement');

-- Pre-populate known clients
insert into clients (id, company_name, client_status, industry_sector, notes, canvas_x, canvas_y, canvas_color) values
  ('30000000-0000-0000-0000-000000000001', 'EOG Resources', 'active', 'upstream', 'EOG22 — major upstream client.', 100, 100, '#2D6A4F'),
  ('30000000-0000-0000-0000-000000000002', 'Marathon Petroleum', 'active', 'midstream', 'Marathon — midstream/refining client.', 350, 100, '#264653'),
  ('30000000-0000-0000-0000-000000000003', 'Vistra Energy', 'active', 'utility', 'Vistra — utility/power generation client.', 600, 100, '#6A040F');

-- Pre-populate connections for the seed data
-- Lab → Method connections (sequential: lab routes to test)
insert into connections (from_entity_type, from_entity_id, to_entity_type, to_entity_id, connection_type, label) values
  ('lab_facility', '00000000-0000-0000-0000-000000000001', 'test_method', '10000000-0000-0000-0000-000000000001', 'sequential', 'routes to'),
  ('lab_facility', '00000000-0000-0000-0000-000000000001', 'test_method', '10000000-0000-0000-0000-000000000002', 'sequential', 'routes to'),
  ('lab_facility', '00000000-0000-0000-0000-000000000001', 'test_method', '10000000-0000-0000-0000-000000000003', 'sequential', 'routes to'),
  ('lab_facility', '00000000-0000-0000-0000-000000000001', 'test_method', '10000000-0000-0000-0000-000000000004', 'sequential', 'routes to'),
  ('lab_facility', '00000000-0000-0000-0000-000000000001', 'test_method', '10000000-0000-0000-0000-000000000005', 'sequential', 'routes to');

-- Method → Instrument connections (associative: runs on)
insert into connections (from_entity_type, from_entity_id, to_entity_type, to_entity_id, connection_type, label) values
  ('test_method', '10000000-0000-0000-0000-000000000001', 'instrument', '20000000-0000-0000-0000-000000000003', 'associative', 'runs on'),
  ('test_method', '10000000-0000-0000-0000-000000000001', 'instrument', '20000000-0000-0000-0000-000000000004', 'associative', 'runs on'),
  ('test_method', '10000000-0000-0000-0000-000000000002', 'instrument', '20000000-0000-0000-0000-000000000003', 'associative', 'runs on'),
  ('test_method', '10000000-0000-0000-0000-000000000002', 'instrument', '20000000-0000-0000-0000-000000000004', 'associative', 'runs on'),
  ('test_method', '10000000-0000-0000-0000-000000000003', 'instrument', '20000000-0000-0000-0000-000000000002', 'associative', 'runs on'),
  ('test_method', '10000000-0000-0000-0000-000000000004', 'instrument', '20000000-0000-0000-0000-000000000001', 'associative', 'runs on'),
  ('test_method', '10000000-0000-0000-0000-000000000004', 'instrument', '20000000-0000-0000-0000-000000000002', 'associative', 'runs on (hub)'),
  ('test_method', '10000000-0000-0000-0000-000000000005', 'instrument', '20000000-0000-0000-0000-000000000001', 'associative', 'runs on'),
  ('test_method', '10000000-0000-0000-0000-000000000005', 'instrument', '20000000-0000-0000-0000-000000000005', 'associative', 'mol wt'),
  ('test_method', '10000000-0000-0000-0000-000000000005', 'instrument', '20000000-0000-0000-0000-000000000006', 'associative', 'density');
