# OfferPlus iOS — Design System

## Brand Colors

| Token | Hex | Usage |
|---|---|---|
| Primary | `#861F41` | Buttons, links, accent, navigation tint |
| Primary Dark | `#621531` | Pressed states, gradients |
| Primary Light | `#9B2335` | Icon gradient top |
| Icon Dark | `#5A1020` | Icon gradient bottom |

The iOS accent color is set in `Assets.xcassets/AccentColor.colorset` and matches the web primary exactly. In dark mode it shifts slightly lighter to maintain contrast.

---

## App Icon

**Source:** `Assets/AppIcon.svg`
**Generated:** `OffersPlus/Assets.xcassets/AppIcon.appiconset/` (13 sizes, 20px–1024px)

**Design:**
- Background: linear gradient `#9B2335` → `#5A1020` (top-left to bottom-right)
- Motif: white bold `+` symbol (rounded caps, 128px stroke weight at 1024px)
- Ring: white circle at 15% opacity behind the `+` for depth
- Corners: clipped to squircle by iOS automatically

The `+` directly references "Plus" in OfferPlus and reads as positive outcomes (more offers).

**Regenerate icons after editing the SVG:**
```bash
brew install librsvg   # one-time
bash mobile/Assets/generate-icons.sh
```

---

## Typography

Follows iOS system defaults (SF Pro). No custom fonts.

| Style | SwiftUI | Usage |
|---|---|---|
| App title | `.largeTitle.bold()` | Login screen heading |
| Section heading | `.headline` | Company name in list rows |
| Body | `.subheadline` | Job title in list rows |
| Caption | `.caption` | Dates, secondary labels |
| Badge | `.caption.weight(.semibold)` | Status pills |

---

## Status Colors

| Status | Color | Hex |
|---|---|---|
| Applied | Blue | system blue |
| In Progress | Orange | system orange |
| Interview | Orange | system orange |
| OA | Purple | system purple |
| VO | Indigo | system indigo |
| Offer / Accepted | Green | system green |
| Rejected | Red | system red |
| Unknown | Gray | system gray |

Status colors use system semantic colors so they adapt correctly to light/dark mode.

---

## Components

### ApplicationRow
- Company name: `.headline` weight
- Job title: `.subheadline`, `.secondary` color, single line truncated
- Date: `.caption`, `.tertiary` color
- Status badge: capsule shape, status color at 15% opacity background

### StatsView
- Horizontal scroll, no scrollbar
- Each card: 72pt wide, `.regularMaterial` background, 12pt corner radius
- Value: `.title2.bold()` in status color
- Label: `.caption` in `.secondary`

### StatusBadge
- Capsule shape
- Background: status color at 15% opacity
- Text: status color at 100% opacity

---

## Spacing & Layout

| Token | Value |
|---|---|
| Screen horizontal padding | 16pt |
| Card corner radius | 12pt |
| List row vertical padding | 4pt |
| Stats card width | 72pt |
| Stats card vertical padding | 12pt |

---

## Motion

No custom animations. Uses SwiftUI defaults:
- `.sheet` presentation for Add / Edit / Detail views
- List swipe actions use native spring physics
- Pull-to-refresh uses native `refreshable` modifier

---

## Dark Mode

All colors use system semantic values or `AccentColor` from the asset catalog. No hardcoded light-only colors. The maroon accent shifts ~10% lighter in dark mode for legibility.

---

## Web ↔ iOS Parity

| Element | Web | iOS |
|---|---|---|
| Primary color | `#861F41` | `AccentColor` (#861F41) |
| Company name extraction | `extractCompanyNameFromUrl()` in TS | `CompanyNameExtractor.extract()` in Swift |
| Status labels | Same strings | Same `displayName` values |
| Data source | Supabase JS SDK | supabase-swift SDK, same project |
| Auth | Supabase email + Google OAuth | Same providers, same redirect handling |
