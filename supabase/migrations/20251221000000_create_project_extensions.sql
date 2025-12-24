-- Create project_files table for file uploads
CREATE TABLE project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create project_progress table for tracking milestones/progress
CREATE TABLE project_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create project_chat table for real-time messaging
CREATE TABLE project_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_chat ENABLE ROW LEVEL SECURITY;

-- Project Files Policies
CREATE POLICY "Project members can view files" ON project_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_files.project_id
      AND (
        projects.owner_id = auth.uid() OR
        projects.visibility = 'public' OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
          AND project_members.status = 'approved'
        )
      )
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Project members can upload files" ON project_files
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_files.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
          AND project_members.status = 'approved'
        )
      )
    )
  );

CREATE POLICY "File uploaders and project owners can delete files" ON project_files
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      uploaded_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_files.project_id
        AND projects.owner_id = auth.uid()
      ) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Project Progress Policies
CREATE POLICY "Project members can view progress" ON project_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_progress.project_id
      AND (
        projects.owner_id = auth.uid() OR
        projects.visibility = 'public' OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
          AND project_members.status = 'approved'
        )
      )
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Project members can create progress items" ON project_progress
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_progress.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
          AND project_members.status = 'approved'
        )
      )
    )
  );

CREATE POLICY "Project members can update progress items" ON project_progress
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_progress.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
          AND project_members.status = 'approved'
        )
      )
    )
  );

CREATE POLICY "Progress creators and project owners can delete progress" ON project_progress
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_progress.project_id
        AND projects.owner_id = auth.uid()
      ) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Project Chat Policies
CREATE POLICY "Project members can view chat" ON project_chat
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_chat.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
          AND project_members.status = 'approved'
        )
      )
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Project members can send messages" ON project_chat
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_chat.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
          AND project_members.status = 'approved'
        )
      )
    )
  );

CREATE POLICY "Message senders can delete their messages" ON project_chat
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_chat.project_id
        AND projects.owner_id = auth.uid()
      ) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Create indexes for performance
CREATE INDEX project_files_project_id_idx ON project_files(project_id);
CREATE INDEX project_files_uploaded_by_idx ON project_files(uploaded_by);
CREATE INDEX project_progress_project_id_idx ON project_progress(project_id);
CREATE INDEX project_progress_status_idx ON project_progress(status);
CREATE INDEX project_progress_assigned_to_idx ON project_progress(assigned_to);
CREATE INDEX project_chat_project_id_idx ON project_chat(project_id);
CREATE INDEX project_chat_user_id_idx ON project_chat(user_id);
CREATE INDEX project_chat_created_at_idx ON project_chat(created_at DESC);

-- Triggers to update updated_at
CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON project_files
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_project_progress_updated_at
  BEFORE UPDATE ON project_progress
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_project_chat_updated_at
  BEFORE UPDATE ON project_chat
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project files bucket
CREATE POLICY "Project members can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-files' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Project members can view files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-files' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "File uploaders can delete their files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
