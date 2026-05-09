# OfferPlus Frontend Design System

## Overview

OfferPlus is a modern job application tracking system built with React, TypeScript, and Tailwind CSS. This document outlines the design system, component library, and design patterns used throughout the frontend.

## Design Principles

1. **Clarity** - Clear visual hierarchy and intuitive navigation
2. **Consistency** - Unified design language across all components
3. **Accessibility** - WCAG 2.1 AA compliance with semantic HTML
4. **Responsiveness** - Mobile-first design that works on all devices
5. **Performance** - Optimized for fast load times and smooth interactions

## Color Palette

### Primary Colors
- **Brand Red**: `#861F41` - Primary action buttons and brand identity
- **Brand Dark Red**: `#621531` - Hover/active states

### Semantic Colors
- **Success Green**: `#10B981` (`text-green-600`, `bg-green-100`)
- **Warning Yellow**: `#F59E0B` (`text-yellow-600`, `bg-yellow-100`)
- **Error Red**: `#EF4444` (`text-red-600`, `bg-red-100`)
- **Info Blue**: `#3B82F6` (`text-blue-600`, `bg-blue-100`)

### Neutral Colors
- **White**: `#FFFFFF`
- **Gray 50**: `#F9FAFB` - Light backgrounds
- **Gray 100**: `#F3F4F6` - Subtle backgrounds
- **Gray 200**: `#E5E7EB` - Borders
- **Gray 300**: `#D1D5DB` - Borders (secondary)
- **Gray 500**: `#6B7280` - Secondary text
- **Gray 600**: `#4B5563` - Body text
- **Gray 700**: `#374151` - Body text (darker)
- **Gray 900**: `#111827` - Headings

## Typography

### Font Family
- Primary: System fonts (tailwindcss default stack)
- Code: `Courier New`, monospace

### Font Sizes & Weights
| Size | Usage | Weight |
|------|-------|--------|
| 12px (text-xs) | Helper text, captions | Regular (400) |
| 14px (text-sm) | Labels, secondary text | Regular (400) / Medium (500) |
| 16px (text-base) | Body text | Regular (400) |
| 18px (text-lg) | Card titles, section headers | Medium (500) |
| 20px (text-xl) | Page titles | Bold (700) |
| 30px (text-3xl) | Large headings | Bold (700) |
| 36px (text-4xl) | Hero sections | Bold (700) |

### Line Height
- Headings: 1.2 (tight)
- Body text: 1.5 (normal)
- List items: 1.6 (relaxed)

## Component Library

### Core Components

#### Button
- **Variants**: Primary, Secondary, Outline, Ghost
- **Sizes**: Small, Medium, Large
- **States**: Default, Hover, Active, Disabled
- **Usage**: All interactive actions

```tsx
// Primary button
<button className="bg-[#861F41] text-white hover:bg-[#621531] px-3 py-2 rounded-md text-sm font-medium">
  Action
</button>
```

#### Card
- **Base**: `bg-white rounded-lg shadow`
- **Elevated**: `shadow-lg` for important content
- **Borders**: `border border-gray-200` for subtle definition

```tsx
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-lg font-medium text-gray-900">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</div>
```

#### Input Fields
- **Base**: `block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41]`
- **States**: Default, Focus, Disabled, Error
- **Label**: `block text-sm font-medium text-gray-700 mb-1`

#### Loading Spinners
- **Spinner**: Rotating SVG icon with color variants
- **Pulse**: Pulsing dots animation
- **Skeleton**: Placeholder loading state
- **Bouncing Dots**: Bouncing animation for loaders

#### Feature Card
- Used in hero/landing sections
- Icon + Title + Description layout
- Hover effect with shadow transition

#### Company Logo
- Displays company logos with fallback
- Responsive sizing (24px to 120px)
- Circular shape with fallback initial

#### Search Bar
- Icon-prefixed input field
- Consistent placeholder text
- Focus states match brand colors

#### Navbar
- Fixed top navigation (z-50)
- Responsive mobile menu
- User dropdown with auth actions
- Navigation links with active states

## Layout Patterns

### Page Layout
```
┌─────────────────────────────┐
│      Fixed Navbar (z-50)    │
├─────────────────────────────┤
│                             │
│   Main Content Area         │
│   max-w-7xl mx-auto         │
│   px-4 sm:px-6 lg:px-8      │
│                             │
├─────────────────────────────┤
│      Footer (optional)      │
└─────────────────────────────┘
```

