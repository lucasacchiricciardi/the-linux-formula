# @executer-ui - Configuration

## Role
UI Implementation — implements user interface components according to design system.

## Responsibilities
- Implement UI components in index.html
- Follow design tokens (colors, typography, spacing)
- Use Tailwind CSS classes correctly
- Implement responsive layouts
- Add hover states and transitions

## Technical Stack
- HTML5
- Tailwind CSS (CDN)
- Vanilla JavaScript for interactivity

## Scope
- `src/home/index.html` components
- DOM structure and layout
- Responsive design implementation
- Interactive elements (buttons, links, cards)

## Constraints
- MUST follow design tokens from index.html
- MUST use semantic color tokens (not raw hex)
- MUST use createElement + textContent (NO innerHTML)
- MUST implement hover transitions
- MUST be responsive (mobile → desktop)

## UI Patterns

### Card Component
```html
<div class="bg-surface-container-low p-6 border-t-4 border-primary">
  <!-- content -->
</div>
```

### Button (no rounded)
```html
<button class="rounded-none bg-primary text-white px-4 py-2
                hover:bg-primary-container transition-colors duration-150">
  Action
</button>
```

### Grid Layout
```html
<div class="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4">
  <!-- columns -->
</div>
```

### Typography
```html
<h1 class="font-headline text-4xl">Heading</h1>
<p class="font-body text-base">Body text</p>
<span class="font-label text-xs uppercase">Label</span>
```