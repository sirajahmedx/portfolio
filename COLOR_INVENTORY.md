# Portfolio Application - Comprehensive Color Inventory

## Theme System Overview
The application uses a CSS custom property-based design system with light and dark theme variants. Colors are defined using OKLCH color space for better perceptual uniformity and are converted to various opacity levels throughout the application.

## Core Theme Colors

### Light Theme (Default)
- **Primary**: `oklch(0.55 0.2 264)` - Purple/Blue brand color
- **Primary Foreground**: `oklch(0.95 0.005 264)` - Very light purple/white
- **Secondary**: `oklch(0.88 0.01 264)` - Light grayish purple
- **Secondary Foreground**: `oklch(0.15 0.02 264)` - Very dark purple/black
- **Background**: `oklch(0.93 0.005 264)` - Very light purple/white
- **Foreground**: `oklch(0.15 0.02 264)` - Very dark purple/black
- **Card**: `oklch(0.95 0 0)` - Pure white
- **Card Foreground**: `oklch(0.15 0.02 264)` - Very dark purple/black
- **Popover**: `oklch(0.95 0 0)` - Pure white
- **Popover Foreground**: `oklch(0.15 0.02 264)` - Very dark purple/black
- **Muted**: `oklch(0.88 0.01 264)` - Light grayish purple
- **Muted Foreground**: `oklch(0.55 0.05 264)` - Medium purple/gray
- **Accent**: `oklch(0.85 0.02 264)` - Light accent purple
- **Accent Foreground**: `oklch(0.15 0.02 264)` - Very dark purple/black
- **Destructive**: `oklch(0.65 0.2 25)` - Orange/red for errors
- **Border**: `oklch(0.8 0.01 264)` - Light purple/gray border
- **Input**: `oklch(0.8 0.01 264)` - Light purple/gray input background
- **Ring**: `oklch(0.55 0.2 264)` - Same as primary for focus rings

### Dark Theme
- **Primary**: `oklch(0.7 0.25 264)` - Brighter purple/blue
- **Primary Foreground**: `oklch(0.08 0.01 264)` - Very dark background
- **Secondary**: `oklch(0.18 0.03 264)` - Dark grayish purple
- **Secondary Foreground**: `oklch(0.95 0.005 264)` - Very light foreground
- **Background**: `oklch(0.08 0.01 264)` - Very dark purple/black
- **Foreground**: `oklch(0.95 0.005 264)` - Very light purple/white
- **Card**: `oklch(0.12 0.02 264)` - Dark card background
- **Card Foreground**: `oklch(0.95 0.005 264)` - Light card text
- **Popover**: `oklch(0.12 0.02 264)` - Dark popover background
- **Popover Foreground**: `oklch(0.95 0.005 264)` - Light popover text
- **Muted**: `oklch(0.18 0.03 264)` - Dark muted background
- **Muted Foreground**: `oklch(0.65 0.05 264)` - Medium light text
- **Accent**: `oklch(0.22 0.04 264)` - Dark accent background
- **Accent Foreground**: `oklch(0.95 0.005 264)` - Light accent text
- **Destructive**: `oklch(0.7 0.22 25)` - Brighter orange/red
- **Border**: `oklch(0.2 0.02 264)` - Dark border
- **Input**: `oklch(0.2 0.02 264)` - Dark input background
- **Ring**: `oklch(0.7 0.25 264)` - Bright focus ring

## Chart Colors (Both Themes)

### Light Theme Charts
- **Chart 1**: `oklch(0.6 0.25 264)` - Purple
- **Chart 2**: `oklch(0.65 0.2 320)` - Magenta
- **Chart 3**: `oklch(0.7 0.18 200)` - Cyan
- **Chart 4**: `oklch(0.55 0.22 120)` - Green
- **Chart 5**: `oklch(0.6 0.2 40)` - Orange

### Dark Theme Charts
- **Chart 1**: `oklch(0.65 0.25 264)` - Brighter purple
- **Chart 2**: `oklch(0.7 0.22 320)` - Brighter magenta
- **Chart 3**: `oklch(0.75 0.2 200)` - Brighter cyan
- **Chart 4**: `oklch(0.6 0.24 120)` - Brighter green
- **Chart 5**: `oklch(0.65 0.22 40)` - Brighter orange

## Sidebar System Colors

