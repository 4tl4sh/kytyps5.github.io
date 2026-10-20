---
name: KytyPS5
description: Gaming editorial for an experimental, community-driven PlayStation 5 emulator
colors:
  paper: "#f7f9f8"
  surface: "#eaf0ed"
  ink: "#073f3b"
  ink-hover: "#176058"
  muted: "#496660"
  mint: "#d4f5ab"
  mint-deep: "#a4cf8b"
  focus: "#4a8060"
  line: "#cedbd4"
  field-muted: "#bdcec6"
  field-dark: "#06312e"
  field-line: "#345d55"
  code-bg: "#0d302e"
  code-header: "#163e39"
  code-label: "#aec5b9"
  tab-ground: "#dce7df"
  overlay: "#052623e8"
  translucent-light: "#ffffff15"
  translucent-dark: "#073f3b0c"
  status-game-bg: "#e0efdb"
  status-game: "#285c31"
  status-menu-bg: "#f9ead4"
  status-menu: "#815218"
  status-logo-bg: "#f6dfdc"
  status-logo: "#91463e"
  status-boot-bg: "#e3e8e5"
  status-boot: "#51625b"
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
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "15px 23px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-light:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "15px 23px"
  button-light-hover:
    backgroundColor: "{colors.paper}"
  button-secondary:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "15px 23px"
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
  search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 18px"
  navigation-link:
    textColor: "{colors.ink}"
    padding: "8px 12px"
  status-in-game:
    backgroundColor: "{colors.status-game-bg}"
    textColor: "{colors.status-game}"
    rounded: "{rounded.badge}"
    padding: "4px 9px"
  game-card:
    textColor: "{colors.ink}"
  tab:
    textColor: "{colors.ink}"
    padding: "9px 17px"
  accordion:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 19px"
  code-block:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.field-muted}"
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
Light mode retains the original cool paper, teal and mint palette. Dark mode uses forest grounds (`paper: #0e1a18`, `surface: #192b25`) with pale green text (`ink: #e0eee5`). Mint remains the accent (`#c5eca0`). Dedicated `deep-field`, `on-field` and `on-mint` tokens preserve contrast in full-color sections. Status chart colors correspond to the existing green/amber/red/gray vocabulary. Theme preference follows the system on first visit and persists once toggled; it is applied before React renders.

The palette combines cool paper, deep forest teal and a light mint accent; compatibility states add a small semantic vocabulary.

### Primary

- **Forest Teal** (`ink`): primary text, actions, footer and feature fields. **Teal Hover** (`ink-hover`) is the primary button hover.
- **Fresh Mint** (`mint`): contrast actions on teal, selected capture controls, the closing download band and decorative backing shapes. **Mint Edge** (`mint-deep`) defines the secondary orbit and occasional display emphasis.

### Neutral

- **Cool Paper** (`paper`): page ground and light text on teal.
- **Soft Sage Paper** (`surface`): fields, accordions, metadata blocks, table headers and hover surfaces.
- **Muted Teal** (`muted`): metadata and secondary controls. Main reading paragraphs use ink after the final stylesheet overrides.
- **Sage Boundary** (`line`): functional control edges and real table dividers.
- **Field Mist**, **Deep Field** and **Field Boundary** (`field-muted`, `field-dark`, `field-line`): secondary content and structure inside teal sections.
- **Code Ground**, **Code Header** and **Code Label** (`code-bg`, `code-header`, `code-label`): terminal blocks and their header controls.
- **Tab Ground** (`tab-ground`): shared track behind paper active tabs.
- **Focus Green** (`focus`): keyboard focus outlines.
- **Overlay**, **Light Wash** and **Teal Wash** (`overlay`, `translucent-light`, `translucent-dark`): modal dimming and subtle labels on contrasting surfaces.

### Semantic status colors

- **Gameplay Green** (`status-game` / `status-game-bg`): the In game badge.
- **Menu Amber** (`status-menu` / `status-menu-bg`): Main menu badges, release-fetch notices and build-age notices.
- **Logo Rose** (`status-logo` / `status-logo-bg`): Logo badges.
- **Boot Gray** (`status-boot` / `status-boot-bg`): Doesn't boot badges.

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
