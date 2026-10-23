---
name: KytyPS5
description: Gaming editorial for an experimental, community-driven PlayStation 5 emulator
colors:
  color-bg-page: "#f7f9f8"
  color-bg-surface: "#e4ece7"
  color-bg-subtle: "#d4e3da"
  color-text-primary: "#073f3b"
  color-text-primary-hover: "#2e584d"
  color-text-secondary: "#4d6460"
  color-accent: "#d4f5ab"
  color-accent-strong: "#a1d4a7"
  color-on-accent: "#073f3b"
  color-focus-ring: "#3e7947"
  color-border-default: "#d4e3da"
  color-field-bg: "#132e29"
  color-field-bg-strong: "#073f3b"
  color-field-text: "#f7f9f8"
  color-field-text-muted: "#baccc1"
  color-field-border: "#2e584d"
  color-code-bg: "#132e29"
  color-code-header-bg: "#073f3b"
  color-code-text-muted: "#baccc1"
  color-status-success-bg: "#dcefde"
  color-status-success-fg: "#285b31"
  color-status-warning-bg: "#f7e8d3"
  color-status-warning-fg: "#815218"
  color-status-danger-bg: "#fee5e1"
  color-status-danger-fg: "#91463e"
  color-status-neutral-bg: "#e4ece7"
  color-status-neutral-fg: "#4d6460"
  color-chart-success: "#599a63"
  color-chart-warning: "#d0a45c"
  color-chart-danger: "#ca7469"
  color-chart-neutral: "#7d9086"
  color-chart-untested: "#baccc1"
typography:
  display:
    fontFamily: "'Big Shoulders Variable', 'Arial Narrow', sans-serif"
    fontSize: "clamp(80px, 8.9vw, 138px)"
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: "-0.015em"
  page-title:
    fontFamily: "'Big Shoulders Variable', 'Arial Narrow', sans-serif"
    fontSize: "clamp(65px, 7.5vw, 112px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'Big Shoulders Variable', 'Arial Narrow', sans-serif"
    fontSize: "clamp(44px, 4.3vw, 66px)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.005em"
  title:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "15px"
    fontWeight: 650
    lineHeight: 1.5
  body:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  hero-introduction:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
  guide-heading:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "24px"
    fontWeight: 650
    lineHeight: 1.4
  guide-step:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "19px"
    fontWeight: 650
    lineHeight: 1.5
  select-label:
    fontFamily: "'Public Sans Variable', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  code:
    fontFamily: "'Cascadia Code', 'SFMono-Regular', Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.9
rounded:
  chart-key: "2px"
  badge: "5px"
  filter: "6px"
  control: "7px"
  field: "8px"
  sleeve: "9px"
  media: "10px"
  panel: "12px"
  circle: "50%"
spacing:
  compact: "8px"
  small: "12px"
  regular: "16px"
  medium: "20px"
  roomy: "24px"
  gutter: "clamp(28px, 5vw, 80px)"
  gutter-mobile: "22px"
  section: "112px"
  section-tablet: "80px"
  section-mobile: "65px"
components:
  button-primary:
    backgroundColor: "{colors.color-text-primary}"
    textColor: "{colors.color-bg-page}"
    rounded: "{rounded.control}"
    padding: "15px 23px"
  button-primary-hover:
    backgroundColor: "{colors.color-text-primary-hover}"
  button-light:
    backgroundColor: "{colors.color-accent}"
    textColor: "{colors.color-text-primary}"
    rounded: "{rounded.control}"
    padding: "15px 23px"
  button-light-hover:
    backgroundColor: "{colors.color-bg-page}"
  button-secondary:
    textColor: "{colors.color-text-primary}"
    rounded: "{rounded.control}"
    padding: "15px 23px"
  button-secondary-hover:
    backgroundColor: "{colors.color-bg-surface}"
  search:
    backgroundColor: "{colors.color-bg-surface}"
    textColor: "{colors.color-text-primary}"
    rounded: "{rounded.field}"
    padding: "12px 18px"
  navigation-link:
    textColor: "{colors.color-text-primary}"
    padding: "8px 12px"
  status-in-game:
    backgroundColor: "{colors.color-status-success-bg}"
    textColor: "{colors.color-status-success-fg}"
    rounded: "{rounded.badge}"
    padding: "4px 9px"
  game-card:
    textColor: "{colors.color-text-primary}"
  tab:
    textColor: "{colors.color-text-primary}"
    padding: "9px 17px"
  accordion:
    backgroundColor: "{colors.color-bg-surface}"
    textColor: "{colors.color-text-primary}"
    rounded: "{rounded.field}"
    padding: "0 19px"
  code-block:
    backgroundColor: "{colors.color-code-bg}"
    textColor: "{colors.color-field-text-muted}"
    rounded: "{rounded.sleeve}"