### Light Theme Sidebar
- **Sidebar**: `oklch(0.93 0.005 264)` - Same as background
- **Sidebar Foreground**: `oklch(0.15 0.02 264)` - Same as foreground
- **Sidebar Primary**: `oklch(0.55 0.2 264)` - Same as primary
- **Sidebar Primary Foreground**: `oklch(0.93 0.005 264)` - Light
- **Sidebar Accent**: `oklch(0.85 0.02 264)` - Same as accent
- **Sidebar Accent Foreground**: `oklch(0.15 0.02 264)` - Dark
- **Sidebar Border**: `oklch(0.8 0.01 264)` - Same as border
- **Sidebar Ring**: `oklch(0.55 0.2 264)` - Same as ring

### Dark Theme Sidebar
- **Sidebar**: `oklch(0.1 0.015 264)` - Slightly lighter than background
- **Sidebar Foreground**: `oklch(0.95 0.005 264)` - Same as foreground
- **Sidebar Primary**: `oklch(0.7 0.25 264)` - Same as primary
- **Sidebar Primary Foreground**: `oklch(0.08 0.01 264)` - Dark
- **Sidebar Accent**: `oklch(0.22 0.04 264)` - Same as accent
- **Sidebar Accent Foreground**: `oklch(0.95 0.005 264)` - Light
- **Sidebar Border**: `oklch(0.2 0.02 264)` - Same as border
- **Sidebar Ring**: `oklch(0.7 0.25 264)` - Same as ring

## Hard-Coded Colors (Specific Use Cases)

### Button Colors (Helper Boost & Quick Actions)
- **"Me" Button**: `#329696` (Teal)
- **"Projects" Button**: `#3E9858` (Green)
- **"Skills" Button**: `#856ED9` (Purple)
- **"Contact" Button**: `#C19433` (Gold/Orange)

### Chat Components
- **Chat Bubble (Sent)**: `#007AFF` (iOS Blue)
- **Scrollbar Color**: `rgb(107 114 128 / 0.3)` (Gray with 30% opacity)

### UI Component Specific Colors
- **Compare Component Particle**: `#FFFFFF` (White)
- **Compare Component Shadow**: `#FFFFFF40` (White with 25% opacity)
- **Sparkles Background Default**: `#0d47a1` (Dark Blue)
- **Sparkles Particle Default**: `#ffffff` (White)
- **Sparkles Dark Values**: `#000` (Black)
- **Sparkles Light Values**: `#fff` (White)

### Project Card Backgrounds
- **Light Project Cards**: `#F5F5F7` (Apple-style light gray)
- **Dark Project Cards**: `#1D1D1F` (Apple-style dark gray)

### Gradient Specific Colors
- **GitHub Badge Gradients**: 
  - Light: `from-gray-500/70 to-gray-700/70`
  - Dark: `from-[#6E7681]/60 to-[#484F58]/60`

## Color Opacity Variations Used

### Primary Color Variations
- `primary/5` - 5% opacity (subtle backgrounds)
- `primary/8` - 8% opacity
- `primary/10` - 10% opacity (light backgrounds)
- `primary/20` - 20% opacity (border highlights)
- `primary/60` - 60% opacity (medium emphasis)
- `primary/80` - 80% opacity (dark theme text)
- `primary/90` - 90% opacity (hover states)

### Background Color Variations
- `background/60` - 60% opacity
- `background/80` - 80% opacity (overlays, modals)

### Card Color Variations
- `card/2` - 2% opacity (very subtle)
- `card/5` - 5% opacity
- `card/10` - 10% opacity
- `card/15` - 15% opacity
- `card/30` - 30% opacity (standard overlays)
- `card/50` - 50% opacity
- `card/60` - 60% opacity (dark theme)
- `card/70` - 70% opacity
- `card/80` - 80% opacity
- `card/90` - 90% opacity
- `card/95` - 95% opacity (near opaque)

### Accent Color Variations
- `accent/5` - 5% opacity (page backgrounds)
- `accent/10` - 10% opacity (hover states)
- `accent/20` - 20% opacity (active states, dark theme)
- `accent/50` - 50% opacity (theme toggle hover)
- `accent/80` - 80% opacity

### Muted Color Variations
- `muted/5` - 5% opacity
- `muted/20` - 20% opacity (borders, subtle backgrounds)
- `muted/30` - 30% opacity (message dialogs, cards)
- `muted/50` - 50% opacity

