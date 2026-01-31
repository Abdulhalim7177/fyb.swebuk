-- Create fyp_chat table for real-time messaging in FYP projects
CREATE TABLE fyp_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fyp_id UUID REFERENCES public.final_year_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE fyp_chat ENABLE ROW LEVEL SECURITY;

-- FYP Chat Policies

-- 1. Students can view chat for their own FYP
CREATE POLICY "Students can view own FYP chat" ON fyp_chat
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM final_year_projects
      WHERE final_year_projects.id = fyp_chat.fyp_id
      AND final_year_projects.student_id = auth.uid()
    )
  );

-- 2. Supervisors can view chat for assigned FYPs
CREATE POLICY "Supervisors can view assigned FYP chat" ON fyp_chat
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM final_year_projects
      WHERE final_year_projects.id = fyp_chat.fyp_id
      AND final_year_projects.supervisor_id = auth.uid()
    )
  );

-- 3. Admins can view all FYP chats
CREATE POLICY "Admins can view all FYP chats" ON fyp_chat
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Students can send messages to their own FYP
CREATE POLICY "Students can send messages to own FYP" ON fyp_chat
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM final_year_projects
      WHERE final_year_projects.id = fyp_chat.fyp_id
      AND final_year_projects.student_id = auth.uid()
    )
  );

-- 5. Supervisors can send messages to assigned FYPs
CREATE POLICY "Supervisors can send messages to assigned FYPs" ON fyp_chat
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM final_year_projects
      WHERE final_year_projects.id = fyp_chat.fyp_id
      AND final_year_projects.supervisor_id = auth.uid()
    )
  );

-- 6. Admins can send messages to any FYP
CREATE POLICY "Admins can send messages to any FYP" ON fyp_chat
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Message senders can delete their own messages
CREATE POLICY "Message senders can delete their own messages" ON fyp_chat
  FOR DELETE USING (
    auth.role() = 'authenticated' AND user_id = auth.uid()
  );

-- Create indexes for performance
CREATE INDEX fyp_chat_fyp_id_idx ON fyp_chat(fyp_id);
CREATE INDEX fyp_chat_user_id_idx ON fyp_chat(user_id);
CREATE INDEX fyp_chat_created_at_idx ON fyp_chat(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_fyp_chat_updated_at
  BEFORE UPDATE ON fyp_chat
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