---

# Design System: KytyPS5

## Overview

**Creative North Star: "The Living Game Collection"**

A gaming magazine brought to the web: oversized condensed headlines, cool paper, forest teal and mint, with official game artwork handled like a collection of physical sleeves. The visual language is confident and approachable; technical evidence stays legible and connected to the game it describes.

Open space and broad color fields pace the marketing pages. Compatibility lists, reports and documentation use the same palette with denser metadata, restrained dividers and clear controls. Official artwork, community captures and contributor avatars provide the visual content; no generated raster assets are required.

**Key Characteristics:**

- Condensed display type with comfortable sans-serif reading copy.
- Cool paper and forest-teal fields, punctuated by mint.
- Physical sleeve geometry and real game imagery.
- Quiet controls, explicit compatibility labels and readable technical evidence.

This record describes the completed implementation in `src/tokens.css`, `src/styles.css` and the shared components. Token frontmatter is normative; the responsive and state details below explain how the implementation applies it. Component provenance is recorded in `COMPONENTS.md`.

## Colors
Light mode retains the original cool paper, teal and mint palette. Dark mode uses forest grounds (`color-bg-page: #0a1c18`, `color-bg-surface: #132e29`) with pale green text (`color-text-primary: #e4ece7`). Mint remains the accent (`color-accent: #d4f5ab`). Dedicated `color-field-bg-strong`, `color-field-text` and `color-on-accent` tokens preserve contrast in full-color sections. Status chart colors correspond to the existing green/amber/red/gray vocabulary. Theme preference follows the system on first visit and persists once toggled; it is applied before React renders.

The palette combines cool paper, deep forest teal and a light mint accent; compatibility states add a small semantic vocabulary.

### Token structure

Colors are defined in `src/tokens.css` in two layers. The core layer (`--core-color-*`) is a perceptual palette in OKLCH with a shared lightness scale of 11 tones (50-950) per family: one `teal` ramp, plus `lime`, `green`, `amber` and `red`, and the neutrals `neutral-0` (white) and `neutral-1000`. The teal hue drifts from 187 in the dark tones (the brand ink) to 160-165 in the light tints, matching the original site. The semantic layer (`--color-*`) assigns those tones to roles for light and dark themes, and components use only the semantic names.

Four core tones are hand-tuned and not generated: `teal-900` (a compromise between the light-mode field and code backgrounds and the dark-mode surface) and the half-steps `teal-650`, `amber-650` and `red-650` (the original muted text and status foregrounds, between 600 and 700). Keep them if the palette is regenerated.

### Adding a palette

A new family is generated in OKLCH by keeping the shared lightness scale, so that the same tone number has the same lightness in every family and contrast between tones stays predictable across families:

| Tone | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| L | 0.98 | 0.94 | 0.90 | 0.83 | 0.74 | 0.64 | 0.53 | 0.43 | 0.34 | 0.27 | 0.21 |

1. Pick a hue (and a reference chroma) for the family. Chroma rises from near zero at tone 50 to its peak around tones 400-600 (about 0.10-0.11 for `amber`, `red` and `green`) and falls again toward 950. A hue may drift along the ramp, as `teal` does.
2. For each tone, set OKLCH `L` from the table above (within about 0.01), the chosen hue and the chroma for that tone. Reduce the chroma until the color fits sRGB, and keep the lightness unchanged.
3. Convert each tone to hex and declare `--core-color-<family>-<tone>` in the core layer of `src/tokens.css`. If a tone must be tuned by hand, mark it with a comment and list it in the paragraph above.
4. Assign the new tones to roles in the semantic layer for both themes. Components never reference core tones directly.
5. Check the contrast of every text/background pair that uses the new tones (at least AA, 4.5:1 for body text).

