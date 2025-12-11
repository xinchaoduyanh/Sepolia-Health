# Web Admin Dashboard - Current Structure Analysis

## Directory Structure
- **Root**: `web/apps/admin/` - Next.js admin application
- **Workspace**: `web/packages/` - Shared packages
  - `ui/` - UI components library (primary styling)
  - `lib/` - Shared utilities and API services
  - `typescript-config/` - TypeScript configuration
  - `eslint-config/` - ESLint configuration

## UI Components & Styling Approach

### 1. UI Library (`@workspace/ui`)
**Location**: `web/packages/ui/`

**Component Architecture**:
- Comprehensive component library with 35+ components
- Built on Radix UI primitives for accessibility
- Uses Tailwind CSS for styling with custom design tokens
- Key components:
  - Forms: `Form`, `FormField`, `InputField`, `Select`, `DatePicker`
  - Layout: `Sidebar`, `Card`, `Dialog`, `Sheet`
  - Data: `DataTable`, `Table`, `Pagination`, `GridList`
  - Feedback: `AlertMessage`, `Sonner` (toasts), `ConfirmDialog`
  - Navigation: `Menu`, `Breadcrumbs`, `Tabs`

### 2. Styling Libraries
- **Tailwind CSS v4.1.11** - Primary utility-first CSS framework
- **@tailwindcss/typography** - Content styling plugin
- **tw-animate-css** - Animation utilities
- **class-variance-authority** - Component variant management
- **tailwind-merge** - Tailwind class merging utilities

### 3. Theme Implementation
**Location**: `web/packages/ui/src/styles/globals.css`

**Current Theme System**:
- CSS Custom Properties for theming
- Light/Dark mode support with `next-themes` dependency
- Color scheme: Medical/Clinical theme
  - Primary: Blue (#0284c7)
  - Secondary: Green (#10b981) 
  - Accent: Cyan (#06b6d4)
  - Sidebar: Gradient from blue → cyan → green

**Theme Variables**:
```css
/* Light Theme */
--background: #e0f2fe;
--foreground: #0f172a;
--primary: #0284c7;
--secondary: #10b981;
--sidebar: linear-gradient(180deg, #0284c7 0%, #06b6d4 50%, #10b981 100%);

/* Dark Theme */
--background: #0f172a;
--foreground: #f8fafc;
--primary: #0ea5e9;
--sidebar: linear-gradient(180deg, #1e293b 0%, #0c4a6e 50%, #065f46 100%);
```

### 4. Component Patterns
- **Radix UI + React ARIA** for accessible components
- **Zustand** for client state management
- **React Query** for server state and data fetching
- **TypeScript** for type safety
- **React Hook Form** + **Zod** for form validation

### 5. Theme Switching Mechanism
- **next-themes** v0.4.6 installed in dependencies
- No theme provider implementation found yet
- CSS custom properties with `.dark` class support
- Theme toggle component not yet implemented

## Current Architecture Summary

### Strengths:
1. Well-structured component library with good separation of concerns
2. Modern styling approach with Tailwind CSS v4
3. Comprehensive component coverage
4. Accessibility-first design with Radix UI
5. Dark mode theme system pre-configured

### Gaps:
1. No theme provider implementation
2. No theme toggle component
3. App structure appears minimal (likely needs development)
4. No global theme context setup

### Recommendations:
1. Implement ThemeProvider using next-themes
2. Create theme toggle component
3. Set up theme persistence
4. Extend app structure with proper theming integration
