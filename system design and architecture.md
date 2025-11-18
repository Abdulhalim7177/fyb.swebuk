# System Design and Architecture for Swebuk Platform

## 3.5.1 Description of Proposed System

The Swebuk Platform is an online tech community designed specifically for software engineering students across various academic levels. The system aims to provide a digital environment for collaboration, project management, club participation, event registration, blogging, and professional portfolio building. It also offers administrative tools for staff to manage students, clusters, events, and projects efficiently.

### System Overview

The Swebuk platform follows a modular architecture with a Next.js frontend and a Supabase backend, ensuring real-time communication, secure authentication, and scalable data management. The system is designed to support multiple user roles with distinct permissions and responsibilities, facilitating a structured learning and collaboration environment for software engineering students.

### User Roles and Interactions

1. **Student**: The base role for all users. Students can join clusters, participate in projects, create personal projects (public/private), and write blog posts (which require approval). They can also be promoted to leadership roles within a cluster and Level 400 students get access to the Final Year Project (FYP) module.

2. **Deputy Lead Student**: A student with elevated privileges within a single cluster. They assist the Lead Student with management tasks and can approve membership requests and student blog posts.

3. **Lead Student**: The primary student manager for a single cluster. They approve new members, projects, and student-submitted blog posts for their cluster.

4. **Staff**: A flexible role with configurable permissions, allowing for different levels of authority. Can be assigned as supervisors for FYPs or managers for clusters.

5. **Administrator**: The super-user with unrestricted access, managing all user roles and permissions, including promoting students and elevating staff privileges.

### System Flow Description

The system follows a structured flow:

1. **Registration and Profile Setup**: Students sign up and complete their academic profile, selecting their academic level (100-400) and other relevant details.

2. **Cluster Participation**: Students browse, join, and participate in clusters (clubs) related to their interests, where they can collaborate on projects and engage in discussions.

3. **Project Management**: Students create personal projects or participate in cluster-based projects, with formal request/approval workflows for joining projects led by others.

4. **Final Year Project (FYP) Management**: Level 400 students access the dedicated FYP module to submit project proposals, get supervisor assignments, track progress, upload reports, and receive feedback.

5. **Content Creation**: Users can write blog posts with an approval workflow for student-written content by Leads, Staff, or Admins.

6. **Communication**: The platform includes notification centers, dedicated chatrooms for clusters/projects, and direct messaging between users.

7. **Administrative Oversight**: Administrators oversee the full system through analytics dashboards and manage academic sessions, user roles, and permissions.

### Activity Diagram Description

The system's primary activities include:

- **User Authentication**: Login, registration, and role-based access control
- **Profile Management**: Creating and updating personal profiles including academic information
- **Cluster Management**: Creating, browsing, joining, and managing clusters
- **Project Collaboration**: Creating and participating in personal and cluster-based projects
- **Content Sharing**: Writing, approving, and sharing blog posts
- **Academic Session Management**: Managing academic sessions, student level progression, and graduation

### Sequence Diagram Description

The key system sequences involve:

1. **User Registration**: User → Authentication system → Profile creation → Role assignment
2. **Cluster Joining**: User → Cluster browsing → Request submission → Approval workflow → Membership confirmation
3. **Project Creation**: User → Project creation interface → Project setup → Role assignment → Publication
4. **FYP Submission**: Level 400 Student → FYP module → Proposal submission → Review workflow → Supervisor assignment
5. **Content Approval**: Student author → Content submission → Lead/Staff/Admin review → Approval/rejection → Publication

### State Diagram Description

The system maintains different states for users and entities:

- **User States**: Unregistered → Registered → Profile Complete → Role Defined → Active/Inactive
- **Cluster States**: Created → Active → Inactive → Disbanded
- **Project States**: Created → Pending Approval → Active → Completed → Archived
- **Content States**: Draft → Submitted → Under Review → Approved → Published
- **Academic Session States**: Planned → Active → Completed → Archived

The Swebuk platform provides a comprehensive ecosystem for software engineering students to learn, collaborate, and build their professional portfolios while providing administrators with robust management tools.

## 3.5.2 Architecture Design

