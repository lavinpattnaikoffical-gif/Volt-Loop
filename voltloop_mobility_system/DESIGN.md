---
name: VOLTLOOP Mobility System
colors:
  surface: '#f4fbf4'
  surface-dim: '#d4dcd5'
  surface-bright: '#f4fbf4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef6ee'
  surface-container: '#e8f0e9'
  surface-container-high: '#e3eae3'
  surface-container-highest: '#dde4dd'
  on-surface: '#161d19'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#2b322d'
  inverse-on-surface: '#ebf3eb'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#a43a3a'
  on-tertiary: '#ffffff'
  tertiary-container: '#fc7c78'
  on-tertiary-container: '#711419'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#842225'
  background: '#f4fbf4'
  on-background: '#161d19'
  surface-variant: '#dde4dd'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 24px
  margin: 32px
  space-xs: 4px
  space-sm: 8px
  space-md: 16px
  space-lg: 24px
  space-xl: 32px
---

## Brand & Style

This design system establishes a clean, trustworthy mobility marketplace that communicates speed, reliability, and absolute clarity. The brand personality is rooted in institutional trust and efficient transit solutions. The emotional response is one of safety, immediate availability, and effortless booking. 

We employ a **Corporate / Modern** design style, leaning heavily on high-scannability layouts, neutral off-white surfaces, and precise charcoal structures. The electric emerald seed color is used sparingly as a high-intent accent to guide user actions and highlight live network states.

## Colors

The color architecture is strictly disciplined: 
- **75% Neutral Off-White (`#F9FAFB`)** for expansive canvas backgrounds, reducing eye strain and maximizing readability.
- **15% Dark Charcoal (`#111827`)** for heavy structural framing, high-contrast text, and primary containers.
- **5-10% Electric Emerald / Lime Green (`#10B981` to `#059669`)** strictly reserved for availability badges, active energy indicators, and high-priority conversion CTAs. 

Never use the primary accent for bulk backgrounds or generic containers.

## Typography

Using **Inter** exclusively across all levels ensures maximum trustworthiness, neutral tone, and exceptional scannability across mobile and desktop viewports. Type hierarchies rely on strict weight contrast (400 regular, 500 medium, 600 semi-bold, 700 bold) rather than decorative flourishes. 

Ensure that headlines larger than 32px adapt gracefully on mobile viewports down to 24px to prevent wrapping issues in dense marketplace cards.

## Layout & Spacing

This design system uses a **12-column fluid grid** system optimized for desktop transit dashboards and responsive mobile booking flows. 

Spacing is built entirely on a strict **8px baseline grid rhythm** (using 4px increments for micro-adjustments). Outer margins scale from 16px on mobile to 32px on desktop. Content containers use consistent 24px gutters to establish clear visual separation between marketplace listings, map modules, and inventory filters.

## Elevation & Depth

Depth is handled through low-contrast outlines and tonal surface layering rather than heavy drop shadows. 

- **Surface Tiers:** Use crisp off-white (`#F9FAFB`) backgrounds paired with charcoal structural dividers (`#111827` at 10% opacity) to create scannable grouping.
- **Interactive States:** Floating elements (such as vehicle quick-booking sheets and floating map controls) utilize ultra-diffused, low-opacity ambient shadows tinted with dark charcoal to maintain a clean, lightweight corporate feel.
- **Ghost Borders:** Standard containers rely on 1px solid neutral borders to maintain crisp alignment and zero visual clutter.

## Shapes

The shape language uses a restrained **Soft (`1`)** roundedness scale. 
- Base UI elements (buttons, inputs, chips) carry a subtle `0.25rem` (4px) or `0.5rem` (8px) radius.
- Larger structural containers and cards utilize `0.75rem` (12px) rounding to maintain a professional, corporate stance without looking overly casual or toy-like.

## Components

- **Buttons:** Primary actions utilize the electric emerald (`#10B981`) background with dark charcoal text for high-impact conversions. Secondary actions use dark charcoal (`#111827`) outlines or solid fills. Destructive or inactive states drop back to neutral grays.
- **Chips:** Used for filter tags and vehicle specs. Active state fills with emerald at low opacity with dark text; default state sits on off-white with thin charcoal borders.
- **Lists:** High-density, scannable rows for vehicle availability and ride history. Alternating subtle row backgrounds improve scannability across wide viewports.
- **Checkboxes & Radio Buttons:** Crisp square and circular indicators with 2px borders, snapping to electric emerald when selected.
- **Input Fields:** Generous padding (16px), 1px solid charcoal borders, clear label placement above, and inline validation icons.
- **Cards:** Marketplace vehicle cards feature a clean neutral background, 1px structural border, prominent pricing typography, and a dedicated status badge anchored to the top-right corner.
- **Marketplace Specifics:** Include live battery-level progress bars, instant-reserve floating action bars, and real-time availability indicator pips.