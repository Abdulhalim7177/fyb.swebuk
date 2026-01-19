# Swebuk System Description

## 1. System Overview
Swebuk (Software Engineering Student Club) is an online tech community designed to connect software engineering students across various academic levels. It provides a digital environment for collaboration, project management, club (cluster) participation, event registration, blogging, and professional portfolio building. The system also offers administrative tools for staff to manage students, clusters, events, and projects efficiently.

## 2. Actors and Roles
The system is based on role-based access control (RBAC), which defines permissions for different actors:

### 2.1. Student
*   **Description**: The base role for all users.
*   **Key Capabilities**:
    *   Join clusters (clubs).
    *   Participate in projects and create personal projects.
    *   Write blog posts (subject to approval).
    *   Register for events.
    *   Build a professional portfolio.
    *   Access the Final Year Project (FYP) module (Level 400 only).

### 2.2. Deputy Lead Student
*   **Description**: A student with elevated privileges within a single cluster.
*   **Key Capabilities**:
    *   Assist the Lead Student with management tasks.
    *   Approve membership requests.
    *   Approve student blog posts.

### 2.3. Lead Student
*   **Description**: The primary student manager for a single cluster.
*   **Key Capabilities**:
    *   Approve new members for their cluster.
    *   Manage cluster projects.
    *   Approve student-submitted blog posts.

### 2.4. Staff (Supervisor/Manager)
*   **Description**: A flexible role with configurable permissions.
*   **Key Capabilities**:
    *   Manage assigned clusters.
    *   Supervise Final Year Projects (FYP).
    *   Create and manage events.
    *   Create official blog posts.
    *   Approve projects and content.

### 2.5. Administrator
*   **Description**: The super-user with unrestricted access.
*   **Key Capabilities**:
    *   Manage all user roles and permissions.
    *   Manage academic sessions.
    *   Oversee the entire system through analytics.
    *   Override decisions and manage system settings.

## 3. Use Cases and System Usage

### 3.1. General Student Activities
*   **Register Account**: Students can create an account and verify their email.
*   **Complete Academic Profile**: Users enter academic info (level, department) to unlock features.
*   **View Dashboard**: A personalized hub showing relevant activities, notifications, and quick links.
*   **Access Portfolio**: Students maintain a profile showcasing their projects and skills.

### 3.2. Cluster (Club) Engagement
*   **Browse & Join Clusters**: Students can view available clubs and request to join.
*   **Cluster Management (Leads/Staff)**: Leaders can approve members, manage cluster discussions, and oversee cluster activities.

### 3.3. Project Management
*   **Create Projects**:
    *   **Personal Projects**: Created by students for their portfolio.
    *   **Cluster Projects**: Created by Leads/Staff for group collaboration.
*   **Join Projects**: Students can request to join existing projects.
*   **Project Approval**: Leads and Staff review and approve project join requests.

### 3.4. Final Year Project (FYP) Module
*   **Access**: Restricted to Level 400 students.
*   **Propose Project**: Students submit project topics and proposals.
*   **Supervision**: Staff supervisors review proposals, provide feedback, and grade submissions.
*   **Progress Tracking**: A structured workflow for reporting progress and uploading documentation.

### 3.5. Content & Events
*   **Blogging**:
    *   Students write posts -> Pending Approval -> Leads/Staff Approve -> Published.
    *   Staff write posts -> Published directly.
*   **Events**:
    *   Staff/Admins create events.
    *   Students browse and register for events.
    *   Attendance tracking and feedback collection.

### 3.6. Administration
*   **User Management**: Promoting students to leadership roles, assigning staff permissions.
*   **Academic Session Management**: Handling semester transitions and student level progression (e.g., 100 -> 200).
*   **System Configuration**: Managing global settings and overriding system decisions if necessary.

## 4. System Architecture

The Swebuk system follows a modular **Three-Tier Architecture**:

### 4.1. Frontend (Presentation Layer)
*   **Framework**: Next.js 14+ (App Router).
*   **UI Library**: Tailwind CSS with Shadcn/ui.
*   **Features**: Responsive role-based dashboards, real-time updates using Supabase Realtime.

### 4.2. Backend (Application Layer)
*   **Platform**: Supabase (Backend-as-a-Service).
*   **Authentication**: Supabase Auth (handling sign-ups, logins, and RBAC).
*   **Real-time Engine**: For chat and notifications.

### 4.3. Data Layer
*   **Database**: PostgreSQL with Row Level Security (RLS) to ensure data privacy.
*   **Storage**: Supabase Storage for project files, reports, and user avatars.

## 5. Current Implementation Status

### Completed Features
*   Authentication & Role-Based Access Control.
*   Role-Specific Dashboards (Student, Lead, Staff, Admin).
*   Cluster Browsing & Management.
*   Project Creation & Collaboration workflows.
*   Event Management & Registration.
*   Blog System with moderation.
*   Academic Level & Session Management.

### Partially Completed / In Progress
*   **Final Year Project (FYP) System**: Core module for Level 400s is partially implemented (proposals, supervision).
*   **Advanced User Management**: Granular permission UI is being refined.
*   **Communication**: Direct messaging and chatrooms are in the roadmap.

## 6. Future Roadmap
*   **SIWES Management**: Module for industrial training.
*   **Resource Sharing**: Repository for lecture notes and past questions.
*   **AI Integration**: For personalized content and support.
