# SPL Lab Mapper

A concept relationship mapper and knowledge management system built for SPL Labs (Southern Petroleum Laboratories). Maps the complete lab workflow from client intake through sample testing, data review, and reporting — with rich metadata at every layer.

## Architecture

```
Client → Client Project → Sample Site → Sample Tech → Sample → SPL Lab → Test Method → Instrument → Review → Report
```

**9 entity types** with full metadata schemas, **2 connection modes** (Sequential → and Associative ↔), drag-and-drop canvas with zoom/pan, and structured detail panels for each entity type.

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Hosting**: GitHub Pages (via GitHub Actions)
- **Fallback**: LocalStorage when Supabase isn't configured

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/JonJohn23/SureBrain.git
cd SureBrain
npm install
```

### 2. Configure Supabase (Optional — runs in local mode without it)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql` — creates all tables, types, indexes, RLS
   - `supabase/migrations/002_seed_data.sql` — pre-populates SPL instruments, methods, labs, and clients
3. Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: **Supabase Dashboard → Project Settings → API**

### 3. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:5173/SureBrain/](http://localhost:5173/SureBrain/)

---

## Deploy to GitHub Pages

### Automatic (GitHub Actions)

1. Push to `main` branch
2. Go to **Settings → Secrets and variables → Actions** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Go to **Settings → Pages** and set source to **GitHub Actions**
4. The workflow at `.github/workflows/deploy.yml` handles the rest

### Manual

```bash
npm run build
# Upload contents of dist/ to your hosting provider
```

---

## Usage

| Action | How |
|--------|-----|
| Add an entity | Double-click or right-click the canvas |
| Move a node | Drag it |
| Rename a node | Double-click the node label |
| Connect nodes | Drag from the colored port (●) on one node to another |
| Switch connection mode | Toggle Sequential (→) / Associative (↔) in toolbar |
| View/edit metadata | Click a node to open the detail panel |
| Pan the canvas | Drag on empty space |
| Zoom | Scroll wheel |
| Filter entity types | Toggle chips in the toolbar |
| Export | Click ↓ Export for a JSON backup |

---

## Entity Types

| Type | Shape | Icon | Description |
|------|-------|------|-------------|
| Client | Rectangle | ◆ | Company entities (EOG, Marathon, Vistra, etc.) |
| Project | Rectangle | ◈ | Client project scopes and SOWs |
| Site | Rectangle | ◉ | Physical sampling locations (wells, pipelines) |
| Tech | Rectangle | ◎ | Sampling technicians (field or lab) |
| Lab | Process | ⬡ | Lab facilities (Pittsburgh, Greeley) |
| Sample | Hexagon | ⬢ | Physical samples with COC data |
| Method | Diamond | ◇ | GPA test methods (2261, 2286, 2177, 2186, 2103) |
| Instrument | Trapezoid | ▲ | GCs and other instruments |
| Result | Rectangle | ▣ | Analysis results, review & report status |

---

## Database Schema

The full PostgreSQL schema is in `supabase/migrations/001_initial_schema.sql` and includes:

- 11 tables with proper foreign keys and cascading deletes
- Custom enum types for all status fields
- Junction tables for many-to-many relationships (tech↔site, method↔instrument)
- Auto-updating `updated_at` timestamps via triggers
- Row Level Security enabled on all tables
- Indexes on commonly queried columns

Seed data in `002_seed_data.sql` pre-populates:
- SPL Pittsburgh and Greeley lab facilities
- All 5 GPA test methods with metadata
- All 6 instruments (4 GCs + Cryette + Anton-Paar)
- Method-instrument compatibility matrix
- 3 known clients (EOG, Marathon, Vistra)
- Canvas connections matching the Level 1 Lab Flow diagram

---

## Project Structure

```
SureBrain/
├── .github/workflows/deploy.yml    # GitHub Pages CI/CD
├── supabase/migrations/
│   ├── 001_initial_schema.sql      # Full database schema
│   └── 002_seed_data.sql           # Pre-populated lab data
├── src/
│   ├── components/
│   │   ├── panels/DetailPanel.tsx   # Entity metadata panel
│   │   └── ui/
│   │       ├── Toolbar.tsx          # Top toolbar with filters
│   │       └── AddNodeMenu.tsx      # Entity creation menu
│   ├── hooks/useLabMapper.ts        # Supabase CRUD + local fallback
│   ├── lib/supabase.ts              # Supabase client config
│   ├── styles/app.css               # Full stylesheet
│   ├── types/entities.ts            # TypeScript interfaces + configs
│   ├── App.tsx                      # Main canvas application
│   ├── main.tsx                     # Entry point
│   └── vite-env.d.ts                # Vite type declarations
├── .env.example                     # Environment template
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Roadmap

- [ ] Supabase Auth integration (login/roles)
- [ ] Structured metadata forms per entity type (dropdowns for enums)
- [ ] Document attachment uploads (Supabase Storage)
- [ ] Draw.io import parser
- [ ] Leaflet.js map view for Sample Sites
- [ ] WIP dashboard integration
- [ ] Multi-lab canvas views
- [ ] Real-time collaboration (Supabase Realtime)

---

## License

Private — SPL Labs internal tool.
