# Swebuk System Documentation for Claude

## Project Overview
Swebuk (Software Engineering Student Club) is an online tech community platform designed to connect software engineering students across academic levels. This Next.js application with Supabase backend provides collaboration tools, project management, club participation, event registration, blogging, and professional portfolio building capabilities.

## Current Implementation Status
**Phase**: Early Development - Foundation Complete
- ✅ Next.js 14+ with App Router
- ✅ Supabase integration (auth, database, storage)
- ✅ User authentication flows (signup, login, password reset)
- ✅ Basic protected routes and user dashboard
- ❌ Core application features (pending implementation)
- ❌ Role-based dashboards (pending implementation)

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with modern design patterns
- **State Management**: React hooks, React Query for server state
- **Real-time**: Supabase Realtime subscriptions
- **Animations**: Framer Motion (installed)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **API**: RESTful API via Supabase

## User Roles & Permissions System

### Role Hierarchy
1. **Student** (Base role)
   - Join clusters, participate in projects
   - Create personal projects (public/private)
   - Write blog posts (requires approval)
   - Can be promoted to leadership roles
   - Level 400+ gets FYP module access

2. **Deputy Lead Student**
   - Elevated privileges within one cluster
   - Approve membership requests and blog posts
   - Assist Lead Student with management

3. **Lead Student**
   - Primary manager for one cluster
   - Approve members, projects, blog posts
   - Cluster oversight and management

4. **Staff** (Flexible permissions)
   - Can be FYP Supervisors or Cluster Managers
   - Configurable permissions system
   - User and cluster management capabilities

5. **Administrator**
   - Super-user with full system access
   - Manage all roles and permissions
   - System-wide oversight and analytics

## Core Features to Implement

### 1. Role-Based Dashboards
- **Student Dashboard**: Personal activities, projects, content
- **Lead/Deputy Dashboard**: Student features + cluster management
- **Staff Dashboard**: Permission-based tools (supervision, management)
- **Admin Dashboard**: Complete system overview and controls

### 2. Academic Level System
- User profiles with academic levels (100-400)
- Feature access based on level
- Automatic progression management

### 3. Cluster Management
- Browse/join clusters interface
- Cluster creation (admin only)
- Member management tools for leads
- Cluster-specific content and discussions

### 4. Project Management
- Personal projects (public/private toggle)
- Cluster-based collaborative projects
- Project discovery and join requests
- Approval workflows

### 5. FYP Management (Level 400)
- Project proposal submission
- Supervisor assignment workflow
- Progress tracking and reporting
- Document upload and feedback system

### 6. Content Management
- Blog creation (all users)
- Approval workflow for students
- Commenting and engagement
- Cluster-tagged content

### 7. Communication System
- Real-time notifications center
- Cluster/project chat rooms
- Direct messaging
- Event announcements

### 8. Event Management
- Event creation and management
- Registration system
- Attendance tracking
- Feedback and certificates

### 9. Profile & Portfolio
- Comprehensive user profiles
- Project showcase
- Skills and achievements display
- Professional portfolio building

## Database Schema Structure

### Core Tables
```sql
users (id, email, role, academic_level, profile_data, created_at)
clusters (id, name, description, lead_id, deputy_id, created_at)
cluster_members (id, cluster_id, user_id, joined_at, status)
projects (id, name, description, type, owner_id, cluster_id, is_public, created_at)
project_members (id, project_id, user_id, joined_at, role)
final_year_projects (id, student_id, title, proposal, supervisor_id, status, created_at)
events (id, title, description, date, location, organizer_id, created_at)
event_registrations (id, event_id, user_id, registered_at, attended)
blogs (id, title, content, author_id, cluster_id, status, created_at)
comments (id, blog_id, user_id, content, created_at)
notifications (id, user_id, type, content, read, created_at)
chats (id, room_id, user_id, message, created_at)
```

## File Structure & Organization

### Current Structure
```
/app
  /api              # API routes
  /auth             # Authentication pages
  /dashboard        # Protected dashboard area
  /public           # Public pages (landing, etc.)
/components
  /ui               # Reusable UI components
  /auth             # Authentication components
  /dashboard        # Dashboard-specific components
/lib                # Utility functions and configurations
/public             # Static assets
```

### Planned Structure
```
/app
  /clusters         # Cluster management pages
  /projects         # Project pages and management
  /fyp              # Final Year Project module
  /events           # Event pages
  /blog             # Blog section
  /profile          # User profiles
  /admin            # Administrative interface
/components
  /clusters         # Cluster-related components
  /projects         # Project components
  /events           # Event components
  /blog             # Blog components
  /chat             # Communication components
```

## Development Guidelines for Claude

### Code Style
- Use TypeScript for type safety
- Follow Next.js App Router conventions
- Implement responsive design with Tailwind CSS
- Use server components where appropriate
- Implement proper error boundaries

### Authentication Patterns
- Use middleware for route protection
- Implement role-based access control (RBAC)
- Use Supabase auth helpers for session management
- Handle authentication states properly

### Database Interactions
- Use Supabase client for database operations
- Implement proper error handling
- Use React Query for data fetching and caching
- Implement optimistic updates where appropriate

### Real-time Features
- Use Supabase Realtime subscriptions
- Handle connection states properly
- Implement proper cleanup for subscriptions
- Use optimistic UI updates

### Performance Considerations
- Implement proper loading states
- Use code splitting for large components
- Optimize images and assets
- Implement caching strategies

## Implementation Priority

### Phase 1: Core Foundation
1. Role-based dashboard routing
2. User profile management
3. Academic level system
4. Basic cluster functionality

### Phase 2: Collaboration Features
1. Project management system
2. Blog and content creation
3. Communication features
4. Notification system

### Phase 3: Advanced Features
1. FYP management system
2. Event management
3. Advanced admin tools
4. Portfolio features

### Phase 4: Enhancement
1. Performance optimization
2. Advanced analytics
3. AI integration considerations
4. Mobile responsiveness improvements

## Security Considerations
- Implement proper RLS (Row Level Security) policies in Supabase
- Validate all user inputs
- Sanitize content to prevent XSS
- Implement rate limiting for API endpoints
- Use HTTPS for all communications
- Implement proper session management

## Testing Strategy
- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows
- Component testing for UI components
- Database testing with proper fixtures

This documentation serves as the primary reference for Claude when working on the Swebuk project. All implementation decisions should align with the architecture and patterns outlined here.
- # Error Type
Console Error

## Error Message
Error fetching certificates: {}


    at getMyCertificates (lib\supabase\event-student-actions.ts:464:15)
    at MyCertificates (app\dashboard\student\events\page.tsx:276:24)
    at StudentEventsPage (app\dashboard\student\events\page.tsx:372:13)

## Code Frame
  462 |
  463 |     if (error) {
> 464 |       console.error("Error fetching certificates:", error);
      |               ^
  465 |       return [];
  466 |     }
  467 |

Next.js version: 16.0.10 (Turbopack)