### Content Grid
- **Desktop**: 3-4 columns for dashboards
- **Tablet**: 2 columns
- **Mobile**: 1 column (full width)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>
```

### Cards Grid
- **Gap**: 6 units (24px)
- **Max Width**: 7xl (80rem)
- **Padding**: Horizontal padding adjusts for screen size

## Spacing System

Uses Tailwind's spacing scale (4px base unit):

| Tailwind | Pixels | Usage |
|----------|--------|-------|
| p-2 | 8px | Small padding |
| p-4 | 16px | Default padding |
| p-6 | 24px | Card padding |
| p-8 | 32px | Section padding |
| gap-4 | 16px | Component gap |
| gap-6 | 24px | Default gap |
| gap-8 | 32px | Large gap |

## Responsive Design

### Breakpoints (Tailwind CSS)
- **Mobile**: < 640px (default styles)
- **Tablet**: sm (640px+)
- **Desktop**: md (768px+)
- **Large Desktop**: lg (1024px+)
- **Extra Large**: xl (1280px+)

### Mobile-First Approach
- Default styles apply to mobile
- Use `sm:`, `md:`, `lg:` prefixes for larger screens
- Hide elements on mobile with `hidden sm:flex`

```tsx
<div className="hidden sm:flex items-center space-x-4">
  {/* Desktop-only content */}
</div>
```

## States & Interactions

### Button States
- **Default**: Base styling
- **Hover**: Darker background, subtle shadow
- **Active**: Darker background, inset appearance
- **Disabled**: Gray, reduced opacity, cursor-not-allowed

### Form States
- **Default**: Gray border, white background
- **Focus**: Blue ring, brand color border
- **Filled**: Populated value
- **Error**: Red border, error message
- **Success**: Green accent, checkmark

### Loading States
- Use `LoadingSpinner` component
- Apply to buttons: add spinner icon + disable button
- Show skeleton loaders for content
- Indicate with progress bars where applicable

## Accessibility

### WCAG 2.1 AA Compliance
- Minimum color contrast ratio: 4.5:1 for text
- Focus indicators visible on all interactive elements
- Semantic HTML (`<button>`, `<input>`, `<label>`)
- ARIA labels for icons and custom components

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals/dropdowns
- Arrow keys for menu navigation

### Screen Readers
- Use `aria-label` for icon-only buttons
- Use `aria-hidden="true"` for decorative icons
- Proper heading hierarchy (h1 → h2 → h3)
- List items in `<ul>` or `<ol>`

## Icons

### Icon Library
- **Provider**: lucide-react
- **Usage**: Import specific icons only to reduce bundle size
- **Size**: Usually 4-6 units (h-4 w-4 to h-6 w-6)
- **Color**: Inherit from parent or explicit color class

```tsx
import { Search, Plus, ChevronDown } from 'lucide-react';

<Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
```

## Dark Mode

Not currently implemented but ready for future expansion:
- Use `dark:` prefix for dark mode styles
- Ensure sufficient contrast in both modes
- Test with prefers-color-scheme media query

## Animation & Transitions

### Tailwind Animations
- **Spin**: `animate-spin` - For loading spinners
- **Pulse**: `animate-pulse` - For subtle loading
- **Bounce**: `animate-bounce` - For emphasis
- **Duration**: `duration-300` (default 300ms)

### Hover Effects
- **Shadow**: `hover:shadow-lg transition-shadow duration-300`
- **Color**: `hover:bg-gray-50 hover:text-gray-900 transition-colors`
- **Scale**: `hover:scale-105 transition-transform` (use sparingly)

## Forms

### Form Structure
```tsx
<form className="space-y-6">
  <div>
    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
      Email
    </label>
    <input
      id="email"
      type="email"
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#861F41] focus:border-[#861F41]"
    />
  </div>
</form>
```

### Validation Messages
```tsx
<div className="mt-1 flex items-center space-x-2">
  <span className="text-sm text-red-600">Error message</span>
</div>
```

## Data Tables

### Table Structure
```tsx
<div className="bg-white rounded-lg shadow">
  <table className="w-full">
    <thead>
      <tr className="border-b border-gray-200">
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Column</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 text-sm text-gray-900">Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Status Badges

### Badge Colors
- **Applied**: Blue (`bg-blue-100 text-blue-800`)
- **Interview**: Green (`bg-green-100 text-green-800`)
- **Rejected**: Red (`bg-red-100 text-red-800`)
- **Pending**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Accepted**: Green (`bg-emerald-100 text-emerald-800`)

```tsx
<span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
  Interview
</span>
```

## Storybook

All components have Storybook stories demonstrating:
- Default states
- All variants and sizes
- Edge cases
- Responsive layouts
- Multiple usage examples

Run Storybook with: `npm run storybook`

## Future Enhancements

- [ ] Dark mode support
- [ ] Additional animation patterns
- [ ] Toast notification system
- [ ] Modal/dialog system
- [ ] Tooltip components
- [ ] Pagination components
- [ ] Advanced filter UI
- [ ] Data visualization (charts/graphs)

## Resources

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev
- **React Router**: https://reactrouter.com
- **Supabase**: https://supabase.com/docs
- **Web Accessibility**: https://www.w3.org/WAI/