The generated values are a starting point, not a rule. Small hand adjustments to a tone (a slight shift in hue, chroma or lightness) are fine when they make the palette more expressive, as with `teal-900` and the half-steps. Keep them subtle so the shared lightness scale still holds, mark them with a comment in `src/tokens.css` and recheck the contrast of the pairs they affect.

### Primary

- **Forest Teal** (`color-text-primary`): primary text, actions, footer and feature fields. **Teal Hover** (`color-text-primary-hover`) is the primary button hover.
- **Fresh Mint** (`color-accent`): contrast actions on teal, selected capture controls, the closing download band and decorative backing shapes. **Mint Edge** (`color-accent-strong`) defines the secondary orbit and occasional display emphasis.

### Neutral

- **Cool Paper** (`color-bg-page`): page ground and light text on teal.
- **Soft Sage Paper** (`color-bg-surface`): fields, accordions, metadata blocks, table headers and hover surfaces.
- **Muted Teal** (`color-text-secondary`): metadata and secondary controls. Main reading paragraphs use ink after the final stylesheet overrides.
- **Sage Boundary** (`color-border-default`): functional control edges and real table dividers.
- **Field Mist**, **Deep Field** and **Field Boundary** (`color-field-text-muted`, `color-field-bg`, `color-field-border`): secondary content and structure inside teal sections.
- **Code Ground**, **Code Header** and **Code Label** (`color-code-bg`, `color-code-header-bg`, `color-code-text-muted`): terminal blocks and their header controls.
- **Tab Ground** (`color-bg-subtle`): shared track behind paper active tabs.
- **Focus Green** (`color-focus-ring`): keyboard focus outlines.
- **Overlay**, **Light Wash** and **Teal Wash** (`color-overlay`, `color-veil-light`, `color-veil-dark`): modal dimming and subtle labels on contrasting surfaces.

### Semantic status colors

- **Gameplay Green** (`color-status-success-fg` / `color-status-success-bg`): the In game badge.
- **Menu Amber** (`color-status-warning-fg` / `color-status-warning-bg`): Main menu badges, release-fetch notices and build-age notices.
- **Logo Rose** (`color-status-danger-fg` / `color-status-danger-bg`): Logo badges.
- **Boot Gray** (`color-status-neutral-fg` / `color-status-neutral-bg`): Doesn't boot badges.

**The Evidence Rule.** Status colors always accompany readable labels. Artwork establishes the title; reports establish compatibility.

## Typography

**Display Font:** Big Shoulders Variable, with Arial Narrow and sans-serif fallbacks.

**Body Font:** Public Sans Variable, with sans-serif fallback.

**Code Font:** Cascadia Code, SFMono-Regular, Consolas and monospace fallbacks.

Big Shoulders supplies the emphatic magazine voice, often uppercase. Public Sans makes compact controls and detailed reports feel calm. Both variable families are bundled through Fontsource imports.

### Hierarchy

- **Display:** the homepage headline uses the frontmatter display role. At very wide screens (minimum 1700px), it becomes 144px. At mobile widths it uses `clamp(75px, 14.5vw, 96px)` and a 0.95 line height.
- **Page title:** large route introductions use the page-title role; mobile uses `clamp(54px, 11.8vw, 75px)` and a line height of 1.
- **Headline:** section headings use the headline role with contextual sizes for feature and reading sections.
- **Title:** game card names use the sans-serif title role; platform names and report subheads instead use the display family.
- **Body:** ordinary reading paragraphs remain 16px on every viewport; contextual line heights range from 1.75 to 1.9. The homepage introduction remains 18px, with a maximum width of 470px on desktop and 390px on mobile.
- **Label:** controls and metadata usually use 13px, with primary buttons at 14px. Mobile compatibility badges use 11px inside compact rows.
- **Code:** 13px monospace content scrolls horizontally. Repository and compatibility counts use tabular numerals.

**The Reading Rule.** Condensed type provides scale and emphasis. Public Sans carries instructions, descriptions, controls and metadata.

## Layout

The centered content frame has a maximum width of 1440px and equal fluid gutters. Mobile gutters become 22px at 680px. Standard sections use the section spacing tokens, with local padding tuned to the content rather than forced into identical blocks.

