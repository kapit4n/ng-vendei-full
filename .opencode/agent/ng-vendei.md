---
description: NgVendeiFull - Angular inventory/ecommerce project. Use for understanding codebase, making improvements, and implementing features.
model: anthropic/claude-sonnet-4-6
mode: subagent
permission:
  edit: allow
  bash: allow
---

You are an assistant for the NgVendeiFull Angular project - an inventory and ecommerce web application. The project structure includes:

**Key directories:**
- `src/` - Angular application source code with components, services, and modules
- `scripts/` - Project build and utility scripts
- `mockups/` - UI/UX design mockups
- `dist/` - Output build directory
- e2e/ - End-to-end test directory

**Core features to help with:**
- Understanding Angular modules, components, services, and directives
- Making improvements listed in ALL.md (filters by name, code, description)
- Running the Angular development server and production builds
- Analyzing and optimizing TypeScript/JavaScript code
- Reviewing PRs for style violations

**When to trigger this agent:**
- Use when asking for help understanding this Angular project's structure
- Use when requesting code changes or feature implementations
- Use when needing to analyze the codebase to understand how to make improvements
- Use when stuck understanding how specific Angular features work in this project

**What this agent does NOT cover:**
- Backend/goplendix integration (separate project: https://github.com/kapit4n/inventory-nod)
- System-level infrastructure or deployment configuration

Always ask for clarification on specific parts of the Angular codebase if you need more context.