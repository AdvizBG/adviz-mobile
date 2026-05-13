# Design: adviz-mobile — React Native mobile app (mentee + mentor)

**Date:** 2026-05-13
**Scope:** Universal Expo app (iOS + Android primary, web as bonus) covering mentee booking flows and mentor self-management
**Approach:** Expo managed workflow + Expo Router v4 + role-gated tab navigation

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

Typography: **Inter** via `@expo-google-fonts/inter`. Use NativeWind semantic scale — no arbitrary pixel values.

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
- Unauthenticated → redirect to `/(auth)/login`
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

**Mentee:** Browse (search icon) · Bookings (calendar icon) · Profile (user icon)

**Mentor:** Dashboard (home icon) · Schedule (calendar icon) · Sessions (video icon) · Profile (user icon)

### Role switching (dual-role users)

Approved mentors are also mentees. Both tab groups coexist in the router — switching is instant with no re-auth.

- Mentee `Profile` screen: shows "Switch to Mentor View" button if `mentor:me` in scopes → `router.replace('/(mentor)/dashboard')`
- Mentor `Profile` screen: always shows "Switch to Mentee View" → `router.replace('/(mentee)/browse')`

---

## Screens

### Auth

**Login** — email + password fields via TanStack Form, "Sign up" link, Bulgarian-first labels.

**Register** — full name, email, password, confirm password via TanStack Form.

---

### Mentee: Browse (`/(mentee)/browse`)

Mirrors `adviz-frontend` mentor listing.

- Search bar (debounced 400ms) + filter chips row (topic, price, rating, availability)
- "Filters" button opens a `@gorhom/bottom-sheet` with full filter panel
- `FlatList` of mentor cards: avatar (initials + color), name, title, star rating, topic chips (max 3), price per session, "View" button
- Loading: skeleton cards with animated pulse
- Empty state: dashed border card + "Clear filters" CTA
- Pagination: load-more on scroll (`fetchNextPage`)
- TanStack Query: `GET /mentors` with filter params, `staleTime: 30_000`

**Mentor profile** (`/(mentee)/browse/[mentorId]`):

- `ScrollView`: avatar (large), name, badges row (experience, languages, session duration), expandable about, expandable education, topics grid, reviews (2 shown, "See all" expands in place)
- Sticky bottom bar: price + "Book" button
- TanStack Query: `GET /mentors/:id`, `staleTime: 60_000`

**Booking flow** (`/(mentee)/browse/[mentorId]/book`):

Single screen, 4-step component — step state in `useState`. Progress indicator at top.

1. **Slot picker** — scrollable week view (7-day columns, hourly slots). Available: default. Selected: `purple-deep`. Booked: dimmed. Fetches `GET /mentors/:id/availability`, `staleTime: 0`.
2. **Agenda** — topic field (required, max 256 chars) + notes textarea (optional). TanStack Form + Zod. Validates on blur.
3. **Review** — summary card: mentor, slot, price breakdown (platform 15% fee shown).
4. **Payment** — on step 4 entry: `POST /sessions` then `POST /payments/sessions/:id` → `{ client_secret }`. Mounts Stripe `CardField`. "Pay €X" submit → `stripe.confirmPayment`. Success → navigate to `/(mentee)/bookings/:sessionId`. Error → inline banner, stay on step 4 (slot preserved). Idempotent: existing session for same slot+mentor+mentee returns existing `client_secret`.

---

### Mentee: Bookings (`/(mentee)/bookings`)

Three tabs: Предстоящи · Минали · Отменени. Tab state in local `useState`.

Session rows: mentor avatar, topic, date/time, duration, status badge, action button.

**Status badges:**
- `SCHEDULED`: purple-100 / purple-deep
- `LIVE`: coral/10 + pulsing dot
- `COMPLETED`: emerald-100 / emerald-700
- `CANCELLED` / `NO_SHOW`: slate-100 / ink/50

**Actions:**
- Upcoming: "Join" (opens external URL stub, disabled until T−5 min) + "Cancel" (confirm bottom sheet — warns about 24h cancellation policy → `POST /sessions/:id/cancel`, optimistic update)
- Completed: "Leave review" (bottom sheet — star picker + textarea min 20 chars, TanStack Form → `POST /sessions/:id/review`) or "Reviewed" if already submitted
- Cancelled: read-only

