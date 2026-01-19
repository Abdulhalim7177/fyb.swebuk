# Deputy Lead Student Dashboard Documentation

## Overview
The Deputy Lead Student Dashboard allows students appointed as deputies to assist the Cluster Lead in managing their cluster. This includes approving members and moderating content, in addition to all standard student functionalities.

## Use Case Diagram

```mermaid
%%{init: {'theme': 'default'}}%%
graph TB
    subgraph "Deputy Lead Student Use Cases"
        UC17[Approve Cluster Members]
        UC19[Approve Blog Posts]

        subgraph "Standard Student Use Cases"
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
    end

    DeputyLeadStudent -- "Cluster Management" --> UC17
    DeputyLeadStudent -- "Content Moderation" --> UC19
    DeputyLeadStudent -- "Dashboard Access" --> UC3
    DeputyLeadStudent -- "Cluster Activities" --> UC4
    DeputyLeadStudent -- "Cluster Activities" --> UC5
    DeputyLeadStudent -- "Project Activities" --> UC6
    DeputyLeadStudent -- "Project Activities" --> UC7
    DeputyLeadStudent -- "Project Activities" --> UC8
    DeputyLeadStudent -- "Content Creation" --> UC9
    DeputyLeadStudent -- "Content Consumption" --> UC10
    DeputyLeadStudent -- "Event Participation" --> UC11
    DeputyLeadStudent -- "Event Participation" --> UC12
    DeputyLeadStudent -- "Portfolio Access" --> UC13
    DeputyLeadStudent -- "Profile Management" --> UC14
    DeputyLeadStudent -- "Profile Management" --> UC15
    DeputyLeadStudent -- "Level 400 Only" --> UC16
```

## Use Case Descriptions

| ID | Use Case | Description | Preconditions | Postconditions |
|----|----------|-------------|---------------|----------------|
| **UC17** | Approve Cluster Members | Deputy Lead approves or rejects membership requests for their cluster. | User is Deputy Lead and requests exist. | Membership request is approved or rejected. |
| **UC19** | Approve Blog Posts | Deputy Lead approves blog posts submitted by cluster members. | User is Deputy Lead and posts await approval. | Blog post is approved or rejected. |
| **UC3** | View Dashboard | User accesses the dashboard. Deputies see management tools. | User is authenticated. | User views personalized dashboard. |
| **UC4** | Browse Clusters | User browses available clusters. | User is authenticated. | User has viewed available clusters. |
| **UC5** | Join Clusters | User requests to join other clusters. | User is authenticated. | Membership request is pending. |
| **UC6** | Create Personal Projects | User creates a personal project. | User is authenticated. | Project is created. |
| **UC7** | Browse Projects | User browses available projects. | User is authenticated. | User has viewed projects. |
| **UC8** | Request to Join Projects | User requests to join a project. | User is authenticated. | Join request is pending. |
| **UC9** | Create Blog Posts | User creates a blog post. | User is authenticated. | Post is created. |
| **UC10** | View Blog Posts | User views blog posts. | User is authenticated. | User has viewed posts. |
| **UC11** | View Events | User views events. | User is authenticated. | User has viewed events. |
| **UC12** | Register for Events | User registers for an event. | User is authenticated. | User is registered. |
| **UC13** | Access Portfolio | User accesses portfolio. | User is authenticated. | User has accessed portfolio. |
| **UC14** | Update Profile | User updates profile. | User is authenticated. | Profile is updated. |
| **UC15** | Upload Profile Picture | User uploads profile picture. | User is authenticated. | Picture is updated. |
| **UC16** | Access FYP Module | Level 400 Deputies access FYP module. | User is Level 400. | Access to FYP features. |
