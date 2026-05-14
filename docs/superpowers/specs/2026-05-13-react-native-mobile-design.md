# Design: adviz-mobile — React Native mobile app (mentee + mentor)

**Date:** 2026-05-13
**Scope:** Universal Expo app (iOS + Android primary, web as bonus) covering mentee booking flows and mentor self-management
**Approach:** Expo managed workflow + Expo Router v4 + role-gated tab navigation
**Prototype reference:** `adviz-prototype/adviz-handoff-mobile/project/mobile/`

---

## Context

`adviz-mobile` is a new directory in the monorepo root. It is a mobile-first app for mentees and approved mentors. The existing web apps (`adviz-frontend`, `adviz-mentor-panel`) remain the canonical web experience — this app does not replace them. Expo's web export is available as a bonus but is not a primary target.

The app serves two roles within one binary:
- **Mentees** — browse mentors, book sessions, manage bookings, leave reviews
- **Mentors** — manage dashboard, schedule, sessions, and public profile

Admins use the desktop `adviz-admin-panel` only — no admin flows in this app.

---

## Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Expo SDK 52+ (managed workflow) | EAS Build for distribution |
| Routing | Expo Router v4 | file-based, universal |
| Data fetching | TanStack Query v5 | mirrors web apps |
| Forms | TanStack Form v1 + Zod | mirrors `adviz-frontend` |
| Auth state | Zustand | mirrors `adviz-mentor-panel` |
| Styling | NativeWind v4 | same design tokens as web |
| Payments | `@stripe/stripe-react-native` | requires EAS dev build (not Expo Go) |
| i18n | `i18next` + `react-i18next` | intlayer has no RN support |
| Secure storage | `expo-secure-store` | JWT storage, keychain-backed |
| Offline cache | `@tanstack/query-async-storage-persister` + `expo-file-system` | browse + bookings readable offline |
| Build/deploy | EAS Build + EAS Update | managed OTA updates |
| Testing | Jest + React Native Testing Library + Detox | see Testing section |

### Stripe + Expo managed note

`@stripe/stripe-react-native` works in managed Expo but requires a **development build** (via `eas build --profile development`) — it cannot run in Expo Go. All non-payment screens can be developed and tested in Expo Go as usual. The development build is built once via EAS and installed on device/simulator, then supports live reload like Expo Go.

Add **`expo-dev-client`** to the project: it provides the Expo Go experience (fast refresh, QR scanning) inside the custom binary that includes Stripe's native code, making local payment-sheet debugging practical without rebuilding.

---

## Design tokens

Same palette as all web apps — defined in `tailwind.config.js` and applied via NativeWind:

```js
colors: {
  ink:           "#1B1B43",
  "ink-soft":    "#2D2D5C",
  "purple-deep": "#3E1D87",
  "purple-mid":  "#5254CF",
  "purple-100":  "#E0E0FF",
  "purple-200":  "#CBCBFF",
  "purple-300":  "#9192FF",
  peach:         "#FFBC96",
  coral:         "#FE5B52",
  teal:          "#2A9D8F",
  cream:         "#FAF7F2",
  line:          "#ECE9E2",
  "line-strong": "#DAD6CC",
}
```

Status accents: `emerald-500/100` (confirmed/approved), `rose-500/100` (rejected/cancelled), `amber-500/100` (pending).

Typography: **Inter** via `@expo-google-fonts/inter` + **Inria Sans** (`font-display`) for wordmark and screen titles. Use NativeWind semantic scale — no arbitrary pixel values unless mirroring prototype exactly. Use `rem`-based units where NativeWind supports them so that system font-size preferences are respected.

---

## Layout constants

**Rule: no hardcoded device offsets.** All insets that vary by device (status bar, home indicator, keyboard) must be sourced from `useSafeAreaInsets()` or the relevant Expo/RN API at runtime. The pixel values below are the iPhone 14 Pro reference only — implementation must be dynamic.

All screens use these reference offsets (portrait, iPhone 14 Pro — 390×844):

| Zone | Value | Notes |
|---|---|---|
| Status bar height | 58px | dynamic island device; **derive at runtime** via `useSafeAreaInsets().top` from `react-native-safe-area-context` — do not hardcode `pt-[58px]` |
| App header height | 52px (top: 54) | `AppHeader` component |
| Tab bar height | 83px | `bottom: 83` in scroll content areas |
| Booking step content top | 196px | after step label + title |
| Booking step CTA bottom | 142px | step CTA bar + tab bar |
| Screen background | `#FAF7F2` (cream) | applied to root of every screen |

---

## i18n

- Bulgarian primary, English secondary — same two locales as web apps
- Translation files: `locales/bg.json`, `locales/en.json`
- Language persisted in Zustand + `expo-secure-store`
- Dates: `Intl.DateTimeFormat` with `bg-BG` or `en-US`
- Currency: always `€` prefix

---

## Auth flow

1. User submits login form → `POST /auth/login` → JWT returned
2. JWT stored in `expo-secure-store` (encrypted, keychain-backed)
3. Zustand `authStore` hydrates `{ user, scopes, token }` from SecureStore on app launch
4. All API requests attach `Authorization: Bearer <token>` via axios interceptor
5. Traefik `forwardAuth` middleware verifies JWT and injects `X-User-*` headers — no backend service changes needed
6. On 401 response → clear store + `router.replace('/(auth)/login')`
7. Logout → clear SecureStore + reset Zustand store

---

## Navigation structure

Root layout (`app/_layout.tsx`) checks auth state on mount:
- Unauthenticated → stash the intended destination, redirect to `/(auth)/login`, and redirect back after successful login (cold-start deep-link support)
- Authenticated, no `mentor:me` scope → redirect to `/(mentee)/browse`
- Authenticated, has `mentor:me` scope → redirect to `/(mentor)/dashboard`

