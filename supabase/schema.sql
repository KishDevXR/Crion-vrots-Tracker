-- ============================================================
-- Crion VROTS Tracker — Full Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- STEP 1: Profiles (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL DEFAULT '',
  email                TEXT,
  role                 TEXT NOT NULL DEFAULT 'Team Member'
                         CHECK (role IN ('Admin','Manager','Team Member','Stakeholder')),
  hourly_rate          NUMERIC(10,2) DEFAULT 50,
  weekly_planned_hours INTEGER DEFAULT 40,
  weekly_actual_hours  INTEGER DEFAULT 0,
  utilization_percent  INTEGER DEFAULT 0,
  avatar_url           TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Team Member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: get current user role from profiles
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- STEP 2: Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  client           TEXT NOT NULL DEFAULT '',
  status           TEXT DEFAULT 'Active'
                     CHECK (status IN ('Active','On Hold','Completed','Cancelled')),
  owner            TEXT DEFAULT '',
  start_date       DATE,
  planned_end_date DATE,
  budget           NUMERIC(12,2) DEFAULT 0,
  remarks          TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Modules
CREATE TABLE IF NOT EXISTS public.modules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  status           TEXT DEFAULT 'Pending'
                     CHECK (status IN ('Pending','WIP','Testing','Complete')),
  percent_complete INTEGER DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  current_activity TEXT DEFAULT '',
  efforts_hours    NUMERIC(8,1) DEFAULT 0,
  blockers         TEXT DEFAULT '',
  owner            TEXT DEFAULT '',
  planned_end_date DATE,
  eta              DATE,
  remarks          TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: Epics
CREATE TABLE IF NOT EXISTS public.epics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  epic_title   TEXT NOT NULL,
  description  TEXT DEFAULT '',
  story_points INTEGER DEFAULT 0,
  priority     TEXT DEFAULT 'Medium'
                 CHECK (priority IN ('Low','Medium','High','Critical')),
  status       TEXT DEFAULT 'In Progress'
                 CHECK (status IN ('Not Started','In Progress','Done')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 5: Sprints
CREATE TABLE IF NOT EXISTS public.sprints (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  goal                   TEXT DEFAULT '',
  start_date             DATE,
  end_date               DATE,
  status                 TEXT DEFAULT 'Planned'
                           CHECK (status IN ('Planned','Active','Completed')),
  capacity_hours         INTEGER DEFAULT 200,
  committed_story_points INTEGER DEFAULT 0,
  completed_story_points INTEGER DEFAULT 0,
  retro_notes            TEXT DEFAULT '',
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 6: Tasks (core entity)
CREATE TABLE IF NOT EXISTS public.tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  module_id        UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  sprint_id        UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  epic_id          UUID REFERENCES public.epics(id) ON DELETE SET NULL,
  parent_task_id   UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  resource_name    TEXT DEFAULT '',
  assignee_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  role             TEXT DEFAULT '',
  manager          TEXT DEFAULT '',
  week_start_date  DATE,
  week_no          INTEGER,
  description      TEXT NOT NULL DEFAULT '',
  story_points     INTEGER DEFAULT 0,
  planned_hours    NUMERIC(6,1) DEFAULT 0,
  actual_hours     NUMERIC(6,1) DEFAULT 0,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  status           TEXT DEFAULT 'Not Started'
                     CHECK (status IN ('Not Started','In Progress','Blocked','Done')),
  priority         TEXT DEFAULT 'Medium'
                     CHECK (priority IN ('Low','Medium','High','Critical')),
  start_date       DATE,
  end_date         DATE,
  remarks          TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- STEP 7: Task Dependencies
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  type          TEXT DEFAULT 'blocks' CHECK (type IN ('blocks','relates_to')),
  UNIQUE(task_id, depends_on_id)
);

-- STEP 8: Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author     TEXT NOT NULL,
  author_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 9: Activity Log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  changed_by    TEXT NOT NULL,
  changed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  field_changed TEXT NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 10: Time Logs
CREATE TABLE IF NOT EXISTS public.time_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name   TEXT NOT NULL,
  hours       NUMERIC(5,2) NOT NULL CHECK (hours > 0),
  description TEXT DEFAULT '',
  logged_date DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 11: File Attachments (Supabase Storage backed)
CREATE TABLE IF NOT EXISTS public.attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  uploaded_by   TEXT NOT NULL,
  uploaded_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  filename      TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  size_bytes    INTEGER DEFAULT 0,
  mime_type     TEXT DEFAULT 'application/octet-stream',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 12: Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT DEFAULT '',
  entity_id   UUID,
  entity_type TEXT DEFAULT 'task',
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 13: Milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  due_date    DATE,
  status      TEXT DEFAULT 'Pending'
                CHECK (status IN ('Pending','Completed','Missed')),
  description TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 14: Deliverables
CREATE TABLE IF NOT EXISTS public.deliverables (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  month            TEXT NOT NULL,
  description      TEXT NOT NULL,
  priority_rank    INTEGER DEFAULT 1,
  owner            TEXT DEFAULT '',
  follow_up_action TEXT DEFAULT '',
  status           TEXT DEFAULT 'Not Started'
                     CHECK (status IN ('Not Started','In Progress','Done')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 15: Backlog Items
CREATE TABLE IF NOT EXISTS public.backlog_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  module_id     UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  description   TEXT NOT NULL,
  category      TEXT DEFAULT 'Engineering',
  priority      TEXT DEFAULT 'Medium'
                  CHECK (priority IN ('Low','Medium','High','Critical')),
  planned_hours NUMERIC(6,1) DEFAULT 0,
  story_points  INTEGER DEFAULT 0,
  assigned_to   TEXT DEFAULT '',
  dependency    TEXT DEFAULT 'None',
  blocker_reason TEXT DEFAULT '',
  target_week   TEXT DEFAULT '',
  remarks       TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 16: Unassigned (Triage) Items
CREATE TABLE IF NOT EXISTS public.unassigned_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  module_id     UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  description   TEXT NOT NULL,
  planned_hours NUMERIC(6,1) DEFAULT 0,
  department    TEXT DEFAULT 'Engineering',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 17: Hiring Requests
CREATE TABLE IF NOT EXISTS public.hiring_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position     TEXT NOT NULL,
  team         TEXT DEFAULT '',
  reason       TEXT DEFAULT '',
  priority     TEXT DEFAULT 'Medium'
                 CHECK (priority IN ('Low','Medium','High','Critical')),
  required_by  DATE,
  status       TEXT DEFAULT 'Draft',
  remarks      TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 18: Skill Development Plans
CREATE TABLE IF NOT EXISTS public.skill_developments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name       TEXT NOT NULL,
  employee_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  skill_to_learn      TEXT NOT NULL,
  current_skill_level TEXT DEFAULT 'Beginner',
  training_plan       TEXT DEFAULT '',
  target_date         DATE,
  status              TEXT DEFAULT 'Planned'
                        CHECK (status IN ('Planned','In Progress','Completed')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epics            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unassigned_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_developments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all project data
DROP POLICY IF EXISTS "Authenticated read all" ON public.projects;
CREATE POLICY "Authenticated read all"
  ON public.projects FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read modules" ON public.modules;
CREATE POLICY "Authenticated read modules"
  ON public.modules FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read sprints" ON public.sprints;
CREATE POLICY "Authenticated read sprints"
  ON public.sprints FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read tasks" ON public.tasks;
CREATE POLICY "Authenticated read tasks"
  ON public.tasks FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read epics" ON public.epics;
CREATE POLICY "Authenticated read epics"
  ON public.epics FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read comments" ON public.comments;
CREATE POLICY "Authenticated read comments"
  ON public.comments FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read activity" ON public.activity_log;
CREATE POLICY "Authenticated read activity"
  ON public.activity_log FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read backlog" ON public.backlog_items;
CREATE POLICY "Authenticated read backlog"
  ON public.backlog_items FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read unassigned" ON public.unassigned_tasks;
CREATE POLICY "Authenticated read unassigned"
  ON public.unassigned_tasks FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read milestones" ON public.milestones;
CREATE POLICY "Authenticated read milestones"
  ON public.milestones FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read deliverables" ON public.deliverables;
CREATE POLICY "Authenticated read deliverables"
  ON public.deliverables FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read timelogs" ON public.time_logs;
CREATE POLICY "Authenticated read timelogs"
  ON public.time_logs FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read attachments" ON public.attachments;
CREATE POLICY "Authenticated read attachments"
  ON public.attachments FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read task_deps" ON public.task_dependencies;
CREATE POLICY "Authenticated read task_deps"
  ON public.task_dependencies FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Authenticated read profiles" ON public.profiles;
CREATE POLICY "Authenticated read profiles"
  ON public.profiles FOR SELECT TO authenticated USING (TRUE);

-- Notifications: each user sees only their own
DROP POLICY IF EXISTS "Own notifications only" ON public.notifications;
CREATE POLICY "Own notifications only"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Hiring/Skills: Admin + Manager only
DROP POLICY IF EXISTS "Admin manager read hiring" ON public.hiring_requests;
CREATE POLICY "Admin manager read hiring"
  ON public.hiring_requests FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Manager'));

DROP POLICY IF EXISTS "Admin manager read skills" ON public.skill_developments;
CREATE POLICY "Admin manager read skills"
  ON public.skill_developments FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Manager'));

-- WRITE policies: Admin + Manager can write everything
DROP POLICY IF EXISTS "Admin manager write projects" ON public.projects;
CREATE POLICY "Admin manager write projects"
  ON public.projects FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Manager'))
  WITH CHECK (get_my_role() IN ('Admin','Manager'));

DROP POLICY IF EXISTS "Admin manager write modules" ON public.modules;
CREATE POLICY "Admin manager write modules"
  ON public.modules FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Manager'))
  WITH CHECK (get_my_role() IN ('Admin','Manager'));

DROP POLICY IF EXISTS "Admin manager write sprints" ON public.sprints;
CREATE POLICY "Admin manager write sprints"
  ON public.sprints FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Manager'))
  WITH CHECK (get_my_role() IN ('Admin','Manager'));

DROP POLICY IF EXISTS "Admin manager write epics" ON public.epics;
CREATE POLICY "Admin manager write epics"
  ON public.epics FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Manager'))
  WITH CHECK (get_my_role() IN ('Admin','Manager'));

DROP POLICY IF EXISTS "Admin manager write backlog" ON public.backlog_items;
CREATE POLICY "Admin manager write backlog"
  ON public.backlog_items FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Manager'))
  WITH CHECK (get_my_role() IN ('Admin','Manager'));

DROP POLICY IF EXISTS "Admin manager write hiring" ON public.hiring_requests;
CREATE POLICY "Admin manager write hiring"
  ON public.hiring_requests FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Manager'))
  WITH CHECK (get_my_role() IN ('Admin','Manager'));

DROP POLICY IF EXISTS "Admin manager write skills" ON public.skill_developments;
CREATE POLICY "Admin manager write skills"
  ON public.skill_developments FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Manager'))
  WITH CHECK (get_my_role() IN ('Admin','Manager'));

-- Tasks: all team members can update (Team Member limited to own tasks via app logic)
DROP POLICY IF EXISTS "Team write tasks" ON public.tasks;
CREATE POLICY "Team write tasks"
  ON public.tasks FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Manager','Team Member'))
  WITH CHECK (get_my_role() IN ('Admin','Manager','Team Member'));

-- Comments & activity log: all authenticated users can insert
DROP POLICY IF EXISTS "All insert comments" ON public.comments;
CREATE POLICY "All insert comments"
  ON public.comments FOR INSERT TO authenticated WITH CHECK (TRUE);

DROP POLICY IF EXISTS "All insert activity" ON public.activity_log;
CREATE POLICY "All insert activity"
  ON public.activity_log FOR INSERT TO authenticated WITH CHECK (TRUE);

DROP POLICY IF EXISTS "All insert timelogs" ON public.time_logs;
CREATE POLICY "All insert timelogs"
  ON public.time_logs FOR INSERT TO authenticated WITH CHECK (TRUE);

DROP POLICY IF EXISTS "All insert notifications" ON public.notifications;
CREATE POLICY "All insert notifications"
  ON public.notifications FOR INSERT TO authenticated WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Own update notifications" ON public.notifications;
CREATE POLICY "Own update notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "All insert attachments" ON public.attachments;
CREATE POLICY "All insert attachments"
  ON public.attachments FOR INSERT TO authenticated WITH CHECK (TRUE);

DROP POLICY IF EXISTS "All insert task_deps" ON public.task_dependencies;
CREATE POLICY "All insert task_deps"
  ON public.task_dependencies FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Profiles: users can update their own
DROP POLICY IF EXISTS "Own profile update" ON public.profiles;
CREATE POLICY "Own profile update"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
CREATE POLICY "Admin manage profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- Deliverables & milestones write
DROP POLICY IF EXISTS "Admin manager write deliverables" ON public.deliverables;
CREATE POLICY "Admin manager write deliverables"
  ON public.deliverables FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Manager'))
  WITH CHECK (get_my_role() IN ('Admin','Manager'));

DROP POLICY IF EXISTS "Admin manager write milestones" ON public.milestones;
CREATE POLICY "Admin manager write milestones"
  ON public.milestones FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Manager'))
  WITH CHECK (get_my_role() IN ('Admin','Manager'));

DROP POLICY IF EXISTS "Admin manager write unassigned" ON public.unassigned_tasks;
CREATE POLICY "Admin manager write unassigned"
  ON public.unassigned_tasks FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Manager'))
  WITH CHECK (get_my_role() IN ('Admin','Manager'));

-- ============================================================
-- SUPABASE REALTIME: enable for live collaboration
-- ============================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
  CREATE PUBLICATION supabase_realtime FOR TABLE
    public.tasks,
    public.comments,
    public.activity_log,
    public.notifications,
    public.sprints;
COMMIT;
