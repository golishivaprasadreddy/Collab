# Collabio Events Dashboard — Full Organizer Suite

This is a large feature set spanning new database tables, an organizer role, QR scanning, certificate PDF generation, analytics, and a media gallery. To keep each step verifiable and avoid breaking existing flows, I'll ship it in **3 phased iterations**. You approve this plan, then I implement Phase 1 immediately. Phases 2 and 3 each ship in their own follow-up message after you confirm Phase 1 works.

---

## Phase 1 — Foundations & Two-Section UI (this iteration)

**Goal:** Restructure dashboard into "My College" vs "National & Global" with proper data model and registration management.

### Database
- Add to `events`:
  - `scope` enum: `college` | `national` | `global`
  - `college` text (nullable, used when scope='college')
  - `organizer_id` uuid (creator, distinct from admin)
  - `max_team_size` int, `min_team_size` int
  - `event_subtype` text (fest, club, workshop, hackathon, cultural, startup, department)
- New `app_role` value: `organizer` (college organizers manage their own events)
- New table `event_attendance` — QR check-ins (used in Phase 2)
- New table `event_certificates` — issued certificates (used in Phase 2)
- New table `event_media` — photos/videos uploaded post-event (used in Phase 3)
- RLS:
  - College events visible to all authenticated users (filtering happens client-side by user.college)
  - Only `organizer` (own events) or `admin` can create/update/delete events
  - `event_registrations` already exists — extend for team_size validation via trigger

### UI (`EventsDashboard.tsx`)
- Top tabs: **My College** | **National & Global**
- "My College" auto-filters `events.college = profile.college` and shows a friendly "Set your college in profile" CTA if missing
- Sub-filters per section: subtype chips (Fests, Clubs, Workshops, Hackathons, Cultural, Startup, Dept)
- Keep existing list/map view toggle, filters, TeamPanel
- Weekly upcoming carousel + monthly calendar view (lightweight, using existing `Calendar` component)

### Registration improvements
- "Register" button on event card opens dialog → choose Solo or Team
- Team mode: add teammates from existing collaborators list, validates min/max team size
- Saved to `event_registrations.team_members`

**Files touched:** `src/pages/EventsDashboard.tsx`, `src/hooks/useEvents.ts`, `src/components/events/EventCard.tsx`, new `src/components/events/RegisterDialog.tsx`, new `src/components/events/MonthlyCalendar.tsx`, migration.

---

## Phase 2 — Organizer Tools: QR Attendance + Certificates

**Goal:** Give organizers (and admins) a per-event control panel.

- New page `/events/:id/manage` (organizer/admin only):
  - Registrations list with search, CSV export
  - **QR generator**: each registration gets a unique check-in code; organizer prints/displays event-level QR or scans participant QRs
  - **QR scanner**: uses device camera (`html5-qrcode`) to mark attendance → writes to `event_attendance`
  - **Certificate generator**: edge function `generate-certificate` renders PDF (using `pdf-lib`) for participant/winner/organizer/volunteer roles, stores in new `certificates` storage bucket, records in `event_certificates`
  - Bulk-generate certificates for all attendees with one click
- Participants see their certificates in a new "My Certificates" section of profile

**Files added:** `src/pages/EventManage.tsx`, `src/components/events/QRScanner.tsx`, `src/components/events/CertificateTemplate.tsx`, `supabase/functions/generate-certificate/index.ts`, storage bucket `certificates`.

---

## Phase 3 — Analytics, Documentation & Gallery

**Goal:** Post-event reporting for colleges.

- **Analytics dashboard** (organizer view): participant count, department-wise breakdown (from profile.degree), team activity, registration trends — uses Recharts.
- **Media gallery**: organizers upload photos/videos to `event-media` storage bucket, displayed in event detail view as masonry gallery with full-screen viewer.
- **Auto-generated event report**: edge function `generate-event-report` produces PDF combining stats + photo grid, downloadable by organizer.

**Files added:** `src/components/events/EventAnalytics.tsx`, `src/components/events/EventGallery.tsx`, `supabase/functions/generate-event-report/index.ts`, storage bucket `event-media`.

---

## Out of scope / assumptions
- Organizer signup flow — for now, admins manually grant `organizer` role via existing admin panel. Self-serve organizer signup can be a follow-up.
- Reminders use existing `notifications` table + push pipeline; no new infra.
- All existing functionality (collaborations, messaging, workspace) is untouched.

## Technical notes
- Keep edge functions with manual CORS constants (per project memory).
- All new tables get RLS with explicit `TO authenticated`.
- Use `has_role(auth.uid(), 'organizer')` and existing `is_admin()` for write policies.
- QR codes use `qrcode` (generation, ~12KB) and `html5-qrcode` (scanning) — both small.
- PDFs generated server-side via `pdf-lib` to avoid bundling 1MB+ in client.

**Approve to start Phase 1.** I'll ship it end-to-end and ask before starting Phase 2.