Desktop marketing layouts alternate two-column compositions, open artwork collections and broad tonal bands. The hero uses a 47% / 53% split. Technical pages use a persistent side rail beside readable content; reports use a 280px rail and documentation uses its own narrower navigation column.

The implementation has responsive adjustments at 1200px, 1000px, 900px and 680px, plus a wide-screen adjustment at 1700px. At 1200px the platform build panel spans the board and filters stack. At 1000px desktop navigation changes to a dialog menu and download platform cards become a single column. At 900px the header and section spacing tighten, side rails narrow and table dates disappear. At 680px the hero, feature, report and documentation layouts stack; documentation navigation becomes a single column, the report side buttons give way to platform tabs, and compatibility rows become compact two-column entries with no header or arrow.

The game carousel keeps native horizontal scrolling and scroll snapping: four cards on desktop, approximately 2.8 at tablet size and cards at 66% of the track width on mobile. Reports keep wide Markdown tables and code scrollable rather than squeezing their contents. The screenshot gallery changes from two columns to one on mobile.

The carousel explicitly hides vertical overflow so wheel gestures continue down the page toward captures. Its cards enter from a centered 0.97 scale within their own bounds, preventing unseen translated cards from creating an inner vertical scroll range. The carousel and capture section both retain their normal place in document scrolling.

## Elevation & Depth

Depth comes from tonal layering, real artwork overlap, slight rotation and perspective response. Sleeve groups feel physical through arrangement; ordinary cards, fields and data surfaces remain flat. Modal and navigation layers use a dark overlay and explicit stacking rather than blur.

**The Flat Surface Rule.** Use tonal contrast, overlap and controlled rotation to separate surfaces; the implemented interface has no active box-shadow treatment.

Motion follows an ease-out curve (`cubic-bezier(.16,1,.3,1)`) for reveals and card movement. Button feedback is brief (200ms); section entrances take 550ms and heading words take 850ms with stagger. Content enters once from below, from either side or from a centered 0.97 scale. Default travel is 30px, with reading sections and headings limited to 18–24px; stagger is capped at 200ms. Navigation and tab highlights use restrained springs. The hero is a persistent nine-card deck: every 6.5s the left card folds behind, the center moves left, the right moves into the center, and the next card emerges on the right. Each 950ms transition animates position, rotation, scale and depth without replacing a card’s artwork. Pause/resume, direct selection and side-card clicks retain the same deck identities.

Theme toggles capture both page states before a 600ms circular reveal at constant radial speed. A fixed round window scales on the compositor; synchronized inverse scaling keeps the new page’s text and artwork stationary. The mask shape never animates. Both texture layers are prepared during two animation frames before playback; color transitions are suppressed during the reveal. Dark mode expands from the viewport’s top-left; light mode expands from the bottom-right. The radius extends four pixels past the farthest corner to avoid an exposed edge at completion. The browser’s default group animation and crossfade are disabled. The initial saved theme is applied immediately. Rapid toggles cancel the previous reveal and settle on the latest choice. Unsupported browsers and reduced-motion preferences use an immediate theme change.

Reduced-motion CSS shortens CSS animation and transition durations and removes smooth scrolling. React motion primitives also remove reveal displacement, pointer magnetism and tilt response; the hero continues cycling with instant card-position changes. Keep content readable before entrance effects complete.

## Shapes

Controls use a small softened rectangle, with the canonical button radius at 7px. Fields and accordions use 8px; game images use 10px; larger panels and art frames use 12px. Status badges use 5px and remain compact rather than pill-shaped. Circular icon buttons, avatar crops, orbit forms and small status dots provide the rounded counterpoint.

Functional boundaries are thin and restrained: one-pixel borders on secondary actions, icon buttons and table rows. Game sleeve edges clip their artwork; the main sleeve sits at a fixed negative angle with subtle pointer perspective. No shadow vocabulary is active in the stylesheet.

## Components