**Session confirmation** (`/(mentee)/bookings/[sessionId]`):

- Emerald check icon, title, mentor card, date/time grid, "Add to calendar" (Google Calendar link) + "Join" (external URL stub, disabled until T−5 min)

---

### Mentor: Dashboard (`/(mentor)/dashboard`)

- **Next session hero card**: mentee avatar, name, topic, date/time/duration, "Join" button (external URL stub) — empty state if no upcoming session
- **4 stat cards** (2×2 grid): earnings this month, avg rating, profile completeness, next payout date
- **Upcoming sessions list** (max 4 rows): mentee avatar + name, topic, date/time — "See all" → `/(mentor)/sessions`
- **Recent reviews** (max 2): star rating + body + mentee name + date — "See all" stub

TanStack Query: `GET /mentor/me`, `GET /mentor/sessions?status=upcoming`.

---

### Mentor: Schedule (`/(mentor)/schedule`)

Four tabs (Template · Overrides · Blocked · Settings).

- **Template**: weekday toggles (Mon–Sun), time range inputs per active day (start/end + add/remove range), "Copy to weekdays" action
- **Overrides**: date picker + custom time ranges for specific dates
- **Blocked**: date range picker + optional reason, list of existing blocks with delete
- **Settings**: session length select (30/45/60/90 min), buffer select (0/5/10/15/30 min), min notice input (hours), max per day input, visibility toggle (public/private)

TanStack Form + Zod per tab. "Save" → `PUT /mentor/schedule`. Success toast on save.

---

### Mentor: Sessions (`/(mentor)/sessions`)

Three tabs: upcoming / past / cancelled.

Session rows: mentee avatar, topic, date/time, status badge, action button.

- Upcoming: "Start" → `POST /sessions/:id/start`
- Live: "End" → `POST /sessions/:id/end` + "Join" (external URL stub)
- Past/cancelled: read-only

---

### Mentor: Profile (`/(mentor)/profile`)

- Headline (text input), about (textarea, 500 char counter)
- Topics pill picker (max 5 selected)
- Languages pill picker
- Price per hour (number input, EUR)
- Session length preference (select)
- Visibility toggle (published / hidden)
- "Switch to Mentee View" button

TanStack Form + Zod. `GET /mentor/me` on load. `PUT /mentor/me` on save.

---

## State management

| Store | Contents |
|---|---|
| `authStore` (Zustand) | `user`, `scopes`, `token`, `setAuth`, `clearAuth` |
| `filterStore` (Zustand) | mentee browse filters — persists across tab switches |
| Server state | TanStack Query — all API data |
| Form state | TanStack Form — booking flow, review, schedule, profile |
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
          review-sheet.tsx
          session-confirmation.tsx
      MentorDashboard/
        api/hooks.ts
        components/
          next-session-card.tsx
          stat-card.tsx
      MentorSchedule/
        api/hooks.ts
        components/
          template-tab.tsx
          overrides-tab.tsx
          blocked-tab.tsx
          settings-tab.tsx
        schemas/schedule.ts
      MentorProfile/
        api/hooks.ts
        components/
          profile-form.tsx
          topic-picker.tsx
        schemas/profile.ts
    store/
      auth.ts
      filters.ts
    lib/
      api.ts
      secure-storage.ts
      scopes.ts
    components/
      ui/                            ← shared primitives (Avatar, Badge, Button, Card)
      avatar-circle.tsx
      status-badge.tsx
      bottom-sheet.tsx
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

- **Unit/component:** Jest + React Native Testing Library — hooks, form validation, scope helpers, mentor card, session row, booking flow steps
- **E2E:** Detox on EAS (iOS simulator + Android emulator) — critical flows: login → browse → book → confirm; mentor login → schedule edit → session start/end
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

- Push notifications (session reminders via Expo Notifications + backend webhook)
- In-app video call (replaces "Join" external URL stub — Daily.co / Agora TBD)
- Stripe Connect onboarding for mentors (set up payout account from mobile)
- Apple Calendar `.ics` / Google Calendar "Add event" (confirmation screen shows stub)
- Offline write support (cancel session offline, sync on reconnect)
- Admin panel mobile access
- Stripe v2 webhook event handlers
