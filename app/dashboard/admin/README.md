# Admin Dashboard Documentation

## Overview
The Admin Dashboard provides full control over the Swebuk platform, allowing administrators to manage users, academic sessions, system settings, and oversee all platform activities.

## Use Case Diagram

```mermaid
%%{init: {'theme': 'default'}}%%
graph TB
    subgraph "Administrative Use Cases"
        UC3[View Dashboard]
        UC10[View Blog Posts]
        UC11[View Events]
        UC13[Access Portfolio]
        UC14[Update Profile]
        UC15[Upload Profile Picture]
        UC18[Approve Projects]
        UC19[Approve Blog Posts]
        UC20[Manage Clusters]
        UC21[Manage Events]
        UC23[Manage Users]
        UC24[Manage Academic Sessions]
        UC25[Manage System Settings]
        UC26[Override Decisions]
        UC27[Promote Students]
        UC28[Assign Staff Roles]
    end

    Administrator -- "Dashboard Access" --> UC3
    Administrator -- "Content Consumption" --> UC10
    Administrator -- "Event Participation" --> UC11
    Administrator -- "Portfolio Access" --> UC13
    Administrator -- "Profile Management" --> UC14
    Administrator -- "Profile Management" --> UC15
    Administrator -- "Project Management" --> UC18
    Administrator -- "Content Moderation" --> UC19
    Administrator -- "Cluster Management" --> UC20
    Administrator -- "Event Management" --> UC21
    Administrator -- "User Management" --> UC23
    Administrator -- "Academic Management" --> UC24
    Administrator -- "System Configuration" --> UC25
    Administrator -- "System Control" --> UC26
    Administrator -- "Role Management" --> UC27
    Administrator -- "Role Management" --> UC28
```

## Use Case Descriptions

| ID | Use Case | Description | Preconditions | Postconditions |
|----|----------|-------------|---------------|----------------|
| **UC3** | View Dashboard | User accesses the admin dashboard to view system-wide metrics and alerts. | User is authenticated as admin. | User views admin dashboard. |
| **UC10** | View Blog Posts | User views published blog posts. | User is authenticated. | User has viewed blog posts. |
| **UC11** | View Events | User views available upcoming events. | User is authenticated. | User has viewed available events. |
| **UC13** | Access Portfolio | User accesses their portfolio section. | User is authenticated. | User has accessed their portfolio. |
| **UC14** | Update Profile | User updates their profile information. | User is authenticated. | User profile is updated. |
| **UC15** | Upload Profile Picture | User uploads or changes their profile picture. | User is authenticated. | User's profile picture is updated. |
| **UC18** | Approve Projects | Admin approves student project proposals (system-wide). | User is admin and projects require approval. | Project is approved or rejected. |
| **UC19** | Approve Blog Posts | Admin reviews and approves blog posts (system-wide). | User is admin and posts require approval. | Blog post is approved or rejected. |
| **UC20** | Manage Clusters | Admin manages all clusters (create, edit, delete, assign staff). | User is admin. | Cluster management tasks are performed. |
| **UC21** | Manage Events | Admin creates and manages events system-wide. | User is admin. | Event is created and managed. |
| **UC23** | Manage Users | Administrator manages all users (view, edit, promote, demote). | User has administrator role. | User management changes are applied. |
| **UC24** | Manage Academic Sessions | Administrator creates, edits, or archives academic sessions. | User has administrator role. | Academic sessions are managed. |
| **UC25** | Manage System Settings | Administrator configures global system settings. | User has administrator role. | System settings are updated. |
| **UC26** | Override Decisions | Administrator overrides system decisions or staff actions. | User has administrator role. | Decision is overridden. |
| **UC27** | Promote Students | Administrator promotes students to leadership roles (Lead, Deputy). | User has administrator role. | Student is promoted to leadership role. |
| **UC28** | Assign Staff Roles | Administrator assigns roles/permissions to staff members. | User has administrator role. | Staff member has updated roles. |
