-- Seed default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('users.create', 'Create new users', 'users', 'create'),
('users.read', 'View user profiles', 'users', 'read'),
('users.update', 'Update user profiles', 'users', 'update'),
('users.delete', 'Delete users', 'users', 'delete'),
('users.suspend', 'Suspend users', 'users', 'suspend'),
('users.assign_role', 'Assign user roles', 'users', 'assign_role'),
('clusters.create', 'Create clusters', 'clusters', 'create'),
('clusters.read', 'View clusters', 'clusters', 'read'),
('clusters.update', 'Update clusters', 'clusters', 'update'),
('clusters.delete', 'Delete clusters', 'clusters', 'delete'),
('clusters.manage_members', 'Manage cluster members', 'clusters', 'manage_members'),
('projects.create', 'Create projects', 'projects', 'create'),
('projects.read', 'View projects', 'projects', 'read'),
('projects.update', 'Update projects', 'projects', 'update'),
('projects.delete', 'Delete projects', 'projects', 'delete'),
('projects.manage_members', 'Manage project members', 'projects', 'manage_members'),
('projects.approve', 'Approve projects', 'projects', 'approve'),
('blogs.create', 'Create blog posts', 'blogs', 'create'),
('blogs.read', 'View blog posts', 'blogs', 'read'),
('blogs.update', 'Update blog posts', 'blogs', 'update'),
('blogs.delete', 'Delete blog posts', 'blogs', 'delete'),
('blogs.approve', 'Approve blog posts', 'blogs', 'approve'),
('events.create', 'Create events', 'events', 'create'),
('events.read', 'View events', 'events', 'read'),
('events.update', 'Update events', 'events', 'update'),
('events.delete', 'Delete events', 'events', 'delete'),
('events.manage_attendees', 'Manage event attendees', 'events', 'manage_attendees'),
('fyp.create', 'Create FYP proposals', 'fyp', 'create'),
('fyp.read', 'View FYP projects', 'fyp', 'read'),
('fyp.update', 'Update FYP projects', 'fyp', 'update'),
('fyp.supervise', 'Supervise FYP projects', 'fyp', 'supervise'),
('fyp.approve', 'Approve FYP proposals', 'fyp', 'approve'),
('chat.create', 'Create chat rooms', 'chat', 'create'),
('chat.read', 'Read chat messages', 'chat', 'read'),
('chat.write', 'Send chat messages', 'chat', 'write'),
('system.admin', 'Full system administration', 'system', 'admin');

-- Seed role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'administrator', id FROM permissions;

INSERT INTO role_permissions (role, permission_id)
SELECT 'manager_staff', id FROM permissions
WHERE name IN ('users.create', 'users.read', 'users.update', 'users.suspend', 'users.assign_role',
                'clusters.create', 'clusters.read', 'clusters.update', 'clusters.manage_members',
                'projects.create', 'projects.read', 'projects.update', 'projects.manage_members', 'projects.approve',
                'blogs.create', 'blogs.read', 'blogs.update', 'blogs.approve',
                'events.create', 'events.read', 'events.update', 'events.manage_attendees',
                'fyp.read', 'fyp.supervise', 'fyp.approve',
                'chat.create', 'chat.read', 'chat.write');

INSERT INTO role_permissions (role, permission_id)
SELECT 'staff', id FROM permissions
WHERE name IN ('users.read', 'clusters.read', 'clusters.manage_members',
                'projects.read', 'projects.approve',
                'blogs.read', 'blogs.approve',
                'events.read', 'events.manage_attendees',
                'fyp.read', 'fyp.supervise', 'fyp.approve',
                'chat.create', 'chat.read', 'chat.write');

INSERT INTO role_permissions (role, permission_id)
SELECT 'lead_student', id FROM permissions
WHERE name IN ('users.read', 'clusters.manage_members',
                'projects.create', 'projects.read', 'projects.update', 'projects.manage_members', 'projects.approve',
                'blogs.create', 'blogs.read', 'blogs.update', 'blogs.approve',
                'events.create', 'events.read', 'events.update', 'events.manage_attendees',
                'chat.create', 'chat.read', 'chat.write');

INSERT INTO role_permissions (role, permission_id)
SELECT 'deputy_lead', id FROM permissions
WHERE name IN ('users.read', 'clusters.manage_members',
                'projects.read', 'projects.approve',
                'blogs.create', 'blogs.read', 'blogs.update', 'blogs.approve',
                'events.read', 'events.manage_attendees',
                'chat.read', 'chat.write');

INSERT INTO role_permissions (role, permission_id)
SELECT 'student', id FROM permissions
WHERE name IN ('users.read', 'clusters.read',
                'projects.create', 'projects.read', 'projects.update',
                'blogs.create', 'blogs.read', 'blogs.update',
                'events.read',
                'fyp.create', 'fyp.read', 'fyp.update',
                'chat.read', 'chat.write');