The Swebuk platform follows a modern, scalable, and secure three-tier architecture design consisting of the Presentation Layer, Application Layer, and Data Layer. Each layer has distinct responsibilities and communicates through well-defined interfaces.

### System Architecture Overview

The system employs a client-server architecture with the following key components:

1. **Presentation Layer** (Frontend)
2. **Application Layer** (Backend Logic)
3. **Data Layer** (Database and Storage)

### Class Diagram Description

#### Core User Classes
- **UserProfile**: Represents a user in the system with properties:
  - id: UUID
  - full_name: string
  - avatar_url: string
  - role: string (student, deputy, lead, staff, admin)
  - academic_level: string (100-400)
  - department: string
  - faculty: string
  - institution: string
  - linkedin_url: string
  - github_url: string

- **AcademicSession**: Represents academic sessions with properties:
  - id: UUID
  - session_name: string (e.g., "2024/2025")
  - start_date: Date
  - end_date: Date
  - semester: string
  - is_active: boolean

#### Cluster Management Classes
- **Cluster**: Represents clubs/groups with properties:
  - id: UUID
  - name: string
  - description: string
  - lead_id: UUID (foreign key to UserProfile)
  - deputy_id: UUID (foreign key to UserProfile)
  - staff_manager_id: UUID (foreign key to UserProfile)
  - created_by: UUID
  - created_at: Date
  - updated_at: Date

- **ClusterMember**: Represents user-cluster relationships with properties:
  - id: UUID
  - cluster_id: UUID (foreign key to Cluster)
  - user_id: UUID (foreign key to UserProfile)
  - role: string (member, lead, deputy, staff_manager)
  - status: string (pending, approved, rejected)
  - joined_at: Date
  - approved_at: Date
  - approved_by: UUID

#### Project Management Classes
- **Project**: Represents projects with properties:
  - id: UUID
  - title: string
  - description: string
  - owner_id: UUID
  - visibility: string (public, private)
  - created_at: Date
  - updated_at: Date

- **ProjectMember**: Represents user-project relationships with properties:
  - id: UUID
  - project_id: UUID
  - user_id: UUID
  - role: string
  - status: string
  - joined_at: Date

#### Content Management Classes
- **BlogPost**: Represents blog posts with properties:
  - id: UUID
  - title: string
  - content: string
  - author_id: UUID
  - status: string (draft, submitted, approved, published)
  - created_at: Date
  - updated_at: Date
  - published_at: Date

- **Comment**: Represents comments with properties:
  - id: UUID
  - content_id: UUID
  - author_id: UUID
  - comment_text: string
  - created_at: Date

#### Notification System Classes
- **Notification**: Represents system notifications with properties:
  - id: UUID
  - user_id: UUID
  - title: string
  - message: string
  - type: string
  - is_read: boolean
  - created_at: Date

#### Final Year Project Classes
- **FinalYearProject**: Represents FYPs with properties:
  - id: UUID
  - student_id: UUID
  - title: string
  - description: string
  - supervisor_id: UUID
  - status: string (proposed, approved, in_progress, completed)
  - proposal_document: string
  - report_document: string
  - created_at: Date
  - updated_at: Date

### Package Diagram Description

The system is organized into logical packages that represent different functional areas:

1. **Authentication Package**
   - Handles user registration, login, and session management
   - Integrates with Supabase authentication services
   - Manages JWT tokens and role-based access control

2. **User Management Package**
   - Manages user profiles and academic details
   - Handles role assignments and permissions
   - Manages profile updates and avatar uploads

3. **Cluster Management Package**
   - Handles cluster creation, browsing, and joining
   - Manages cluster membership requests and approvals
   - Facilitates cluster-specific communications

4. **Project Management Package**
   - Manages project creation, collaboration, and lifecycle
   - Handles project membership requests and role assignments
   - Provides project management tools and workflows

5. **Content Management Package**
   - Manages blog posts, comments, and content approval workflows
   - Handles content categorization and discovery
   - Provides editorial tools for administrators and staff

6. **Communication Package**
   - Manages notifications, chat, and messaging
   - Handles real-time communication features
   - Provides notification delivery and management

