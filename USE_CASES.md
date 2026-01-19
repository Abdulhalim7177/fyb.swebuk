# Swebuk Use Case Interactions

This document visualizes the interactions and system flows for key operations within the Swebuk platform using Mermaid.js.

## 1. Overall Use Case Diagram

```mermaid
useCaseDiagram
    actor "Student (Level 400)" as Student
    actor "Lead / Deputy Lead" as Lead
    actor "Staff (Supervisor)" as Supervisor
    actor "Administrator" as Admin

    package "FYP Module" {
        usecase "Submit FYP Proposal" as UC_SubmitFYP
        usecase "Provide FYP Feedback" as UC_Feedback
    }

    package "Cluster Management" {
        usecase "Approve Cluster Membership" as UC_ApproveMember
    }

    package "User Management" {
        usecase "Promote Student to Leadership" as UC_Promote
    }

    Student --> UC_SubmitFYP
    Lead --> UC_ApproveMember
    Supervisor --> UC_Feedback
    Admin --> UC_Promote
```

---

## 2. Interaction Flows (Sequence Diagrams)

### 2.1. Submit FYP Proposal (Table 3.1)
**Actor:** Student (Level 400)

```mermaid
sequenceDiagram
    participant Student
    participant Portal as FYP Portal
    participant System
    participant DB as Database

    Student->>Portal: Navigate to FYP Portal
    System->>Student: Display Proposal Submission Form
    Student->>Portal: Enter Title, Description & Upload PDF
    Student->>Portal: Click "Submit Proposal"
    
    alt Validation Successful
        System->>System: Validate fields & PDF format
        System->>DB: Save proposal (Status: "Proposed")
        DB-->>System: Confirmation
        System-->>Student: Display Success Message
    else Validation Failed (5b)
        System-->>Student: Display Error (Missing info/Wrong format)
        Student->>Portal: Correct entry and resubmit
    end
```

### 2.2. Approve Cluster Membership (Table 3.2)
**Actor:** Lead Student / Deputy Lead

```mermaid
sequenceDiagram
    participant Lead as Lead / Deputy Lead
    participant Dash as Cluster Dashboard
    participant System
    participant DB as Database

    Lead->>Dash: Access "Membership Requests" tab
    System->>Lead: Display list of pending requests
    Lead->>Dash: Select specific request

    alt Approve
        Lead->>Dash: Click "Approve"
        System->>DB: Update status to "Approved"
        System->>DB: Add student to Chatroom & Project lists
        System-->>Lead: Update View
    else Reject (3b)
        Lead->>Dash: Click "Reject"
        System->>Lead: Prompt for reason
        Lead->>Dash: Provide reason
        System->>DB: Update status to "Rejected"
        System->>Lead: Notify Student
    end
```

### 2.3. Provide FYP Feedback (Table 3.3)
**Actor:** Staff (Supervisor)

```mermaid
sequenceDiagram
    participant Supervisor
    participant System
    participant DB as Database
    participant Student

    System->>Supervisor: Notify: New report upload
    Supervisor->>System: Select student from tracking list
    System->>Supervisor: Provide download link
    Supervisor->>System: Download and review document
    Supervisor->>System: Enter comments & Set Status (e.g., "Revision Required")
    Supervisor->>System: Click "Submit Feedback"
    
    System->>DB: Save feedback with Timestamp
    System->>Student: Instant Notification

    opt Immediate Meeting (4b)
        Supervisor->>System: Click "Project Chat"
        System->>Student: Initiate Direct Message
    end
```

### 2.4. Promote Student to Leadership (Table 3.4)
**Actor:** Administrator

```mermaid
sequenceDiagram
    participant Admin
    participant Dash as User Management Dashboard
    participant System
    participant DB as Database

    Admin->>Dash: Search for student profile
    Admin->>Dash: Select "Edit Role"
    Admin->>Dash: Choose Role (Lead/Deputy) & Target Cluster
    Admin->>Dash: Click "Confirm Promotion"

    alt Role is Available
        System->>DB: Update User Role & Cluster Link
        DB-->>System: Success
        System-->>Admin: Promotion Confirmed
    else Role already filled (3b)
        System-->>Admin: Warning: "Only one Lead allowed per cluster"
        alt Demote Current
            Admin->>Dash: Confirm Demotion of current Lead
            System->>DB: Update both records
        else Cancel
            Admin->>Dash: Cancel action
        end
    end
```
