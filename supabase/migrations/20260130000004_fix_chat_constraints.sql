-- Update fyp_chat check constraint to allow 'audio' message type
ALTER TABLE fyp_chat DROP CONSTRAINT IF EXISTS fyp_chat_message_type_check;
ALTER TABLE fyp_chat ADD CONSTRAINT fyp_chat_message_type_check CHECK (message_type IN ('text', 'file', 'system', 'audio'));

-- Also update project_chat for consistency
ALTER TABLE project_chat DROP CONSTRAINT IF EXISTS project_chat_message_type_check;
ALTER TABLE project_chat ADD CONSTRAINT project_chat_message_type_check CHECK (message_type IN ('text', 'file', 'system', 'audio'));
