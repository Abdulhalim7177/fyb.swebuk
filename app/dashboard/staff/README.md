# Staff Dashboard Documentation

## Overview
The Staff Dashboard empowers faculty and staff members to manage student clusters, oversee projects, create events, and supervise Final Year Projects (FYP).

## Use Case Diagram

```mermaid
%%{init: {'theme': 'default'}}%%
graph TB
    subgraph "Staff Use Cases"
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
        UC22[Supervise FYP]
    end

    Staff -- "Dashboard Access" --> UC3
    Staff -- "Content Consumption" --> UC10
    Staff -- "Event Participation" --> UC11
    Staff -- "Portfolio Access" --> UC13
    Staff -- "Profile Management" --> UC14
    Staff -- "Profile Management" --> UC15
    Staff -- "Project Management" --> UC18
    Staff -- "Content Moderation" --> UC19
    Staff -- "Cluster Management" --> UC20
    Staff -- "Event Management" --> UC21
    Staff -- "FYP Supervision" --> UC22
```

## Use Case Descriptions

| ID | Use Case | Description | Preconditions | Postconditions |
|----|----------|-------------|---------------|----------------|
| **UC3** | View Dashboard | User accesses the staff dashboard to view relevant information and metrics. | User is authenticated as staff. | User views personalized dashboard. |
| **UC10** | View Blog Posts | User views published blog posts. | User is authenticated. | User has viewed blog posts. |
| **UC11** | View Events | User views available upcoming events. | User is authenticated. | User has viewed available events. |
| **UC13** | Access Portfolio | User accesses their portfolio section. | User is authenticated. | User has accessed their portfolio. |
| **UC14** | Update Profile | User updates their profile information. | User is authenticated. | User profile is updated. |
| **UC15** | Upload Profile Picture | User uploads or changes their profile picture. | User is authenticated. | User's profile picture is updated. |
| **UC18** | Approve Projects | Staff member approves student project proposals. | User is authorized and projects require approval. | Project is approved or rejected. |
| **UC19** | Approve Blog Posts | Staff member reviews and approves student blog posts. | User is authorized and posts require approval. | Blog post is approved or rejected. |
| **UC20** | Manage Clusters | Staff member manages assigned clusters (members, activities). | User has staff role and assigned clusters. | Cluster management tasks are performed. |
| **UC21** | Manage Events | Staff member creates and manages events (registrations, attendance). | User has staff role. | Event is created and managed. |
| **UC22** | Supervise FYP | Supervisor reviews and provides feedback on FYP submissions. | User is a supervisor with assigned students. | FYP supervision is performed and recorded. |
