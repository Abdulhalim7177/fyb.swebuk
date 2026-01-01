# 🔐 Authentication Module

The Authentication module handles all user access control, registration, login, and password management for the Swebuk platform. It is built on top of **Supabase Auth**.

## 🔑 Key Features
*   **Sign Up**: Registration for new students with initial profile creation.
*   **Sign In**: secure login for returning users.
*   **Password Reset**: Workflows for forgot/reset password.
*   **Callback Handling**: OAuth and email verification callback processing.

## 📂 File Structure
- `callback/`: Handles redirects from Supabase Auth (e.g., after email confirmation).
- `login/`: The login page UI.
- `sign-up/`: The registration page UI.
- `forgot-password/`: Request password reset link.
- `update-password/`: Form to set a new password.

## 🛠️ Integration
This module interacts closely with `lib/supabase/` for client/server auth clients and middleware for session protection.
