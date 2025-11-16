# Swebuk System Analysis

## Project Overview
Swebuk (Software Engineering Student Club) is an online tech community designed to connect software engineering students across various academic levels. It provides a digital environment for collaboration, project management, club (cluster) participation, event registration, blogging, and professional portfolio building. The system also offers administrative tools for staff to manage students, clusters, events, and projects efficiently.

## Current Implementation Status
The project is currently in a foundational stage. The existing codebase consists of a Next.js starter template with Supabase integration. Key implemented features include:
- A public-facing landing page with placeholder sections.
- User authentication (sign-up, login, password reset).
- A protected route and a basic, non-functional dashboard page that displays the authenticated user's details.
- No core application features (dashboards, clusters, projects, etc.) have been implemented yet.

## System Architecture
The Swebuk system follows a modular architecture with a Next.js frontend and a Supabase backend. It ensures real-time communication, secure authentication, and scalable data management.

### Frontend
- Built using Next.js + Tailwind CSS for a modern, responsive, and intuitive UI.
- Pages will include role-specific dashboards for Students, Leads, Staff, and Administrators.
- Chat and notifications will be implemented with Supabase Realtime.
- Uses React Query for data fetching and caching.

### Backend
- Powered by Supabase for authentication, database, and storage.
- Implements role-based access using policies.
- Includes Realtime features for chat, notifications, and updates.
- Storage will be used for project documentation and reports.

## User Roles and Permissions

1.  **Student**:
    *   The base role for all users.
    *   Can join clusters, participate in projects, create personal projects (public/private), and write blog posts (which require approval).
    *   Can be promoted to a leadership role (Deputy Lead or Lead Student) within a cluster.
    *   Level 400 students get access to the Final Year Project (FYP) module.

2.  **Deputy Lead Student**:
    *   A student with elevated privileges within a single cluster.
    *   Assists the Lead Student with management tasks.
    *   Can approve membership requests and student blog posts.
    *   Each cluster can have one Deputy Lead.

3.  **Lead Student**:
    *   The primary student manager for a single cluster.
    *   Approves new members, projects, and student-submitted blog posts for their cluster.
    *   Each cluster has one Lead Student.

4.  **Staff**:
    *   A flexible role with configurable permissions, allowing for different levels of authority.
    *   Can be assigned as `Supervisors` for FYPs or `Managers` for clusters.
    *   Can be granted permissions to manage users, clusters, and system-wide settings.

5.  **Administrator**:
    *   The super-user with unrestricted access.
    *   Manages all user roles and permissions, including promoting students and elevating staff privileges.
    *   Has final approval authority on all content and oversees the entire system.

## Dashboards

Each role will have a dedicated dashboard tailored to their permissions:

*   **Student Dashboard**: For managing personal activities, projects, and content.
*   **Deputy/Lead Student Dashboard**: Includes student features plus cluster management tools.
*   **Staff Dashboard**: Varies based on assigned permissions (e.g., cluster oversight, user management, FYP supervision).
*   **Administrator Dashboard**: Provides a complete, system-wide overview with full administrative control.

## System Flow
1. Students sign up and select their academic level.
2. Students join clusters and participate in discussions.
3. Final-year students access the FYP module to propose and track their projects.
4. Supervisors review and provide feedback.
5. Administrators oversee the full system through analytics dashboards.

## Missing Features and Implementation Roadmap
The following is a comprehensive list of features that need to be implemented to build the Swebuk platform.

### 1. Core User Dashboards
- Implement distinct, role-based dashboards for all user types (Student, Deputy Lead, Lead Student, Staff, Administrator).
- The dashboard should be the central hub for accessing all other features.

### 2. Academic Level Management
- System for users to select and display their academic level (100-400) on their profile.
- Restrict access to certain features based on level (e.g., FYP module).

### 3. Cluster (Club) Management
- Browse, join, and leave clusters.
- Cluster creation and management for Administrators.
- Lead/Deputy Lead tools for managing cluster members and projects.

### 4. Project Management
- Create personal projects (with public/private toggle).
- Create cluster-based projects (by Leads/Staff).
- Browse and request to join projects.
- A formal request/approval workflow for joining projects.

### 5. Final Year Project (FYP) Management System (Level 400 Only)
- Dedicated module for FYP students.
- Functionality for submitting project proposals.
- Workflow for proposal review, approval, and supervisor assignment.
- Progress tracking, report uploading, and supervisor feedback mechanism.

### 6. Blog and Content Management
- Ability for all users to write blog posts.
- Approval workflow for student-written posts (by Leads, Staff, Admins).
- System for Staff to publish official posts.
- Commenting system on blog posts.
- Ability to tag posts to specific clusters.

### 7. Communication and Notifications
- A central notification center for all system alerts (requests, approvals, reminders).
- Dedicated chatrooms for clusters, projects, and FYP groups.
- Direct messaging between users.

### 8. Advanced User and Role Management
- Full administrative interface for managing user roles and permissions.
- UI for promoting students to Lead/Deputy Lead roles.
- System for assigning granular permissions to Staff members.

### 9. Event Management
- Create and manage events (Staff/Admins).
- Event registration for students.
- Event attendance tracking, feedback system, and certificate issuance.

### 10. Profile and Portfolio
- Detailed user profiles.
- Portfolio section to showcase completed projects and skills.

### 11. Advanced Repository Features
- Deeper integration with version control (e.g., code review functionality).
- Tools for documentation generation.

### 12. Academic Session Management
- Admins can manage academic sessions (e.g., 2024/2025) and semesters.
- Automated process to increment student levels (100 -> 200, etc.) at the end of a session.
- Automatically transition Level 400 students to an 'Alumni' status.

## Future Considerations
Features to be considered for implementation in later versions of the platform:
- **SIWES Management**: A module for managing the Students Industrial Work Experience Scheme.
- **Resource Sharing**: Dedicated sections for sharing lecture materials, course content, and past exam questions.
- **Online Quizzes**: A tool for creating and taking academic or technical quizzes.
- **AI Integration**: Incorporating artificial intelligence for features like personalized recommendations, content summarization, or support.

## Database Schema
The system is designed for implementation in Supabase or a relational database such as PostgreSQL or MySQL with tables for:
- users, clusters, cluster_members, projects, project_members, final_year_projects
- events, blogs, comments, notifications, chats, audit_trails