7. **Academic Session Management Package**
   - Manages academic sessions and student level progression
   - Handles automated academic level updates
   - Manages graduation and alumni transitions

8. **Event Management Package**
   - Handles event creation, registration, and attendance tracking
   - Manages event notifications and certificates
   - Provides event analytics and reporting

### Frontend Architecture

The frontend is built using Next.js with the following architectural patterns:

- **Component-Based Architecture**: Modular components organized by functionality
- **State Management**: Context API for global state management
- **Routing**: Next.js file-based routing with role-based access control
- **UI Components**: Reusable UI components using Radix UI primitives and Tailwind CSS
- **Client-Side Services**: Client-side data fetching using Supabase JavaScript library

### Backend Architecture

The backend leverages Supabase which provides:

- **Authentication Service**: Secure user authentication and session management
- **Database Service**: PostgreSQL database with Row Level Security (RLS)
- **Storage Service**: File storage for user avatars and document uploads
- **Real-time Service**: Real-time data synchronization and notifications
- **Edge Functions**: Serverless functions for complex business logic

### Security Architecture

- **Authentication**: JWT-based authentication with role-based access control
- **Authorization**: Row Level Security (RLS) policies for fine-grained data access
- **Data Encryption**: End-to-end encryption for sensitive data
- **Input Validation**: Server-side validation for all user inputs
- **Rate Limiting**: Protection against abuse and denial of service attacks

This architecture ensures maintainability, scalability, and security while providing the flexibility needed for the diverse functionality required in the Swebuk platform.

## 3.5.3 Database Design

The Swebuk platform implements a relational database design using PostgreSQL with Supabase as the backend service. The database schema includes tables for user management, cluster management, project management, content management, and academic session management.

### Entity Relationship Diagram Description

The database consists of the following main entities and their relationships:

#### Core User Tables
- **auth.users** (Supabase built-in table)
  - Stores authentication-related information
  - id: UUID (Primary Key)
  - email: string
  - encrypted_password: string
  - email_confirmed_at: timestamp
  - created_at: timestamp
  - raw_user_meta_data: jsonb

- **profiles** (Public table linked to auth.users)
  - Stores user profile information
  - id: UUID (Primary Key, Foreign Key to auth.users)
  - full_name: string
  - avatar_url: string
  - role: string (student, deputy, lead, staff, admin)
  - academic_level: string (100-400)
  - department: string
  - faculty: string
  - institution: string
  - linkedin_url: string
  - github_url: string

- **academic_sessions**
  - Manages academic sessions
  - id: UUID (Primary Key)
  - session_name: string (unique)
  - start_date: date
  - end_date: date
  - semester: string
  - is_active: boolean
  - created_at: timestamp
  - updated_at: timestamp

#### Cluster Management Tables
- **clusters**
  - Represents clusters (clubs/organizations)
  - id: UUID (Primary Key)
  - name: string
  - description: text
  - lead_id: UUID (Foreign Key to profiles.id)
  - deputy_id: UUID (Foreign Key to profiles.id)
  - staff_manager_id: UUID (Foreign Key to profiles.id)
  - created_by: UUID (Foreign Key to profiles.id)
  - created_at: timestamptz
  - updated_at: timestamptz

- **cluster_members**
  - Manages user-cluster membership relationships
  - id: UUID (Primary Key)
  - cluster_id: UUID (Foreign Key to clusters.id)
  - user_id: UUID (Foreign Key to profiles.id)
  - role: string (member, lead, deputy, staff_manager)
  - status: string (pending, approved, rejected)
  - joined_at: timestamptz
  - approved_at: timestamptz
  - approved_by: UUID (Foreign Key to profiles.id)

#### Project Management Tables
- **projects** (to be implemented)
  - Represents projects
  - id: UUID (Primary Key)
  - title: string
  - description: text
  - owner_id: UUID (Foreign Key to profiles.id)
  - visibility: string (public, private)
  - created_at: timestamptz
  - updated_at: timestamptz

- **project_members** (to be implemented)
  - Manages user-project membership relationships
  - id: UUID (Primary Key)
  - project_id: UUID (Foreign Key to projects.id)
  - user_id: UUID (Foreign Key to profiles.id)
  - role: string
  - status: string (pending, approved, rejected)
  - joined_at: timestamptz

