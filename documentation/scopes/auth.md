# Auth Feature Documentation

## Overview
This feature implements the authentication frontend logic for the OFF SCREEN admin panel.

## Core Logic
Currently, this is strictly the frontend logic (UI visual layer) for the login page, implemented at `src/features/auth/components/login-page.tsx`. It acts as the initial page mapped to the `/` route as requested. 

It includes visually styling rules derived from a provided custom HTML/Tailwind mockup into a React component utilizing Tailwind v4 syntax.

## Key Components
- `LoginPage`: Main React component built carefully following the specific custom template requested. Includes:
  - Custom Google Fonts integration (Manrope) and Material Symbols Outlined.
  - Form UI for email and password input.
  - "Remember me" option UI.
  - Third-party SSO providers (Google and GitHub) UI.
  - Specialized backdrop mix-blend filters as per design.