### Border Color Variations
- `border/10` - 10% opacity (very subtle borders)
- `border/20` - 20% opacity
- `border/30` - 30% opacity (standard borders)
- `border/50` - 50% opacity
- `border/60` - 60% opacity
- `border/80` - 80% opacity (input borders)
- `border/90` - 90% opacity (hover states)

### Destructive Color Variations
- `destructive/10` - 10% opacity (error backgrounds)
- `destructive/60` - 60% opacity (dark theme)
- `destructive/70` - 70% opacity

### Black/White Variations
- `black/0` - 0% opacity (transparent)
- `black/50` - 50% opacity (modal overlays)
- `black/60` - 60% opacity (modal overlays)
- `black/80` - 80% opacity (dark overlays)
- `white/10` - 10% opacity (borders)
- `white/90` - 90% opacity (dark theme text)

## State-Based Colors

### Hover States
- `hover:bg-accent/10` - Light accent hover
- `hover:bg-accent/20` - Standard accent hover
- `hover:bg-accent/50` - Medium accent hover
- `hover:bg-primary/5` - Subtle primary hover
- `hover:bg-primary/90` - Strong primary hover
- `hover:bg-card/15` - Card hover
- `hover:bg-destructive/10` - Error hover
- `hover:border-border/30` - Border hover
- `hover:border-border/80` - Strong border hover
- `hover:border-border/90` - Very strong border hover

### Focus States
- `focus-within:!border-primary/50` - Focus border
- `focus-within:!shadow-primary/10` - Focus shadow
- `outline-ring/50` - Focus outline

### Active/Pressed States
- Various scale transformations with color changes
- Shadow intensity variations

## Gradient Combinations

### Background Gradients
- `bg-gradient-to-br from-primary/5 via-background to-accent/5` (Main page background)
- `bg-gradient-to-r from-primary to-accent` (Text gradient)
- `bg-gradient-to-br from-primary/20 to-accent/20` (Avatar background)
- `bg-gradient-to-r from-transparent via-border to-transparent` (Dividers)

### Text Gradients
- `bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80` (Project titles)
- `bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent` (Name highlight)

### Blur Effects
- `bg-gradient-to-r from-primary/5 to-accent/5 blur-3xl` (Background blur effects)

## Component-Specific Color Usage

### Chat Interface
- User messages: `bg-primary/10 border-primary/20`
- System messages: Default foreground
- Input area: `bg-background/80 border-border/30`
- Hover buttons: `hover:bg-accent/20`

### Navigation/Header
- Background: `bg-gradient-to-br from-primary/5 via-background/95 to-accent/5`
- Borders: `border-border/30`

### Cards & Dialogs
- Standard card: `bg-card border-border/50`
- Dialog overlay: `bg-black/60`
- Card content: Various muted and foreground combinations

### Form Elements
- Input borders: `border-border/80`
- Focus borders: `focus-within:!border-primary/50`
- Disabled states: Reduced opacity variations

### Loading & Animation States
- Loading dots: `bg-primary/60` with animation
- Skeleton loading: Various muted color combinations

## Accessibility & Contrast Notes

The color system maintains proper contrast ratios:
- Light theme: Dark text on light backgrounds
- Dark theme: Light text on dark backgrounds
- Interactive elements have sufficient contrast
- Focus indicators are clearly visible
- Error states use high-contrast destructive colors

## Color Inheritance Patterns

1. **CSS Variables**: All colors inherit from root CSS custom properties
2. **Tailwind Classes**: Extensive use of opacity modifiers for consistency
3. **Theme Switching**: Automatic color adaptation via CSS custom properties
4. **Component Isolation**: No hard-coded colors except for specific branded elements
5. **Responsive Adaptation**: Colors maintain consistency across breakpoints

## Summary Statistics

- **Total Core Theme Colors**: 13 base colors per theme (26 total)
- **Chart Colors**: 5 per theme (10 total)
- **Sidebar Colors**: 6 per theme (12 total)  
- **Hard-coded Colors**: 15 specific hex values
- **Opacity Variations**: 50+ different opacity combinations
- **Gradient Combinations**: 15+ unique gradient patterns
- **Total Color Variations**: 200+ when including all opacity and state variants

This color system provides comprehensive theming while maintaining consistency, accessibility, and brand identity across the entire application.