#### Content Management Tables
- **blog_posts** (to be implemented)
  - Manages blog posts
  - id: UUID (Primary Key)
  - title: string
  - content: text
  - author_id: UUID (Foreign Key to profiles.id)
  - status: string (draft, submitted, approved, published)
  - created_at: timestamptz
  - updated_at: timestamptz
  - published_at: timestamptz

- **comments** (to be implemented)
  - Manages comments on various content
  - id: UUID (Primary Key)
  - content_id: UUID (Generic reference to content)
  - content_type: string (blog_post, project, etc.)
  - author_id: UUID (Foreign Key to profiles.id)
  - comment_text: text
  - created_at: timestamptz

- **notifications** (to be implemented)
  - Manages system notifications
  - id: UUID (Primary Key)
  - user_id: UUID (Foreign Key to profiles.id)
  - title: string
  - message: text
  - type: string (request, approval, system, etc.)
  - is_read: boolean
  - created_at: timestamptz

#### Final Year Project Tables
- **final_year_projects** (to be implemented)
  - Manages Final Year Projects for level 400 students
  - id: UUID (Primary Key)
  - student_id: UUID (Foreign Key to profiles.id)
  - title: string
  - description: text
  - supervisor_id: UUID (Foreign Key to profiles.id)
  - status: string (proposed, approved, in_progress, completed)
  - proposal_document: string
  - report_document: string
  - created_at: timestamptz
  - updated_at: timestamptz

#### Event Management Tables (Future Implementation)
- **events** (to be implemented)
  - Manages system events
  - id: UUID (Primary Key)
  - title: string
  - description: text
  - event_date: date
  - location: string
  - organizer_id: UUID (Foreign Key to profiles.id)
  - created_at: timestamptz

- **event_registrations** (to be implemented)
  - Manages event registration
  - id: UUID (Primary Key)
  - event_id: UUID (Foreign Key to events.id)
  - user_id: UUID (Foreign Key to profiles.id)
  - registration_date: timestamptz
  - attendance_status: string (registered, attended, absent)

### Key Relationships

1. **One-to-One Relationship**:
   - Each user in `auth.users` has exactly one corresponding profile in `profiles` table
   - Foreign key: profiles.id references auth.users.id

2. **One-to-Many Relationships**:
   - One user (profile) can create multiple clusters (via created_by in clusters table)
   - One user can be lead, deputy, or staff manager of multiple clusters
   - One academic session can have many students associated with it
   - One cluster can have many members in the cluster_members table

3. **Many-to-Many Relationships** (implemented via junction tables):
   - Users and clusters: Implemented through the cluster_members table
   - Users and projects: Will be implemented through the project_members table (future)
   - Users and events: Will be implemented through the event_registrations table (future)

### Database Constraints and Indexes

#### Primary Keys
- All tables use UUID as primary key with gen_random_uuid() as default

#### Foreign Key Constraints
- Referential integrity ensures data consistency between related tables
- CASCADE delete operations where appropriate (e.g., deleting cluster deletes all its members)

#### Check Constraints
- Role values are restricted to predefined values (student, deputy, lead, staff, admin)
- Status values are restricted to predefined values (pending, approved, rejected for cluster members)

#### Indexes
- Created on frequently queried columns for performance optimization
- Indexes on foreign key columns (e.g., cluster_id, user_id in cluster_members)
- Indexes on status columns for efficient filtering

### Security Implementation

#### Row Level Security (RLS)
- Enabled for all public tables to enforce data access policies
- Each table has appropriate policies based on user roles and ownership
- Example: Only cluster leads, staff, and admins can manage cluster members

#### Policies
- Read: Define who can view records (e.g., public profiles accessible to everyone)
- Insert: Define who can create records (e.g., users can insert their own profile)
- Update: Define who can modify records (e.g., users can update own profile)
- Delete: Define who can delete records (e.g., only admins can delete clusters)

This database design provides a robust foundation for the Swebuk platform, supporting all required functionality while ensuring data integrity, security, and performance.