```
app/
  _layout.tsx                        ← root: auth guard + role redirect
  (auth)/
    _layout.tsx
    login.tsx
    register.tsx
  (mentee)/
    _layout.tsx                      ← bottom tabs: Browse · Bookings · Profile
    browse/
      index.tsx                      ← mentor listing + filters
      [mentorId]/
        index.tsx                    ← mentor public profile
        book.tsx                     ← booking flow (slot → agenda → review → pay)
    bookings/
      index.tsx                      ← my sessions (upcoming / past / cancelled)
      [sessionId].tsx                ← session confirmation
    profile/
      index.tsx                      ← account settings, logout, language toggle
  (mentor)/
    _layout.tsx                      ← bottom tabs: Dashboard · Schedule · Sessions · Profile
    dashboard/
      index.tsx
    schedule/
      index.tsx
    sessions/
      index.tsx
      [sessionId].tsx                ← session detail (start / end actions)
    profile/
      index.tsx
```

### Tab bars

**Mentee tab bar** (bottom, `bg-white/96 backdrop-blur border-t border-line`, `padding: "8px 8px {safeAreaInsets.bottom > 0 ? safeAreaInsets.bottom : 8}px"`). The bottom padding must be driven by `useSafeAreaInsets().bottom` — not hardcoded — so the tab bar sits correctly on SE-class devices and Android where the home indicator inset differs from iPhone 14 Pro's 83px total. Scroll content `bottom` offset must also use the same dynamic inset (`safeAreaInsets.bottom + tabBarInnerHeight`) rather than a fixed `bottom-[83px]`.

| Tab | Icon | BG label | Active color |
|---|---|---|---|
| Browse | search (stroke 1.6 / 2.0 active) | Открий | `#3E1D87` |
| Bookings | calendar | Резервации | `#3E1D87` |
| Profile | user | Профил | `#3E1D87` |

Tab label: `text-[10.5px] font-semibold tracking-tight`. Inactive: `rgba(27,27,67,0.45)`.

**Mentor tab bar** (same chrome):

| Tab | Icon | BG label |
|---|---|---|
| Dashboard | home | Начало |
| Schedule | calendar | График |
| Sessions | video | Сесии |
| Profile | user | Профил |

### Role switching (dual-role users)

Approved mentors are also mentees. Both tab groups coexist in the router — switching is instant with no re-auth.

- Mentee `Profile` screen: shows "Switch to Mentor View" button if `mentor:me` in scopes → `router.replace('/(mentor)/dashboard')`
- Mentor `Profile` screen: always shows "Превключи към менти / Switch to mentee view" → `router.replace('/(mentee)/browse')`

---

## Shared components

All components mirror the prototype in `components.jsx` and `frame.jsx`.

### `AppHeader`
`absolute left-0 right-0 z-30 flex items-center justify-between` — `top: safeAreaInsets.top + 2, height: 52, padding: "0 12px"`. Must be `overflow: visible` — never `overflow-hidden`; clipping this view would cut off absolutely-positioned `Toast` overlays and any dropdowns that originate from the header's right slot. Back chevron (22px, `text-ink`), centered title `font-semibold text-[15px] text-ink`, right slot (optional action button).

### `MAvatar`
`rounded-full flex items-center justify-center font-semibold text-ink`. Background = `spec.color`, initials = `spec.initials`, font size = `size * 0.36`. Online dot: `rounded-full border-2 border-white bg-teal` at `w-{size*0.22} h-{size*0.22}` bottom-right. Optional border ring: `box-shadow: 0 0 0 3px #FAF7F2`.

### `MCard`
`rounded-2xl bg-white border border-line`. Used for all content cards.

### `Eyebrow`
`text-[10.5px] uppercase tracking-[0.12em] font-semibold text-ink/50`.

### `TopicChip`
Active: `bg-purple-deep text-white border-purple-deep`. Inactive: `bg-white text-ink/75 border-line-strong`. Size sm: `px-2.5 py-1 text-[11.5px]`, default: `px-3 py-1.5 text-[12.5px]`. `rounded-full border font-medium`.

### `StepDots` (booking stepper)
`flex items-center gap-1.5`. Each dot: `rounded-full transition-all`. Active: `width: 22, height: 6, bg: purple-deep`. Done: `width: 6, height: 6, bg: #9192FF`. Pending: `width: 6, height: 6, bg: #DAD6CC`.

### `PillTabs` (session/booking tabs)
Container: `flex items-center gap-1 bg-purple-100/50 rounded-full p-1`. Active tab: `flex-1 text-center py-2 rounded-full text-[12.5px] font-semibold bg-white text-purple-deep shadow-sm`. Inactive: `text-ink/55`. Count badge: `ml-1.5 text-[10.5px]`.

### `UnderlineTabs` (schedule tabs)
Container: `flex items-center gap-5 border-b border-line`. Active: `pb-2.5 -mb-px text-[13px] font-semibold text-purple-deep border-b-2 border-purple-deep`. Inactive: `text-ink/45`.

### `Switch`
Wrap React Native's built-in `<Switch>` with NativeWind classes rather than hand-rolling. This gives `accessibilityRole="switch"` and `accessibilityState={{ checked }}` for free. Track tint: `trackColor={{ false: colors.line-strong, true: colors.purple-deep }}`. Thumb: `thumbColor="white"`. Dimensions `width: 38, height: 22` set via `style` if the native default diverges.

### `SessionBadge`
`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold`:
- SCHEDULED: `bg-purple-100 text-purple-deep`
- LIVE: `bg-coral/10 text-coral` + `w-1.5 h-1.5 rounded-full bg-coral animate-pulse`
- COMPLETED: `bg-emerald-100 text-emerald-700`
- CANCELLED / NO_SHOW: `bg-slate-100 text-ink/50`

