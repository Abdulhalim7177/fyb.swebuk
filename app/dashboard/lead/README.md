# Lead Student Dashboard Documentation

## Overview
The Lead Student Dashboard allows cluster leads to manage their assigned student cluster. This includes approving members, overseeing projects within the cluster, and moderating content, in addition to all standard student functionalities.

## Use Case Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#90EE90', 'edgeLabelBackground':'#ffffff', 'tertiaryColor': '#f4f4f4'}}}%%
graph LR
    %% Styles
    classDef actor fill:#32CD32,stroke:#333,stroke-width:2px,color:white,font-size:16px;
    classDef usecase fill:#90EE90,stroke:#228B22,stroke-width:2px,color:black,shape:rect;
    classDef lead fill:#FFD700,stroke:#DAA520,stroke-width:2px,color:black,shape:rect;

    %% Actor
    LeadStudent([⭐ Lead Student]):::actor

    %% Use Cases
    subgraph LeadDuties ["👔 Leadership Duties"]
        direction TB
        UC17[Approve Members]:::lead
        UC18[Approve Projects]:::lead
        UC19[Approve Blogs]:::lead
    end

    subgraph Standard ["🎒 Student Activities"]
        direction TB
        UC6[Create Projects]:::usecase
        UC3[View Dashboard]:::usecase
        UC4[Browse Clusters]:::usecase
        UC5[Join Clusters]:::usecase
        UC7[Browse Projects]:::usecase
        UC8[Join Projects]:::usecase
        UC9[Create Blog]:::usecase
        UC10[View Blogs]:::usecase
        UC11[View Events]:::usecase
        UC12[Join Events]:::usecase
        UC13[Access Portfolio]:::usecase
        UC14[Update Profile]:::usecase
        UC15[Upload Picture]:::usecase
        UC16[Access FYP (L400)]:::usecase
    end
    
    %% Connections
    LeadStudent --> LeadDuties
    LeadStudent --> Standard
    
    %% Direct links
    LeadStudent --> UC17
    LeadStudent --> UC6
```

## Use Case Descriptions

| ID | Use Case | Description | Preconditions | Postconditions |
|----|----------|-------------|---------------|----------------|
| **UC17** | Approve Cluster Members | Lead Student approves or rejects membership requests for their cluster. | User is Cluster Lead and requests exist. | Membership request is approved or rejected. |
| **UC18** | Approve Projects | Lead Student approves projects submitted to their cluster. | User is Cluster Lead and projects await approval. | Project is approved or rejected. |
| **UC19** | Approve Blog Posts | Lead Student approves blog posts submitted by cluster members. | User is Cluster Lead and posts await approval. | Blog post is approved or rejected. |
| **UC3** | View Dashboard | User accesses the dashboard. Leads see management tools in addition to student views. | User is authenticated. | User views personalized dashboard. |
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
| **UC16** | Access FYP Module | Level 400 Leads access FYP module. | User is Level 400. | Access to FYP features. |

## Activity Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'mainBkg': '#ffffff', 'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#d3d3d3', 'lineColor': '#d3d3d3'}}}%%
flowchart TD
    classDef default fill:#ffffff,stroke:#d3d3d3,stroke-width:4px,color:#000;
    linkStyle default stroke:#d3d3d3,stroke-width:4px;

    Start((Start)) --> Login[Log In]
    Login --> Dash{View Dashboard}
    
    Dash -->|Cluster Mgmt| CheckReq{Pending Requests?}
    Dash -->|Projects| ManageProj[Create / Manage Cluster Projects]
    Dash -->|Student Acts| StudentActs[Join Events / Personal Projects]
    
    CheckReq -->|Members| ReviewMem[Review Membership]
    CheckReq -->|Projects| ReviewProj[Review Project Join]
    CheckReq -->|Blogs| ReviewBlog[Review Blogs]
    
    ReviewMem --> DecMem{Decision}
    ReviewProj --> DecProj{Decision}
    ReviewBlog --> DecBlog{Decision}
    
    DecMem -->|Approve/Reject| DoneMem[Update Member Status]
    DecProj -->|Approve/Reject| DoneProj[Update Project Status]
    DecBlog -->|Approve/Reject| DoneBlog[Update Blog Status]
    
    DoneMem --> End((End))
    DoneProj --> End
    DoneBlog --> End
    StudentActs --> End
    ManageProj --> End
    
    style Start fill:#ffffff,stroke:#d3d3d3,stroke-width:4px
    style End fill:#ffffff,stroke:#d3d3d3,stroke-width:4px
```
