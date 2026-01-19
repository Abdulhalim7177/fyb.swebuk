# Student Dashboard Documentation

## Overview
The Student Dashboard is the central hub for all student activities on the Swebuk platform. It provides access to clusters, projects, events, and for Level 400 students, the Final Year Project (FYP) module.

## Use Case Diagram

```mermaid
%%{init: {'theme': 'default'}}%%
graph TB
    subgraph "Student Use Cases"
        UC1[Register Account]
        UC2[Complete Academic Profile]
        UC3[View Dashboard]
        UC4[Browse Clusters]
        UC5[Join Clusters]
        UC6[Create Personal Projects]
        UC7[Browse Projects]
        UC8[Request to Join Projects]
        UC9[Create Blog Posts]
        UC10[View Blog Posts]
        UC11[View Events]
        UC12[Register for Events]
        UC13[Access Portfolio]
        UC14[Update Profile]
        UC15[Upload Profile Picture]
        UC16[Access FYP Module]
    end

    Student -- "Account Management" --> UC1
    Student -- "Profile Management" --> UC2
    Student -- "Dashboard Access" --> UC3
    Student -- "Cluster Activities" --> UC4
    Student -- "Cluster Activities" --> UC5
    Student -- "Project Activities" --> UC6
    Student -- "Project Activities" --> UC7
    Student -- "Project Activities" --> UC8
    Student -- "Content Creation" --> UC9
    Student -- "Content Consumption" --> UC10
    Student -- "Event Participation" --> UC11
    Student -- "Event Participation" --> UC12
    Student -- "Portfolio Access" --> UC13
    Student -- "Profile Management" --> UC14
    Student -- "Profile Management" --> UC15
    Student -- "Level 400 Only" --> UC16
```

## Use Case Descriptions

| ID | Use Case | Description | Preconditions | Postconditions |
|----|----------|-------------|---------------|----------------|
| **UC1** | Register Account | A new user creates an account on the Swebuk platform. | User is not registered. | User has a verified account. |
| **UC2** | Complete Academic Profile | A newly registered user completes their academic profile (level, department, etc.). | User has a verified account. | User has a complete academic profile. |
| **UC3** | View Dashboard | User accesses the student dashboard to view relevant information. | User is authenticated as a student. | User views personalized dashboard. |
| **UC4** | Browse Clusters | User browses available clusters (clubs) to join. | User is authenticated. | User has viewed available clusters. |
| **UC5** | Join Clusters | User requests to join a cluster. | User is authenticated and cluster exists. | Membership request is pending approval. |
| **UC6** | Create Personal Projects | User creates a personal project workspace. | User is authenticated. | Project is created and owned by the user. |
| **UC7** | Browse Projects | User browses available public projects. | User is authenticated. | User has viewed available projects. |
| **UC8** | Request to Join Projects | User requests to join a project owned by another user. | User is authenticated and project exists. | Project join request is pending approval. |
| **UC9** | Create Blog Posts | User creates a blog post which may require approval. | User is authenticated. | Blog post is created and saved (may be pending). |
| **UC10** | View Blog Posts | User views published blog posts. | User is authenticated. | User has viewed blog posts. |
| **UC11** | View Events | User views available upcoming events. | User is authenticated. | User has viewed available events. |
| **UC12** | Register for Events | User registers to attend an event. | User is authenticated and event exists. | User is registered for the event. |
| **UC13** | Access Portfolio | User accesses their portfolio section to view projects and achievements. | User is authenticated. | User has accessed their portfolio. |
| **UC14** | Update Profile | User updates their profile information. | User is authenticated. | User profile is updated. |
| **UC15** | Upload Profile Picture | User uploads or changes their profile picture. | User is authenticated. | User's profile picture is updated. |
| **UC16** | Access FYP Module | Final year (Level 400) student accesses the FYP module for thesis management. | User is authenticated and is Level 400. | User has access to FYP features (proposals, reports). |