### `Toast`
`mx-3 rounded-2xl border shadow-[0_8px_24px_-4px_rgba(27,27,67,0.18)] p-3 flex items-start gap-2.5`. Icon: `w-7 h-7 rounded-full flex items-center justify-center`. Tones:
- success: `bg-emerald-50 border-emerald-200`, icon `bg-emerald-500 text-white`
- error: `bg-rose-50 border-rose-200`, icon `bg-coral text-white`
- info: `bg-purple-100 border-purple-200`, icon `bg-purple-deep text-white`
- warning: `bg-amber-50 border-amber-200`, icon `bg-amber-500 text-white`

Positioned `absolute top-[safeAreaInsets.top+n] left-0 right-0 z-50` (must exceed `AppHeader`'s `z-30`; never clipped by it). Slides down on entry.

### `CTA` (primary action button)
`w-full py-3.5 rounded-2xl font-bold text-[15px]`. Primary: `bg-purple-deep text-white`. Dark variant: `bg-ink text-white`. Disabled: `bg-slate-200 text-ink/40`.

---

## Screens

### Auth: Login (`/(auth)/login`)

Background: `#FAF7F2`. Top branding strip (height: 280): `linear-gradient(180deg, #E0E0FF 0%, #FAF7F2 100%)` with three decorative pills (`#CBCBFF` 40px, `#FFBC96` 24px, `#3E1D87` 14px). Wordmark: `font-display text-[40px] tracking-wider text-ink`, tagline `text-[13px] text-ink/55`.

Content (`px-6 pt-2`):
- Title: `text-[26px] font-light tracking-tight text-ink`
- Subtitle: `text-[13.5px] text-ink/55 mt-1`
- Form fields: `label text-[11.5px] font-semibold text-ink/65 mb-1.5` + `input px-3.5 py-3 rounded-xl border border-line-strong bg-white text-[14px]`
- Forgot password: `text-[12.5px] font-medium text-purple-deep` right-aligned
- Primary CTA: `CTA` component, "Влез / Sign in"
- Divider: `h-px bg-line-strong` + `text-[11px] uppercase tracking-wider text-ink/40 font-semibold`
- Google SSO: `w-full py-3 rounded-2xl border border-line-strong bg-white text-ink text-[14px] font-semibold flex items-center justify-center gap-2.5`
- Sign up link: `text-[13px] text-ink/60`, purple-deep "Регистрирай се" span

**Error state:** input border becomes `border-2 border-coral`, coral alert icon inside input, coral inline error `text-[11.5px]`. Toast: error tone, slides in from top. Attempt counter: `text-[12px] text-ink/55` with shield icon.

---

### Auth: Register (`/(auth)/register`)

`AppHeader` with back + "Вход / Sign in" right button. Content from `top: 116`:
- Title: `text-[28px] font-light tracking-tight text-ink leading-[1.1]`
- Subtitle: `text-[13.5px] text-ink/55 mt-2 max-w-[300px]`
- Fields: full name, email, password, confirm password (with emerald "Съвпадат" hint when matching)
- Terms checkbox: `w-4 h-4 rounded-[4px] bg-purple-deep` with white check icon + `text-[12px] text-ink/60`
- Primary CTA: "Създай профил / Create account"
- 90% discount nudge: `text-[12px] text-ink/50 text-center` with `text-coral font-semibold` "90%"

---

### Mentee: Browse (`/(mentee)/browse`)

Header (`absolute top-0 left-0 right-0 z-20 px-5 pt-[58px] pb-3 bg-cream`):
- Title: `font-display text-[26px] tracking-wide text-ink`
- Right: bell button `w-9 h-9 rounded-full bg-white border border-line` + BG/EN language pill
- Search bar: `relative mt-3`. Icon left-pinned. Input: `w-full pl-10 pr-20 py-2.5 rounded-2xl border border-line-strong bg-white text-[13.5px]`. Filter button inside right: `px-2.5 py-1.5 rounded-full bg-purple-deep text-white text-[11px] font-semibold inline-flex items-center gap-1` + active filter count `w-4 h-4 rounded-full bg-white text-purple-deep text-[9.5px] font-bold`
- Category chips row (horizontally scrollable, no scrollbar): `flex gap-1.5 w-max`. Chip: `px-3 py-1.5 rounded-full text-[12px] font-medium border`. Active: `bg-purple-deep text-white border-purple-deep`. Inactive: `bg-white text-ink/70 border-line-strong`

Scroll content (`absolute left-0 right-0 overflow-y-auto px-5 top-[220] bottom-[83]`):
- Count row: `text-[12.5px] text-ink/55` with `text-ink font-semibold` count + "сортирано по релевантност"
- Sort button: `text-[12px] font-medium text-purple-deep` with chevron-down

**Mentor card** (`MCard p-3.5 flex items-start gap-3`):
- Avatar: 56px, online dot if `availability === "today"`
- Name: `font-semibold text-ink text-[14px] leading-tight truncate`
- Title: `text-[11.5px] text-ink/60 truncate mt-0.5`
- Price: top-right `text-[14px] font-bold text-ink` + `text-[10px] text-ink/50 mt-0.5` "/час"
- Rating row: `text-[11px]` — stars `#FFB02E`, rating `font-semibold text-ink`, dot separator, review count `text-ink/55`, "Днес" `text-emerald-700 font-medium` if available today
- Topic chips: `px-2 py-0.5 rounded-full bg-purple-100 text-purple-deep text-[10.5px] font-medium`, max 3

**Loading skeleton:** 4 cards — `w-14 h-14 rounded-full bg-line-strong/60 animate-pulse` avatar + two text lines + two chip placeholders. Header chips also pulse. Loading indicator: `w-3 h-3 rounded-full border-2 border-purple-deep border-t-transparent animate-spin` + "Зареждаме ментори..."

**Offline state:** `bg-ink-soft` banner strip at `top-[116]` with amber "Без интернет" text + "Retry" button. Content area shows globe icon + "View saved" + "Try again" buttons. The "Book session" button on the mentor profile screen must be **explicitly disabled** (or hidden) when offline — do not allow ghost bookings to be submitted.

Filters bottom sheet (`rounded-t-[28px] bg-white`, overlay `bg-[rgba(15,10,50,0.5)]`):
- Drag handle: `w-9 h-1 rounded-full bg-line-strong`
- Header: `text-[18px] font-semibold text-ink` + "Изчисти / Clear" `text-[12.5px] font-semibold text-ink/55`
- Topic chips: `TopicChip` flex-wrap
- Price range: custom slider, two thumb handles `w-5 h-5 rounded-full bg-white border-2 border-purple-deep`, track `h-1 rounded-full bg-purple-deep`
- Language: `TopicChip` chips
- Rating: `flex gap-2`, each `flex-1 py-2 rounded-xl border text-[12.5px] font-semibold inline-flex items-center justify-center gap-1`. Active: `bg-purple-deep text-white border-purple-deep`
- Availability: `grid grid-cols-3 gap-2`, active: `bg-purple-deep text-white`
- CTA: "Виж 42 ментори" `CTA` component

---

### Mentee: Mentor public profile (`/(mentee)/browse/[mentorId]`)

`AppHeader` with back + share link button (`w-9 h-9 rounded-full bg-white/80 border border-line` with link icon).

Scroll content (`top: 106, bottom: 96 (sticky CTA)`):
- **Hero**: `flex items-center gap-4`. Avatar: 84px with online + border ring. Name: `text-[20px] font-light tracking-tight text-ink`. Title: `text-[12.5px] text-ink/65`. Rating row: `text-[11.5px]`.
- **Badges grid** `mt-4 grid grid-cols-3 gap-2`. Each: `rounded-2xl bg-white border border-line p-2.5 text-center`. Label: `text-[10.5px] text-ink/55 font-semibold uppercase tracking-wider`. Value: `text-[14px] font-semibold text-ink`. Price badge (3rd): `bg-purple-deep text-white` — label `text-white/70`, value `font-bold`.
- **About** `mt-4`: `Eyebrow` + `text-[13.5px] text-ink/75 leading-relaxed`. "Виж повече / Show more" `text-[12px] font-semibold text-purple-deep`.
- **Works on** `mt-4`: `Eyebrow` + `TopicChip` flex-wrap.
- **Reviews** `mt-4`: header with count + "Виж всички" link. Review card: `MCard p-3.5` — stars top-right + relative time, review text `text-[13px] text-ink/80`, reviewer avatar (20px `#CBCBFF` bg) + name `font-semibold text-ink` + role `text-ink/50`.

**Sticky CTA** (`absolute left-0 right-0 bottom-0`, `padding: "14px 20px 32px"`, `border-t border-line bg-white`):
- Left: duration label `text-[10.5px] uppercase tracking-wider text-ink/55 font-semibold` + price `text-[18px] font-bold text-ink` + strikethrough original `text-[12px] text-ink/40 line-through ml-1.5`. Price shown = `Math.round(price * 0.1)` (first session 90% off).
- Right: "Запази час / Book session" `flex-1 py-3.5 rounded-2xl bg-purple-deep text-white font-bold text-[14.5px]`.

---

### Mentee: Booking flow (`/(mentee)/browse/[mentorId]/book`)

`AppHeader` title "Запази час / Book a session" + X close button. Single screen, 4 steps via `useState`.

**Step header** (`absolute left-0 right-0 px-5 top-[110]`):
- Step label: `text-[11px] uppercase tracking-wider text-ink/50 font-semibold` + `StepDots` right
- Title: `mt-2 text-[20px] font-light tracking-tight text-ink`

**Step 1 — Slot picker** (`content top: 196, bottom: 142`):
- Month nav: `text-[14px] font-semibold text-ink` + prev/next `w-8 h-8 rounded-full bg-white border border-line`
- 7-day week `grid grid-cols-7 gap-1 mt-3`. Day button: `flex flex-col items-center py-2 rounded-xl`. Selected day: `bg-purple-deep text-white` — day abbr `text-white/70 text-[10px] font-semibold uppercase`, date `text-white text-[15px] font-semibold`. Inactive: `bg-white border border-line`.
- Available slots heading: `text-[12.5px] font-semibold text-ink/65`
- Slots `grid grid-cols-3 gap-2 mt-2.5`. Selected: `bg-purple-deep text-white`. Booked: `bg-slate-50 text-ink/30 line-through`. Available: `bg-white border border-line-strong text-ink`. Style: `py-2.5 rounded-xl text-[13px] font-semibold`.
- Timezone notice: `mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-purple-100/60`. Clock icon `text-purple-deep` + `text-[11.5px] text-purple-deep font-medium`. **Mandatory** — must show the user's resolved local timezone explicitly (e.g. "Времената са в UTC+2 / Times shown in your local time (UTC+2)") to prevent mentor/mentee scheduling disputes.
- CTA bar: selected slot label `text-[11.5px] text-ink/55` + "Continue" `CTA`.

**Slot conflict state:** warning toast from top. Just-taken slot: `bg-amber-50 text-amber-700 border-2 border-amber-200` + absolute `ЗАЕТ/GONE` badge `bg-amber-500 text-white text-[8.5px] font-bold uppercase`. Info card: `MCard p-3.5 bg-amber-50 border-amber-200` explaining why.

**Step 2 — Agenda** (`content top: 196, bottom: 142`):
- Topic field: `text-[12px] font-semibold text-ink mb-1.5` label + char counter `text-[10.5px] text-ink/50` right. Active input: `border-2 border-purple-deep`. Style: `px-3.5 py-3 rounded-xl bg-white text-[13.5px]`.
- Notes textarea: `border border-line-strong`, 6 rows, `resize-none`.
- Tip card: `mt-4 rounded-2xl bg-cream border border-line p-3.5 flex gap-2.5`. Sparkles icon in `w-7 h-7 rounded-full bg-purple-100 text-purple-deep`.
- CTA bar: Back `px-4 py-3.5 rounded-2xl border border-line-strong text-ink font-semibold text-[14px]` + Continue `CTA flex-1`.

**Step 3 — Review** (`content top: 196, bottom: 142`):
- Mentor card: `MCard p-4`. Avatar 48px + name + title. Grid `grid-cols-2 gap-2` with date/time Detail cells.
- Topic card: `MCard mt-3 p-4`. `Eyebrow` + topic title `text-[14px] font-semibold` + truncated notes + "Редактирай" link.
- Price breakdown card: `MCard mt-3 p-4`. `Eyebrow` + rows: session `text-[13px] text-ink/70 font-semibold`, first session discount `text-emerald-700 font-semibold`, platform fee. Divider `h-px bg-line my-2`. Total: `text-[14px] font-semibold text-ink` + `text-[18px] font-bold text-ink`.
- Policy note: `flex gap-2 text-[11.5px] text-ink/55` with shield icon `text-emerald-700`.
- CTA bar: Back + "Към плащане · €X.XX / Pay €X.XX" `CTA flex-1`.

**Step 4 — Payment** (`content top: 196, bottom: 142`):
- Apple Pay button: `flex-1 py-2.5 rounded-2xl bg-ink text-white font-semibold text-[13px]` with Apple logo.
- Google Pay button: `flex-1 py-2.5 rounded-2xl bg-white border border-line-strong font-semibold text-[13px]`.
- Divider "или с карта / or with card": `text-[10.5px] uppercase tracking-wider text-ink/40 font-semibold`.
- Card fields: same `FormField` style (`rounded-xl border border-line-strong px-3.5 py-3 bg-white text-[14px]`). Card number, expiry + CVC `grid-cols-2 gap-3`, cardholder name.
- Stripe security row: `mt-4 flex items-center justify-between p-3 rounded-xl bg-white border border-line`. Shield icon `text-emerald-700` + `text-[11.5px] text-ink/65` + Stripe wordmark `text-[10px] font-bold text-[#635BFF]`.
- CTA: "Потвърди · €X.XX / Confirm · €X.XX" `CTA` with shield icon.

**Payment declined state:** rose card `bg-rose-50 border-rose-200` with coral icon + error message + `font-mono text-[10.5px]` stripe error code. Slot hold timer: `bg-amber-100 text-amber-700`. Card inputs reset for retry.

---

### Mentee: Session confirmation (`/(mentee)/bookings/[sessionId]`)

`AppHeader` no back, X close right.

Content (`top: 110, bottom: 96`):
- Check icon: `relative w-20 h-20 mx-auto`. Outer `rounded-full bg-emerald-100`. Inner `absolute inset-3 rounded-full bg-emerald-500 flex items-center justify-center` with white check 28px `strokeWidth={2.8}`.
- Title: `mt-4 text-[24px] font-light tracking-tight text-ink text-center leading-snug max-w-[280px] mx-auto`
- Subtitle: `text-[13px] text-ink/55 text-center max-w-[290px] mx-auto leading-relaxed`
- Booking detail card: `MCard mt-5 p-4`. Avatar 48px + mentor name/title. Grid `grid-cols-2 gap-3` with Detail cells (date, time, paid, session#). Each Detail: `w-7 h-7 rounded-lg bg-purple-100 text-purple-deep` icon + label `text-[10px] uppercase tracking-wider text-ink/45` + value `text-[12.5px] font-semibold`.
- Topic card: `MCard mt-3 p-3.5`. `Eyebrow` + topic title.
- "Добави в Google Calendar" button: `mt-3 w-full py-3 rounded-2xl bg-white border border-line-strong text-ink font-semibold text-[13.5px]` with calendar icon.

CTA bar (bottom): "Join" button — disabled (`bg-slate-100 text-ink/40`) until T−5 min, shows countdown text "Линкът отваря след Xч Yмин / Link unlocks in Xh Ym" with video icon.

---

### Mentee: Bookings (`/(mentee)/bookings`)

Header (`absolute top-0 left-0 right-0 z-10 px-5 pt-[58px] pb-3 bg-cream`):
- Title: `font-display text-[26px] tracking-wide text-ink` + search button right
- `PillTabs`: Предстоящи/Upcoming (count) · Минали/Past (count) · Отменени/Cancelled (count)

Scroll content (`top: 200, bottom: 83`):
- Grouped by "Днес / Today", "Тази седмица / This week" — `Eyebrow` header per group.

**BookingRow** (`MCard p-3.5 mt-2 flex gap-3`): Avatar 44px + right content:
- Status badge + time label `text-[10.5px] text-ink/55`
- Title: `text-[13.5px] font-semibold text-ink line-clamp-1`
- "с Mentor Name · 60 мин": `text-[11.5px] text-ink/55`
- Action buttons row: primary `px-3 py-1.5 rounded-full text-[11.5px] font-semibold`. LIVE primary: `bg-coral text-white`. SCHEDULED primary: `bg-purple-deep text-white`. "Отмени / Cancel" ghost: `bg-white border border-line-strong text-ink/70`.

**Empty state:** `w-28 h-28 rounded-3xl bg-purple-100` calendar icon, peach sparkles badge `w-9 h-9 rounded-full bg-peach` top-right, purple-300 circle bottom-left. Title `text-[20px] font-light`. CTA button to browse.

**Cancel bottom sheet** (`rounded-t-[28px] bg-white pb-9 pt-4 px-5`, overlay `bg-[rgba(15,10,50,0.55)]`):
- Drag handle. Amber icon `w-14 h-14 rounded-2xl bg-amber-100 text-amber-700`.
- Title: `text-[19px] font-semibold text-ink text-center`.
- Session summary card with refund breakdown: paid, refund `text-emerald-700 font-semibold`, late cancellation fee `text-amber-700 font-semibold`.
- Policy link: `text-[11.5px] text-ink/55` + purple "Виж политиката".
- "Да, отмени · −€X / Yes, cancel · −€X": `CTA` with coral background. "Запази сесията / Keep": ghost.

**Post-cancel toast:** success tone, "Сесията е отменена / Session cancelled" + refund timeline body + "Отмени / Undo" action link.

**Review bottom sheet** (post-completed session):
- Star picker: 5 stars `text-amber-500`, tap to select.
- Textarea: min 20 chars, required.
- Submit → `POST /sessions/:id/review`.

---

### Mentee: Profile (`/(mentee)/profile`)

Header (`pt-[58px] pb-3`): title "Профил / Profile" + settings icon right.

Scroll content (`top: 116, bottom: 83`):
- User card: `MCard p-4 flex items-center gap-3 mt-2`. Avatar 56px + name `text-[15px] font-semibold` + email `text-[12px] text-ink/55` + "Редактирай / Edit" `text-[11.5px] font-semibold text-purple-deep`.
- "Стани ментор / Become a mentor" gradient card: `MCard mt-3 p-4` with `background: linear-gradient(135deg, #3E1D87 0%, #5254CF 100%), borderColor: transparent`. Icon `w-10 h-10 rounded-2xl bg-white/15`. Title `text-[14px] font-semibold text-white` + subtitle `text-[11.5px] text-white/70` + chevron-right `text-white/70`.
- Settings sections with `Eyebrow` headers. Each row: `bg-white border border-line rounded-2xl p-3 flex items-center gap-3`. Icon `w-8 h-8 rounded-lg bg-purple-100 text-purple-deep`. Label `text-[13.5px] font-medium text-ink`. Optional hint `text-[11.5px] text-ink/55`. Chevron-right `text-ink/35`.
- Sign out: `w-full py-3 rounded-2xl bg-white border border-line-strong text-coral font-semibold text-[13.5px]`.
- Version: `text-[10.5px] text-ink/35 text-center`.

---

### Mentor: Dashboard (`/(mentor)/dashboard`)

Header (`absolute top-0 left-0 right-0 z-10 px-5 pt-[58px] pb-3`):
- "Здравей, / Hi,": `text-[12px] text-ink/55`
- First name: `font-display text-[22px] tracking-wide text-ink leading-none`
- Bell button with coral notification dot + mentor avatar 36px right

Scroll content (`top: 116, bottom: 83`):
- **Next session hero** `Eyebrow` label ("Следваща сесия · след X мин") + gradient card:
  `rounded-3xl linear-gradient(135deg, #3E1D87 0%, #5254CF 100%)` with two decorative semi-transparent circles. Content `p-4 text-white`: mentee avatar 44px with border + name `text-[14px] font-semibold` + "Първа сесия / First session" `text-[11px] text-white/65` + time badge `px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold`. Topic quote: `text-[13.5px] font-medium leading-snug`. Actions: "Започни сесията / Start session" `px-3 py-2 rounded-xl bg-white text-purple-deep font-bold text-[12.5px]` + chat icon `bg-white/12` + more-vertical icon `bg-white/12`.

- **Stat cards** `grid grid-cols-2 gap-2 mt-4`. Each `MCard p-3`:
  - Icon: `w-7 h-7 rounded-lg {tint}`. Tints: `bg-purple-100`, `bg-peach/40`, `bg-emerald-100`.
  - Label: `text-[10.5px] text-ink/55 font-semibold uppercase tracking-wider`
  - Value: `text-[18px] font-bold text-ink`
  - Hint: `text-[10.5px]` (emerald for positive %, ink/45 for secondary)
  - Profile completeness card: `h-1 rounded-full bg-line` track + `bg-emerald-500` fill at `progress*100%`

- **Upcoming sessions** `mt-4`: `Eyebrow` + "Виж всички / See all" `text-[11.5px] font-semibold text-purple-deep`. List: `bg-white rounded-2xl border border-line divide-y divide-line`. Each row `flex items-center gap-3 p-3`: avatar 36px + name `text-[12.5px] font-semibold` + topic `text-[11px] text-ink/55` + time right-aligned `text-[11px] font-semibold` / date `text-[10px] text-ink/45`.

- **Recent reviews** `mt-4`: `Eyebrow`. Review card: `MCard p-3.5` — stars + relative time + quote `text-[12.5px] text-ink/80` + reviewer name `text-[10.5px] text-ink/55`.

---

### Mentor: Schedule (`/(mentor)/schedule`)

Header (`pt-[58px] pb-3`): "График / Schedule" `font-display text-[24px]` + "Запази / Save" `px-3 py-1.5 rounded-full bg-purple-deep text-white text-[11.5px] font-semibold` right. Horizontally scrollable `UnderlineTabs`.

Tabs: Шаблон/Template · Изключения/Overrides · Блокирани/Blocked · Настройки/Settings.

Scroll content (`top: 168, bottom: 83`):

**Template tab:**
- Subtitle: `text-[13.5px] font-semibold text-ink` + description `text-[11.5px] text-ink/55` + "Копирай / Copy" `text-[11.5px] font-semibold text-purple-deep`.
- Day cards `space-y-2`: `rounded-2xl p-3 border`. Active day: `bg-white border-line`. Inactive: `bg-cream border-line`.
  - Day circle: `w-8 h-8 rounded-full flex items-center justify-center text-[11.5px] font-semibold`. Active: `bg-purple-deep text-white`. Inactive: `bg-line text-ink/45`.
  - Day name: `text-[13px] font-semibold`. Active: `text-ink`. Inactive: `text-ink/45`.
  - `Switch` toggle right.
  - Time range rows (when active): `flex items-center gap-1.5`. Each time: `flex-1 px-3 py-1.5 rounded-lg bg-cream border border-line text-[12.5px] font-semibold text-ink`. Dash separator `text-ink/40`. Trash `w-7 h-7 rounded-lg bg-cream border border-line`.
  - "Добави диапазон / Add range": `text-[11px] font-semibold text-purple-deep inline-flex items-center gap-1 px-2`.

**Overlap error state:** conflicting day card: `border-2 border-coral bg-rose-50`. Ranges: `border-2 border-coral`. Inline error: `px-2 py-1.5 rounded-lg bg-coral/10 text-coral text-[11.5px] font-medium`. Header shows "1 проблем · запазването е спряно / 1 issue · save blocked" in coral.

**Overrides tab:**
- "Add override" dashed button: `border border-dashed border-purple-deep/40 bg-purple-100/30 text-purple-deep`.
- Override card: `MCard p-3`. Date `text-[13px] font-semibold` + range count `text-[11px] text-ink/55` + trash. Range pills: `px-2 py-1 rounded-md bg-purple-100 text-purple-deep text-[11.5px] font-semibold`.

**Blocked tab:**
- "Block dates" dashed button: `border border-dashed border-coral/40 bg-coral/5 text-coral`.
- Blocked card: `MCard p-3 flex items-center gap-3`. Icon: `w-10 h-10 rounded-xl bg-coral/10 text-coral`. Title + date range + days `text-[11px] text-ink/55`. Trash button.

**Settings tab** (`space-y-3`):
- Session length: `grid grid-cols-4 gap-1.5`. Active: `bg-purple-deep text-white`. Inactive: `bg-white border border-line-strong text-ink`. Style: `py-2.5 rounded-xl text-[12px] font-semibold`.
- Buffer: `grid grid-cols-5 gap-1.5`, same style.
- Min notice / Max per day: `MCard p-3.5`. Each row: `flex items-center justify-between`. Label `text-[12.5px] font-medium text-ink`. Stepper: minus `w-7 h-7 rounded-lg bg-cream border border-line`, value `w-12 text-center text-[14px] font-bold text-ink`, plus `w-7 h-7 rounded-lg bg-purple-deep text-white`, unit `text-[11px] text-ink/55`.
- Visibility: `MCard p-3.5 flex items-center justify-between`. Eye icon `w-9 h-9 rounded-xl bg-purple-100 text-purple-deep`. Label + subtitle. `Switch`.
- Google Calendar: `MCard p-3.5 flex items-center gap-2.5`. Google icon `w-8 h-8 rounded-lg bg-white border border-line`. Connected: `text-[11px] text-emerald-700 inline-flex items-center gap-1`. Disconnect button `text-[11px] font-semibold text-ink/55`.

**Save success:** success `Toast` overlaid at `absolute top-2` with "Запазено преди няколко секунди / Saved just now" subtitle + emerald check.

---

### Mentor: Sessions (`/(mentor)/sessions`)

Header (`pt-[58px] pb-3`): "Сесии / Sessions" `font-display text-[24px]` + search right. `PillTabs`.

Scroll content (`top: 200, bottom: 83`). Grouped with `Eyebrow` headers.

**MentorSessionRow** (`MCard p-3 mt-2 flex items-start gap-3`): Avatar 42px + right content:
- Name `text-[12.5px] font-semibold text-ink truncate` + topic `text-[11px] text-ink/55 truncate` left; time `text-[12px] font-bold text-ink` + duration `text-[10.5px] text-ink/50` right.
- Bottom row: `SessionBadge` + action button `px-3 py-1 rounded-full text-[11px] font-semibold`.
  - LIVE "End": `bg-coral text-white`
  - SCHEDULED "Start": `bg-purple-deep text-white`
  - "Details": `bg-white border border-line-strong text-ink`

**Empty state:** `w-24 h-24 rounded-3xl bg-emerald-100` check-circle icon. "График ти е свободен! / Schedule is clear!" + profile share card with `font-mono` profile URL + "Копирай / Copy" `px-3 py-1.5 rounded-full bg-purple-deep text-white text-[11px] font-semibold`.

---

### Mentor: Profile edit (`/(mentor)/profile`)

Header (`pt-[58px] pb-3`): "Профил / Profile" `font-display text-[24px]` + "Запази / Save" pill right.

Scroll content (`top: 110, bottom: 83`):
- **Live preview card**: `MCard mt-2 p-3.5 flex items-start gap-3`, `background: linear-gradient(135deg, #FFBC96 0%, #FE5B52 100%), borderColor: transparent`. Avatar 48px with border. Right: "Преглед на живо / Live preview" `Eyebrow text-white/75`, name `text-[14px] font-semibold text-white`, title `text-[11.5px] text-white/80`, rating row `text-[11px]`.
- **Headline**: `Eyebrow mt-4` + `input mt-1.5 w-full px-3.5 py-3 rounded-xl border border-line-strong bg-white text-[13px]`.
- **About**: `Eyebrow mt-3` + `textarea rows={4} resize-none` + `text-[10.5px] text-ink/45 text-right` char counter.
- **Topics** `Eyebrow mt-2 "(макс. 5)"`: `TopicChip` flex-wrap.
- **Languages** `Eyebrow mt-3`: `TopicChip` flex-wrap with flag emojis.
- **Price grid** `mt-3 grid grid-cols-2 gap-2`: Hourly rate input `rounded-xl bg-white border border-line-strong text-[13.5px] font-semibold`. "You earn" `rounded-xl bg-emerald-100/50 text-emerald-700 text-[13.5px] font-semibold`. Fee note `text-[10.5px] text-ink/45`.
- **Visibility**: `MCard mt-4 p-3.5 flex items-center gap-3`. Eye icon `w-9 h-9 rounded-xl bg-purple-100 text-purple-deep`. Label + subtitle. `Switch on`.
- **"Switch to mentee view"**: `mt-3 w-full py-3 rounded-2xl bg-white border border-line-strong text-ink font-semibold text-[13px]` with users-check icon `text-purple-deep`.

**Unsaved changes sheet** (on nav away with dirty form): `rounded-t-[28px] bg-white`. Purple edit icon. Title + list of changed fields in `MCard bg-cream border-line` (`text-[12px]` rows). Three CTAs: "Запази и излез" `CTA`, "Продължи редакцията" ghost, "Изхвърли" `text-coral`.

---

## State management

| Store | Contents |
|---|---|
| `authStore` (Zustand) | `user`, `scopes`, `token`, `setAuth`, `clearAuth` |
| `filterStore` (Zustand) | mentee browse filters — persists across tab switches |
| Server state | TanStack Query — all API data |
| Form state | TanStack Form + Zod — booking flow, review, schedule, profile |
| Step state | local `useState` — booking flow steps, session tabs |

---

## API integration

Single axios instance in `src/lib/api.ts`. Base URL from `EXPO_PUBLIC_API_URL` env var. Request interceptor attaches JWT. Response interceptor handles 401.

| Hook | Endpoint | Notes |
|---|---|---|
| `useMentors(filters)` | `GET /mentors` | `staleTime: 30s`, infinite query |
| `useMentor(id)` | `GET /mentors/:id` | `staleTime: 60s` |
| `useMentorAvailability(id, from, to)` | `GET /mentors/:id/availability` | `staleTime: 0` |
| `useMySessions()` | `GET /me/sessions` | |
| `useSession(id)` | `GET /sessions/:id` | |
| `useCreateSession()` | `POST /sessions` | called on booking step 4 entry |
| `useCreatePayment(sessionId)` | `POST /payments/sessions/:id` | returns `{ client_secret }` |
| `useCancelSession()` | `POST /sessions/:id/cancel` | optimistic update |
| `useCreateReview()` | `POST /sessions/:id/review` | |
| `useDashboard()` | `GET /mentor/me` | |
| `useMentorSessions(status)` | `GET /mentor/sessions?status=` | |
| `useStartSession()` | `POST /sessions/:id/start` | |
| `useEndSession()` | `POST /sessions/:id/end` | |
| `useSchedule()` | `GET /mentor/schedule` | |
| `useSaveSchedule()` | `PUT /mentor/schedule` | |
| `useMentorMe()` | `GET /mentor/me` | |
| `useUpdateMentorMe()` | `PUT /mentor/me` | |

---

## File structure

```
adviz-mobile/
  app/                               ← Expo Router routes (see Navigation section)
  src/
    features/
      Auth/
        api/hooks.ts
        components/
          login-form.tsx
          register-form.tsx
        schemas/auth.ts
      Mentors/
        api/
          types.ts
          hooks.ts
        components/
          mentor-card.tsx
          mentor-filter-sheet.tsx
          booking-flow.tsx
          slot-picker.tsx
      Sessions/
        api/
          types.ts
          hooks.ts
        components/
          session-row.tsx
          booking-row.tsx
          review-sheet.tsx
          cancel-sheet.tsx
          session-confirmation.tsx
      MentorDashboard/
        api/hooks.ts
        components/
          next-session-card.tsx
          stat-card.tsx
          upcoming-row.tsx
      MentorSchedule/
        api/hooks.ts
        components/
          template-tab.tsx
          overrides-tab.tsx
          blocked-tab.tsx
          settings-tab.tsx
          time-range-row.tsx
        schemas/schedule.ts
      MentorSessions/
        api/hooks.ts
        components/
          mentor-session-row.tsx
      MentorProfile/
        api/hooks.ts
        components/
          profile-form.tsx
          topic-picker.tsx
          unsaved-changes-sheet.tsx
        schemas/profile.ts
    store/
      auth.ts
      filters.ts
    lib/
      api.ts
      secure-storage.ts
      scopes.ts
    components/
      ui/
        Avatar.tsx            ← MAvatar
        SessionBadge.tsx
        TopicChip.tsx
        MCard.tsx
        StepDots.tsx
        PillTabs.tsx
        UnderlineTabs.tsx
        Switch.tsx
        Toast.tsx
        CTA.tsx
        Eyebrow.tsx
        AppHeader.tsx
        TabBar.tsx
        HomeIndicator.tsx
  locales/
    bg.json
    en.json
  tailwind.config.js
  app.json
  eas.json
  package.json
  .env.example
```

---

## Testing

- **Unit/component:** Jest + React Native Testing Library — hooks, form validation, scope helpers, shared components, booking flow steps
- **E2E:** Detox on EAS (iOS simulator + Android emulator) — critical flows: login → browse → book → confirm; mentor login → schedule edit → session start/end; cancel flow with refund sheet
- **Coverage minimum: 60%**
- Stripe: mock `@stripe/stripe-react-native` in unit/component tests; use Stripe test cards in E2E dev build

---

## Docker / Compose wiring

Metro bundler runs on the host machine — no Docker container needed for `adviz-mobile`. The app connects to Traefik at `EXPO_PUBLIC_API_URL=http://localhost:80` during local development. No changes to `adviz-compose/` required.

---

## Environment variables

```
EXPO_PUBLIC_API_URL=        # http://localhost:80 (dev) | https://api.domain.bg (prod)
EXPO_PUBLIC_STRIPE_KEY=     # Stripe publishable key
```

---

## Deferred (post-MVP)

- Push notifications — **deferred** (session reminders via Expo Notifications + backend webhook; add `expo-notifications` to package.json now with no-op handler so the permission prompt can be shown post-onboarding)
- In-app video call (replaces "Join" external URL stub — Daily.co / Agora TBD)
- Stripe Connect onboarding for mentors (set up payout account from mobile)
- Apple Calendar `.ics` download (confirmation screen shows stub)
- Offline write support (cancel session offline, sync on reconnect)
- Admin panel mobile access
- Google Calendar "Add event" deep-link (button shown, implementation deferred)
