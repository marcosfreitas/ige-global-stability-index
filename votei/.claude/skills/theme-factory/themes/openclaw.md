# OpenClaw Theme

**Inspired by:** [openclaw.ai](https://openclaw.ai/)
**Style:** Dark, Modern, High Contrast
**Primary Colors:** Coral & Cyan
**Created:** 2026-02-09

---

## 🎨 Color Palette

### Backgrounds
- **Primary Background**: `#050810` - `oklch(0.08 0.015 250)` - Deep navy-black
- **Surface Level**: `#0a0f1a` - `oklch(0.11 0.015 250)` - Slightly lighter dark
- **Elevated Elements**: `#111827` - `oklch(0.14 0.015 250)` - Card/modal backgrounds
- **Muted Surface**: `oklch(0.16 0.015 250)` - Subtle backgrounds

### Accent Colors
- **Coral Bright**: `#ff4d4d` - `oklch(0.65 0.24 25)` - Primary actions
- **Coral Mid**: `#e63946` - `oklch(0.60 0.22 20)` - Destructive operations
- **Coral Dark**: `#991b1b` - `oklch(0.55 0.20 15)` - Hover states
- **Cyan Bright**: `#00e5cc` - `oklch(0.82 0.15 185)` - Highlights with glow
- **Cyan Mid**: `#14b8a6` - `oklch(0.68 0.14 190)` - Secondary interactions
- **Cyan Muted**: `oklch(0.75 0.12 180)` - Subtle accents

### Text
- **Primary Text**: `#f0f4ff` - `oklch(0.97 0.01 250)` - Near-white, high contrast
- **Secondary Text**: `#8892b0` - `oklch(0.62 0.02 250)` - Muted gray
- **Tertiary Text**: `#5a6480` - Lower contrast for least important text

### Borders & Effects
- **Border**: `oklch(0.62 0.02 250 / 15%)` - Subtle with transparency
- **Input Border**: `oklch(0.62 0.02 250 / 20%)` - Slightly more visible
- **Ring/Focus**: `oklch(0.82 0.15 185 / 40%)` - Cyan glow effect

---

## 📊 Theme Variables (CSS)

```css
.openclaw {
  /* Backgrounds */
  --background: oklch(0.08 0.015 250);
  --card: oklch(0.11 0.015 250);
  --popover: oklch(0.14 0.015 250);
  --muted: oklch(0.16 0.015 250);

  /* Foregrounds */
  --foreground: oklch(0.97 0.01 250);
  --card-foreground: oklch(0.97 0.01 250);
  --popover-foreground: oklch(0.97 0.01 250);
  --muted-foreground: oklch(0.62 0.02 250);

  /* Primary (Coral) */
  --primary: oklch(0.65 0.24 25);
  --primary-foreground: oklch(0.97 0.01 250);

  /* Secondary (Cyan) */
  --secondary: oklch(0.68 0.14 190);
  --secondary-foreground: oklch(0.97 0.01 250);

  /* Accent (Bright Cyan) */
  --accent: oklch(0.82 0.15 185);
  --accent-foreground: oklch(0.08 0.015 250);

  /* Destructive (Coral) */
  --destructive: oklch(0.60 0.22 20);

  /* Borders */
  --border: oklch(0.62 0.02 250 / 15%);
  --input: oklch(0.62 0.02 250 / 20%);
  --ring: oklch(0.82 0.15 185 / 40%);

  /* Charts */
  --chart-1: oklch(0.65 0.24 25);     /* Coral */
  --chart-2: oklch(0.82 0.15 185);    /* Cyan bright */
  --chart-3: oklch(0.68 0.14 190);    /* Cyan mid */
  --chart-4: oklch(0.55 0.20 15);     /* Dark coral */
  --chart-5: oklch(0.75 0.12 180);    /* Muted cyan */

  /* Sidebar */
  --sidebar: oklch(0.11 0.015 250);
  --sidebar-foreground: oklch(0.97 0.01 250);
  --sidebar-primary: oklch(0.65 0.24 25);
  --sidebar-primary-foreground: oklch(0.97 0.01 250);
  --sidebar-accent: oklch(0.16 0.015 250);
  --sidebar-accent-foreground: oklch(0.82 0.15 185);
  --sidebar-border: oklch(0.62 0.02 250 / 15%);
  --sidebar-ring: oklch(0.82 0.15 185 / 40%);
}
```

---

## 🎯 Design Characteristics

### Contrast Strategy
High contrast between deep navy-black backgrounds and vibrant coral/cyan accents creates clear visual hierarchy and guides user attention to interactive elements.

### Visual Effects
- **Glow Effects**: Cyan accents use 40% opacity for subtle glow on focus states
- **Coral Borders**: 15-20% opacity for elegant separation without harshness
- **Smooth Transitions**: All interactive elements benefit from the high contrast
- **Anti-aliased Rendering**: Text appears crisp against dark backgrounds

### Typography Recommendations
- **Display**: Bold, geometric sans-serif (e.g., Clash Display, Inter Bold)
- **Body**: Clean, readable sans-serif (e.g., Satoshi, Inter, SF Pro)
- **Monospace**: Modern coding font (e.g., JetBrains Mono, Fira Code, SF Mono)

---

## 💡 Usage Guidelines

### When to Use This Theme
- **Data Dashboards**: Excellent for analytics with chart-friendly colors
- **Developer Tools**: Dark theme reduces eye strain during long sessions
- **Modern Applications**: Clean, professional aesthetic for SaaS products
- **Creative Tools**: High contrast supports visual design work

### Color Usage Best Practices
1. **Coral (Primary)**: Use for primary CTAs, important actions, and destructive operations
2. **Cyan (Secondary)**: Use for links, hover states, and secondary actions
3. **Background Layers**: Create depth with three background levels (base, surface, elevated)
4. **Text Hierarchy**: Use three text colors for importance levels
5. **Borders**: Keep subtle (15-20% opacity) to avoid visual clutter

### Accessibility Notes
- High contrast ratios ensure WCAG AAA compliance for text
- Coral and cyan have sufficient luminance contrast for distinguishability
- Avoid cyan text on coral backgrounds (insufficient contrast)
- Test with colorblind simulation tools

---

## 🚀 Implementation

### Apply to HTML Root
```tsx
<html className="openclaw">
  {/* Your app */}
</html>
```

### Toggle Theme Programmatically
```tsx
// Switch to OpenClaw theme
document.documentElement.classList.remove('dark', 'light');
document.documentElement.classList.add('openclaw');
```

### With Theme Provider
```tsx
import { useState } from 'react';

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('openclaw');

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

---

## 🎨 Design Inspiration Notes

The OpenClaw design system balances minimalist dark interface with warm coral and cool cyan highlights, creating a distinctive personality while maintaining professional accessibility. The lobster mascot metaphor is reinforced through the coral color choice, connecting branding with functional design.

**Key Takeaways:**
- Deep backgrounds (near-black) provide canvas for bright accents
- Dual accent system (warm + cool) creates visual interest and hierarchy
- Transparency-based borders feel modern and unobtrusive
- Glow effects on cyan add subtle polish without being distracting
