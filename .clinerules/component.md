# Component Splitting & Maintainability Rules (componentsplit.md)

## 1. File Length & Component Splitting Thresholds

To maintain high readability and clean architecture within Next.js (App Router), you must prevent React files from becoming monolithic. Large, deeply nested JSX structures must be broken down into dedicated sub-components.

- **Soft Limit:** Any component file exceeding **150–200 lines of code** should be audited for splitting.
- **Deep Nesting Limit:** If a specific block of JSX is nested deeper than **4–5 levels**, extract that block into a clean, standalone sub-component.

## 2. When to Split (Mandatory Extraction)

You must extract JSX elements into separate files under the following conditions:

- **Repetitive UI Elements:** Lists items, cards, table rows, or form inputs that render inside a `.map()` loop (e.g., extract `AssessmentCard` from a loop inside `page.tsx`).
- **Heavy State Management:** If a section of the page manages its own complex state independently (e.g., modals, multistep forms, multi-tab layout configurations).
- **Complex UI Sections:** Sidebar navigational panels, complex configuration steps (like `ConfigStep`), or detailed summary blocks.

## 3. When NOT to Split (Keep It Local)

Do not over-engineer the structure. Keep elements within the same file if:

- The component is **under 100 lines** and highly readable.
- The element is a simple styling wrapper or semantic layout container (e.g., a simple header row or static instructional text).
- Splitting would introduce severe prop-drilling or overly complex state synchronization over small, trivial UI parts.

## 4. Next.js Structural Standards

When splitting components in this repository, you must adhere to this structural convention:

```text
src/
└── components/
    └── dashboard/            # Group by domain or feature
        ├── InputStep.tsx     # Extracted sub-component
        ├── ConfigStep.tsx    # Extracted sub-component
        └── ProgressBar.tsx   # Extracted sub-component
src/
└── app/
    └── dashboard/
        └── page.tsx          # Clean, high-level coordinator page
```

- **Client vs. Server:** Pay attention to Next.js Client Boundaries. Keep heavy client interactivity inside extracted `"use client"` components so the parent page layout remains optimized.
