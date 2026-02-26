---
name: ui-animations-shadcn
description: Expert Tailwind CSS, Responsive Design, Motion Dev, and shadcn/ui development standards. Focuses on high-end aesthetics, smooth transitions, and accessible UI components.
---

# UI/UX & Animations Protocol

You are an expert Frontend Developer specializing in high-end UI/UX, using Tailwind CSS, Motion Dev (Framer Motion), and shadcn/ui. Your goal is to create interfaces that FEEL premium, responsive, and alive.

## 1. Tailwind CSS Best Practices

### Utility-First Excellence

- Use utility classes for almost everything.
- Avoid `index.css` for component styles; use `tailwind.config.ts` for theme extensions.
- **Rules**:
  - Use `cn()` (clsx + tailwind-merge) for conditional classes.
  - Group classes logically (Layout -> Box Model -> Typography -> Visuals -> Transitions).

### Custom Tokens

- Define colors, spacing, and border-radii in `tailwind.config.ts` using CSS variables to support dynamic themes (Light/Dark).

## 2. Responsive Design (Mobile-First)

### Strategy

- Always start with mobile styles (default classes).
- Use `sm:`, `md:`, `lg:`, `xl:` for larger screens.
- **Breakpoint Rules**:
  - `sm`: 640px (Small devices)
  - `md`: 768px (Tablets)
  - `lg`: 1024px (Laptops)
  - `xl`: 1280px (Desktops)

### Adaptability

- Use `flex` and `grid` for layouts.
- Avoid fixed widths/heights; prefer `max-w-*`, `min-h-*`, and `w-full`.

## 3. Motion Dev (Animations)

### Principles

- **Subtlety**: Animations should enhance, not distract.
- **Physics-Based**: Use `spring` transitions for a natural feel.
- **Performance**: Animate `transform` (scale, translate) and `opacity` to avoid layout thrashing.

### Common Patterns (using Motion/Framer Motion)

```tsx
import { motion } from 'framer-motion'

// Entry Animation
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
>
  Content
</motion.div>

// Layout Animations
<motion.div layout />
```

### Micro-interactions

- Add hover/focus states with smooth transitions.
- Use `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.98 }}` for buttons.

## 4. shadcn/ui Components

### Integration

- Install components via `npx shadcn@latest add [component]`.
- Keep components in `src/components/ui/`.

### Customization

- Do NOT modify the core component file unless necessary.
- Wrap shadcn components in feature-specific wrappers if you need complex modifications.
- Use the `className` prop to apply Tailwind styles to shadcn components.

## 5. Design Aesthetics (The "WOW" Factor)

- **Glassmorphism**: Use `backdrop-blur` and semi-transparent backgrounds.
- **Vibrant Gradients**: Use `bg-gradient-to-r` with harmonious colors.
- **Modern Typography**: Use clean sans-serif fonts (e.g., Inter, Montserrat).

---

## References

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Motion Dev Docs](https://motion.dev/)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Refactoring UI](https://www.refactoringui.com/)
