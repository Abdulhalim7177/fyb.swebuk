-- Enable Row Level Security for core tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_year_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Projects RLS Policies
CREATE POLICY "Users can view public projects" ON projects
  FOR SELECT USING (is_public = true);

CREATE POLICY "Project members can view their projects" ON projects
  FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id
      AND user_id = auth.uid()
      AND status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('administrator', 'manager_staff', 'staff')
    )
  );

CREATE POLICY "Project owners can update their projects" ON projects
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Admins can manage all projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('administrator', 'manager_staff')
    )
  );

-- Project Members RLS Policies
CREATE POLICY "Project members can view project memberships" ON project_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_members.project_id
      AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('administrator', 'manager_staff', 'staff')
    )
  );

CREATE POLICY "Project owners can manage project members" ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_members.project_id
      AND owner_id = auth.uid()
    )
  );

-- Final Year Projects RLS Policies
CREATE POLICY "Students can view their own FYP" ON final_year_projects
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Supervisors can view their assigned FYPs" ON final_year_projects
  FOR SELECT USING (supervisor_id = auth.uid());

CREATE POLICY "Staff can view FYPs in their clusters" ON final_year_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles staff
      JOIN user_profiles student ON student.cluster_id = ANY(staff.managed_cluster_ids)
      WHERE staff.id = auth.uid()
      AND staff.role = 'staff'
      AND student.id = final_year_projects.student_id
    )
  );

CREATE POLICY "Admins can manage all FYPs" ON final_year_projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('administrator', 'manager_staff')
    )
  );

-- Events RLS Policies
CREATE POLICY "Anyone can view public events" ON events
  FOR SELECT USING (is_public = true);

CREATE POLICY "Event organizers can manage their events" ON events
  FOR ALL USING (organizer_id = auth.uid());

CREATE POLICY "Admins can manage all events" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('administrator', 'manager_staff')
    )
  );

-- Event Registrations RLS Policies
CREATE POLICY "Users can view their own event registrations" ON event_registrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Event organizers can view registrations for their events" ON event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_registrations.event_id
      AND organizer_id = auth.uid()
    )
  );

CREATE POLICY "Users can create event registrations" ON event_registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own event attendance" ON event_registrations
  FOR UPDATE USING (user_id = auth.uid());

-- Blogs RLS Policies
CREATE POLICY "Anyone can view published blogs" ON blogs
  FOR SELECT USING (status = 'published');

CREATE POLICY "Blog authors can view their own blogs" ON blogs
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Blog authors can manage their own blogs" ON blogs
  FOR ALL USING (author_id = auth.uid());

CREATE POLICY "Staff can approve blogs in their clusters" ON blogs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('administrator', 'manager_staff', 'staff', 'lead_student', 'deputy_lead')
      AND (
        blogs.cluster_id IS NULL
        OR blogs.cluster_id = ANY(user_profiles.managed_cluster_ids)
        OR (SELECT cluster_id FROM user_profiles WHERE id = auth.uid()) = blogs.cluster_id
      )
    )
  );

-- Comments RLS Policies
CREATE POLICY "Anyone can view active comments" ON comments
  FOR SELECT USING (status = 'active');

CREATE POLICY "Comment authors can manage their own comments" ON comments
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Blog authors can manage comments on their blogs" ON comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM blogs
      WHERE id = comments.blog_id
      AND author_id = auth.uid()
    )
  );

-- Notifications RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Chat Rooms RLS Policies
CREATE POLICY "Users can view chat rooms they have access to" ON chat_rooms
  FOR SELECT USING (
    created_by = auth.uid()
    OR type = 'general'
    OR (type = 'direct' AND (related_id = auth.uid() OR created_by = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('administrator', 'manager_staff')
    )
    OR EXISTS (
      -- Cluster members can access cluster chat rooms
      SELECT 1 FROM cluster_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.status = 'approved'
      AND chat_rooms.type = 'cluster'
      AND chat_rooms.related_id = cm.cluster_id
    )
    OR EXISTS (
      -- Project members can access project chat rooms
      SELECT 1 FROM project_members pm
      WHERE pm.user_id = auth.uid()
      AND pm.status = 'approved'
      AND chat_rooms.type = 'project'
      AND chat_rooms.related_id = pm.project_id
    )
  );

-- Chat Messages RLS Policies
CREATE POLICY "Users can view messages in rooms they have access to" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = chat_messages.room_id
      AND (
        created_by = auth.uid()
        OR type = 'general'
        OR (type = 'direct' AND (related_id = auth.uid() OR created_by = auth.uid()))
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role IN ('administrator', 'manager_staff')
        )
        OR EXISTS (
          SELECT 1 FROM cluster_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.status = 'approved'
          AND chat_rooms.type = 'cluster'
          AND chat_rooms.related_id = cm.cluster_id
        )
        OR EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.user_id = auth.uid()
          AND pm.status = 'approved'
          AND chat_rooms.type = 'project'
          AND chat_rooms.related_id = pm.project_id
        )
      )
    )
  );

CREATE POLICY "Users can create messages in rooms they have access to" ON chat_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id
      AND (
        created_by = auth.uid()
        OR type = 'general'
        OR (type = 'direct' AND (related_id = auth.uid() OR created_by = auth.uid()))
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role IN ('administrator', 'manager_staff')
        )
        OR EXISTS (
          SELECT 1 FROM cluster_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.status = 'approved'
          AND chat_rooms.type = 'cluster'
          AND chat_rooms.related_id = cm.cluster_id
        )
        OR EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.user_id = auth.uid()
          AND pm.status = 'approved'
          AND chat_rooms.type = 'project'
          AND chat_rooms.related_id = pm.project_id
        )
      )
    )
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (user_id = auth.uid());