Loading uses a compact, solid forest-teal kitten silhouette with rounded contours. Its twelve-frame gentle trot repeats every 960ms only while awaiting content; dark mode renders the silhouette white. Startup, lazy routes, catalog lookups, report fetching and release refreshes share the asset. Labels retain native status semantics, loading completion removes the artwork, and reduced-motion preferences select a static PNG through a native picture source. Startup artwork is included in the offline shell.
The navigation includes a labeled sun/moon theme button at every breakpoint. A compatibility summary appears above the home game carousel and on the compatibility route. Its segmented bar and legend expose exact counts and percentages; choosing a status opens its game filter. OS-specific summaries retain the full-collection denominator and explicitly include untested titles. Reduced-motion mode disables the hero crossfade without disabling automatic rotation.

### Buttons

Primary buttons are teal with paper labels, a minimum height of 54px and the frontmatter padding. Hover shifts to Teal Hover and lifts by 2px; active returns to the baseline and scales to 0.98. The light variant pairs mint with teal, changing to paper on hover. Secondary buttons use a transparent ground and a thin Sage Boundary edge, filling with Soft Sage Paper on hover. The compact header variant uses a 43px minimum height and 11px / 16px padding on desktop. Disabled controls use 0.4 opacity. Keyboard focus uses a 3px Focus Green outline with a 5px offset.

### Inputs and filters

The search field is a full-width Soft Sage Paper surface with a search icon and clear action. Its desktop minimum height is 58px; focus-within adds a 2px teal outline with a 2px offset. Status filter buttons wrap naturally; selected filters reverse to teal and paper. OS and sorting controls remain native selects with compact labels.

### Status badges

Each state combines semantic foreground, pale background, a small current-color dot and a readable label. The badge is informational, not an action. The same status vocabulary appears on artwork, table rows and platform reports.

### Game cards and sleeves

Featured sleeves and cards are the nine most recently tested titles with cover artwork in descending report-date order. Their badges refer to the latest report's platform, named in the hero caption and in a quiet 13px date/platform line beneath each featured card. The full compatibility collection keeps its overall/per-platform filter semantics. Captures also use newest-first report order; the quick selector covers three distinct recently captured games. Live refresh can replace the selections without a route change.

A game card places a 1 / 1.08 artwork frame above its title and status. Hover gently enlarges the image to 1.055 and reveals a circular arrow; keyboard focus reveals the same arrow. Missing artwork becomes a surface-colored gamepad fallback with the title. The hero expands this vocabulary into overlapping sleeves, a mint orbit and a linked caption. The label and report link update with the selected title; the artwork does not imply that a capture came from the emulator.

### Navigation and tabs

The sticky paper header is 86px tall on desktop, with a subtle surface-colored shared highlight behind hovered or current navigation links and a 2px reading-progress line. Mobile navigation uses a paper dialog with large condensed links, overlay, close control and scrollable overflow. Platform tabs use a sage track and paper active background, with keyboard behavior supplied by Radix. Active capture selection uses mint against teal.

### Accordions

FAQ items sit on Soft Sage Paper with 8px corners and a 9px vertical gap. The plus rotates by 45 degrees when open; the answer expands with the ease-out curve. Radix supplies disclosure and keyboard semantics. Reading answers retain the 16px paragraph rule.

### Code, reports and notices

Quick Start leads the documentation and its navigation rail. Requirements and six numbered steps use 16px reading text, 19px step headings and 13px wrapping filenames. Asset examples sit on a quiet surface field. The homepage capture selector covers the full screenshot collection, with compact playback and larger-view controls; these wrap below the caption on phones. Automatic playback pauses offscreen, while hovered and while its larger viewer is open.

Terminal blocks use Code Ground with a contrasting header, a small dot and a copy action. Copy feedback announces Copied or the manual-selection fallback; long commands scroll horizontally. Report metadata uses calm surface panels, catalog information wraps long title IDs, and the build-age notice uses Menu Amber. Screenshots open in an overlay viewer with close, previous and next controls.

## Do's and Don'ts

### Do:

- Do use the existing color and typography tokens across every route.
- Do keep reading paragraphs at 16px, with the hero introduction at 18px.
- Do retain visible status text and source associations beside game imagery.
- Do preserve focus outlines, native scrolling and reduced-motion fallbacks.
- Do use the final cascade and responsive overrides when extending components.

### Don't:

- Don't treat official game artwork as proof of emulator output.
- Don't use an in-game badge to promise playability or performance.
- Don't introduce box shadows, glass panels or a new accent palette into this flat system.
- Don't turn metadata into oversized display type or shrink reading paragraphs to metadata size.
