# Design: adviz-mentors-ms + adviz-sessions-ms + adviz-payments-ms

**Date:** 2026-05-07
**Scope:** MVP backend services for the Adviz mentorship marketplace
**Approach:** Option B — model-first across all services, then endpoints sequentially

---

## Routing by environment

| Environment | Backend base |
|---|---|
| Docker Compose dev/staging | `PathPrefix(/api)` via Traefik (each service on its own path prefix) |
| K8s prod | `api.domain.bg` (single subdomain, Traefik routes by path prefix internally) |

Frontend services must use `VITE_API_URL` env var — no hardcoded base URLs in any frontend code.

---

## Phase overview

1. **Scope rename + model-first** — rename all venue/booking scopes in `users-ms`, create all three service directories, write all Tortoise models, run migrations, upgrade Tortoise to `>=1.1.7`
2. **mentors-ms endpoints + tests** — full MVP endpoint impl, 60% coverage minimum
3. **sessions-ms endpoints + tests** — full MVP endpoint impl, 60% coverage minimum
4. **payments-ms endpoints + tests** — full MVP endpoint impl, 60% coverage minimum

---

## Phase 1: Scope rename in users-ms

The `scopes` field on `User` stays named `scopes`. Only the scope values change. Traefik header stays `X-User-Scopes` — no compose changes needed.

### Remove

- `VenueScope` enum + all descriptions
- `BookingScope` enum + all descriptions
- `DEFAULT_OWNER_SCOPES`

### Add

```python
class MentorScope(StrEnum):
    READ         = "mentor:read"       # browse public profiles
    APPLY        = "mentor:apply"      # submit an application
    ME           = "mentor:me"         # manage own profile (granted on approval)
    ADMIN        = "admin:mentors"
    ADMIN_APPS   = "admin:applications"

class SessionScope(StrEnum):
    READ         = "sessions:read"     # view own sessions
    WRITE        = "sessions:write"    # create a session
    CANCEL       = "sessions:cancel"   # cancel own session
    MANAGE       = "sessions:manage"   # start/end sessions (mentor, granted on approval)
    ADMIN        = "admin:sessions"

DEFAULT_USER_SCOPES = [
    UserScope.ME,
    MentorScope.READ,
    MentorScope.APPLY,
    SessionScope.READ,
    SessionScope.WRITE,
    SessionScope.CANCEL,
]

DEFAULT_MENTOR_SCOPES = DEFAULT_USER_SCOPES + [
    MentorScope.ME,
    SessionScope.MANAGE,
]

DEFAULT_ADMIN_SCOPES = [
    UserScope.ADMIN,
    MentorScope.ADMIN,
    MentorScope.ADMIN_APPS,
    SessionScope.ADMIN,
]
```

### Admin panel (`adviz-admin-panel/src/lib/scopes.ts`)

```ts
export const isAdmin = (scopes: string[]): boolean =>
    scopes.some((s) => s.startsWith("admin:"));

export const isMentor = (scopes: string[]): boolean =>
    scopes.includes("mentor:me") && !isAdmin(scopes);
```

Replace `isVenueOwner` with `isMentor` everywhere it is used.

### Admin panel dashboard components (adapt in place)

The four ported components must be renamed and reshaped for the mentor domain:

| Old file | New file | Key changes |
|---|---|---|
| `owner-status-banner.tsx` | `mentor-status-banner.tsx` | `isVenueOwner` → `isMentor`; link to `/mentors` |
| `owner-occupancy.tsx` | `mentor-occupancy.tsx` | sessions count instead of venue occupancy |
| `owner-earnings.tsx` | `mentor-earnings.tsx` | field names from sessions-ms response |
| `owner-pending-bookings.tsx` | `mentor-pending-sessions.tsx` | session domain terminology |

The four enabled venue routes (`/venues/*`, `/bookings`) must be removed — they are not part of the Adviz mentorship domain. The correct routes (`/mentors/*`, `/sessions/*`) will be added when the frontend feature is built.

---

## Phase 1: Service layout

Both services are created as new directories in the monorepo root and wired into `adviz-compose/`.

### Directory structure (both services follow this pattern)

```
adviz-mentors-ms/
  app/
    __init__.py
    settings.py       # DB_URL, LOG_LEVEL via Pydantic BaseSettings
    models.py         # all Tortoise models
    schemas.py        # Pydantic v2 request/response schemas
    crud.py           # extends ms_core.CRUD per model
    deps.py           # get_current_user() from X-User-* headers (no JWT)
    scopes.py         # MentorScope StrEnum + DEFAULT_*_SCOPES
    logging.py        # setup_logging() (mirror users-ms)
    routers/
      mentors.py      # public listing + profile
      mentor_me.py    # authenticated mentor self-management
      applications.py # mentor application flow
      admin.py        # admin mentor/application endpoints
      health.py
  migrations/
  tests/
    conftest.py
    factories.py
    test_mentors.py
    test_applications.py
    test_mentor_me.py
    test_admin.py
  main.py
  pyproject.toml
  Dockerfile
  entrypoint.sh
  .dockerignore

adviz-sessions-ms/
  app/
    __init__.py
    settings.py
    models.py
    schemas.py
    crud.py
    deps.py
    scopes.py         # SessionScope
    logging.py
    routers/
      sessions.py     # create/get/cancel + review submission
      me.py           # GET /me/sessions (mentee)
      mentor.py       # GET /mentor/sessions (mentor)
      admin.py        # live monitoring, reviews moderation
      health.py
  migrations/
  tests/
    conftest.py
    factories.py
    test_sessions.py
    test_reviews.py
    test_admin.py
  main.py
  pyproject.toml
  Dockerfile
  entrypoint.sh
  .dockerignore
```

### deps.py pattern (shared by both services)

Downstream services never validate the JWT. They read Traefik-injected headers only.

```python
class CurrentUser(BaseModel):
    id: UUID
    username: str
    scopes: list[str]

async def get_current_user(
    x_user_id: Annotated[str | None, Header(alias="X-User-Id")] = None,
    x_username: Annotated[str | None, Header(alias="X-Username")] = None,
    x_user_scopes: Annotated[str | None, Header(alias="X-User-Scopes")] = None,
) -> CurrentUser:
    if not x_user_id or not x_username:
        raise HTTPException(status_code=401)
    return CurrentUser(
        id=UUID(x_user_id),
        username=x_username,
        scopes=x_user_scopes.split() if x_user_scopes else [],
    )

def require_scopes(*required: str):
    async def _dep(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        missing = [s for s in required if s not in user.scopes]
        if missing:
            raise HTTPException(status_code=403, detail=f"Missing scopes: {', '.join(missing)}")
        return user
    return _dep
```

### Migrations (Tortoise 1.1.7 built-in CLI — Aerich dropped)

`pyproject.toml`:
```toml
[project]
dependencies = [
    "fastapi[standard]>=0.112.4",
    "ms-core",
    "pydantic>=2.11.7",
    "tortoise-orm[asyncpg]>=1.1.7",
    "loguru>=0.7.3",
    "httpx>=0.28.1",
]

[tool.tortoise]
tortoise_orm = "main.TORTOISE_ORM"
```

`main.py` exports `TORTOISE_ORM` alongside `setup_app()` return value:
```python
TORTOISE_ORM = {
    "connections": {"default": db_url},
    "apps": {
        "models": {
            "models": ["app.models"],
            "default_connection": "default",
            "migrations": "migrations",
        }
    },
}
```

`entrypoint.sh` runs `python -m tortoise -c main.TORTOISE_ORM migrate` before uvicorn.

Migration workflow:
```bash
python -m tortoise -c main.TORTOISE_ORM init          # first time only
python -m tortoise -c main.TORTOISE_ORM makemigrations
python -m tortoise -c main.TORTOISE_ORM migrate
```

---

## Phase 1: mentors-ms models

```python
class ApplicationStatus(StrEnum):
    PENDING    = "pending"
    IN_REVIEW  = "in_review"
    INTERVIEW  = "interview"
    APPROVED   = "approved"
    REJECTED   = "rejected"
    NEEDS_INFO = "needs_info"

class MentorStatus(StrEnum):
    ACTIVE    = "active"
    PAUSED    = "paused"
    SUSPENDED = "suspended"

class Visibility(StrEnum):
    PUBLIC  = "public"
    PRIVATE = "private"

class MentorApplication(AbstractModel):
    id               = fields.UUIDField(primary_key=True)
    user_id          = fields.UUIDField()
    status           = fields.CharEnumField(ApplicationStatus, default=ApplicationStatus.PENDING)
    headline         = fields.CharField(max_length=256)
    about            = fields.TextField()
    topics           = fields.JSONField(default=list)
    languages        = fields.JSONField(default=list)
    hourly_price_eur = fields.DecimalField(max_digits=8, decimal_places=2)
    sample_answer    = fields.TextField()
    links            = fields.JSONField(default=dict)
    id_docs          = fields.JSONField(default=dict)
    submitted_at     = fields.DatetimeField(auto_now_add=True)
    reviewed_by      = fields.UUIDField(null=True)
    decided_at       = fields.DatetimeField(null=True)
    reject_reason    = fields.TextField(null=True)
    interview_at     = fields.DatetimeField(null=True)
    checklist        = fields.JSONField(default=dict)

    class Meta:
        table = "mentor_applications"

class MentorApplicationNote(AbstractModel):
    id            = fields.UUIDField(primary_key=True)
    application   = fields.ForeignKeyField("models.MentorApplication", related_name="notes")
    author_user_id = fields.UUIDField()
    body          = fields.TextField()
    created_at    = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "mentor_application_notes"

class MentorApplicationEvent(AbstractModel):
    id           = fields.UUIDField(primary_key=True)
    application  = fields.ForeignKeyField("models.MentorApplication", related_name="events")
    event_type   = fields.CharField(max_length=64)
    payload      = fields.JSONField(default=dict)
    created_at   = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "mentor_application_events"

class MentorProfile(AbstractModel):
    id               = fields.UUIDField(primary_key=True)
    user_id          = fields.UUIDField(unique=True)
    status           = fields.CharEnumField(MentorStatus, default=MentorStatus.ACTIVE)
    headline         = fields.CharField(max_length=256)
    about            = fields.TextField()
    topics           = fields.JSONField(default=list)
    languages        = fields.JSONField(default=list)
    hourly_price_eur = fields.DecimalField(max_digits=8, decimal_places=2)
    links            = fields.JSONField(default=dict)
    calendar_provider    = fields.CharField(max_length=32, null=True)
    calendar_external_id = fields.TextField(null=True)
    stripe_account_id    = fields.CharField(max_length=128, null=True)
    total_sessions   = fields.IntField(default=0)
    avg_rating       = fields.FloatField(null=True)
    since            = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "mentor_profiles"

class AvailabilityTemplate(AbstractModel):
    id       = fields.UUIDField(primary_key=True)
    mentor   = fields.ForeignKeyField("models.MentorProfile", related_name="availability_templates")
    weekday  = fields.IntField()              # 0=Mon … 6=Sun
    start_time = fields.TimeField()
    end_time   = fields.TimeField()
    timezone = fields.CharField(max_length=64, default="Europe/Sofia")

    class Meta:
        table = "availability_templates"

class AvailabilityBlock(AbstractModel):
    id       = fields.UUIDField(primary_key=True)
    mentor   = fields.ForeignKeyField("models.MentorProfile", related_name="availability_blocks")
    start_at = fields.DatetimeField()
    end_at   = fields.DatetimeField()
    reason   = fields.CharField(max_length=256, null=True)

    class Meta:
        table = "availability_blocks"

class SessionSettings(AbstractModel):
    mentor          = fields.OneToOneField("models.MentorProfile", primary_key=True, related_name="session_settings")
    length_minutes  = fields.IntField(default=60)   # 30/45/60/90
    buffer_minutes  = fields.IntField(default=10)   # 0/5/10/15/30
    min_notice_hours = fields.IntField(default=24)
    max_per_day     = fields.IntField(default=4)
    visibility      = fields.CharEnumField(Visibility, default=Visibility.PUBLIC)

    class Meta:
        table = "session_settings"
```

**Key constraint:** `MentorApplication` and `MentorProfile` are always separate records. On approval the admin endpoint: (1) calls `PATCH /users/{id}/scopes` on users-ms to grant `mentor:me` + `sessions:manage`, (2) creates `MentorProfile` from application data. If users-ms is down, the whole operation rolls back — no partial state.

**Distributed transaction risk:** If users-ms succeeds but `MentorProfile` creation fails (e.g. DB constraint violation in mentors-ms), the user has mentor scopes but no profile. Since these are separate services a single DB transaction cannot span both. Mitigate with: (a) make `MentorProfile` creation idempotent on `user_id` so an admin can safely retry the approval endpoint, and (b) add a reconciliation check in `GET /admin/applications/{id}` that flags `scopes_granted=True, profile_missing=True` so broken states are visible.

**Price precision:** When copying `hourly_price_eur` from `MentorApplication` to `MentorProfile`, always round to two decimal places via `Decimal(str(value)).quantize(Decimal("0.01"))` before persisting. Raw float arithmetic can silently introduce sub-cent drift.

**JSON field indexing:** `topics` and `languages` are `JSONField` — fine for MVP. Once filtering on these fields lands in `GET /mentors`, add GIN indexes in a migration:
```sql
CREATE INDEX mentor_profiles_topics_gin   ON mentor_profiles USING GIN (topics);
CREATE INDEX mentor_profiles_languages_gin ON mentor_profiles USING GIN (languages);
```

---

## Phase 1: sessions-ms models

sessions-ms is intentionally Stripe-agnostic. It knows whether a session is paid (`is_paid`) but not how or via which provider. payments-ms writes `is_paid=True` via an internal endpoint on successful payment. This preserves microservice independence — if payments-ms is down, sessions remain queryable.

```python
class SessionStatus(StrEnum):
    SCHEDULED = "scheduled"
    LIVE      = "live"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW   = "no_show"

class ReviewStatus(StrEnum):
    PUBLISHED = "published"
    FLAGGED   = "flagged"
    HIDDEN    = "hidden"

class Session(AbstractModel):
    id               = fields.UUIDField(primary_key=True)
    mentor_id        = fields.UUIDField()
    mentee_id        = fields.UUIDField()
    scheduled_start  = fields.DatetimeField()
    scheduled_end    = fields.DatetimeField()
    status           = fields.CharEnumField(SessionStatus, default=SessionStatus.SCHEDULED)
    topic            = fields.CharField(max_length=256)
    agenda           = fields.TextField(null=True)
    price_eur        = fields.DecimalField(max_digits=8, decimal_places=2)
    is_paid          = fields.BooleanField(default=False)
    started_at       = fields.DatetimeField(null=True)
    ended_at         = fields.DatetimeField(null=True)
    recording_url    = fields.TextField(null=True)     # field present, no logic for MVP
    created_at       = fields.DatetimeField(auto_now_add=True)
    cancelled_at     = fields.DatetimeField(null=True)
    cancel_reason    = fields.TextField(null=True)

    class Meta:
        table = "sessions"

class Review(AbstractModel):
    id         = fields.UUIDField(primary_key=True)
    session    = fields.OneToOneField("models.Session", related_name="review")
    mentor_id  = fields.UUIDField()               # denormalized from Session on creation
    mentee_id  = fields.UUIDField()               # denormalized from Session on creation
    rating     = fields.IntField()                # 1–5
    body       = fields.TextField()
    status     = fields.CharEnumField(ReviewStatus, default=ReviewStatus.PUBLISHED)
    flagged_by = fields.UUIDField(null=True)
    flag_reason = fields.CharField(max_length=256, null=True)
    flagged_at = fields.DatetimeField(null=True)
    hidden_at  = fields.DatetimeField(null=True)
    hidden_by  = fields.UUIDField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "reviews"
```

**Status transitions** enforced at router level:
- `SCHEDULED` → `LIVE` | `CANCELLED`
- `LIVE` → `COMPLETED` | `NO_SHOW`
- `COMPLETED`, `CANCELLED`, `NO_SHOW` → 409 (terminal)

**NO_SHOW timing guard:** `NO_SHOW` may only be set when `utcnow() > session.scheduled_start`. Reject with 409 if the transition is attempted before the session was due to start — a pre-start no-show is a cancellation, not a no-show.

`mentor_id` / `mentee_id` on `Review` are denormalized from `Session` at creation time — avoids a join on every admin moderation query.

---

## Idempotency-Key header

`POST /sessions` and `POST /payments/sessions/{session_id}` must accept an `Idempotency-Key` request header. Store the key alongside the created record and, on a duplicate key, return the original response with `200 OK` rather than creating a second record. This prevents double-bookings on laggy connections where the client retries a timed-out request.

---

## Phase 2: mentors-ms endpoints (MVP)

```
# Public (no auth)
GET  /mentors                             list + filter (topic, lang, min_price, max_price, q, page)
GET  /mentors/{id}                        public profile
GET  /mentors/{id}/availability           available slots (?from=&to=)

# Mentor self-management (mentor:me)
GET  /mentor/me
PUT  /mentor/me
GET  /mentor/schedule                     templates + blocks + session settings
PUT  /mentor/schedule

# Application (sessions:write or any authenticated user)
POST /mentor/applications                 submit
GET  /mentor/applications/me             own status

# Admin applications (admin:applications)
GET  /admin/applications                  list (?status=&page=)
GET  /admin/applications/{id}            detail + notes + events
POST /admin/applications/{id}/pick-up
POST /admin/applications/{id}/approve    → creates MentorProfile + patches user scopes
POST /admin/applications/{id}/reject
POST /admin/applications/{id}/notes      add internal note

# Admin mentors (admin:mentors)
GET  /admin/mentors                      list (?status=&q=&page=)
POST /admin/mentors/{id}/suspend
POST /admin/mentors/{id}/reactivate
```

**Deferred:** `request-info`, `schedule-interview`, `GET /mentor/dashboard` stats.

---

## Phase 3: sessions-ms endpoints (MVP)

```
# Mentee (sessions:write / sessions:read / sessions:cancel)
POST /sessions                            create booking
GET  /sessions/{id}
POST /sessions/{id}/cancel
POST /sessions/{id}/review               only if status=completed

# Mentor (sessions:manage)
GET  /mentor/sessions                    list (?status=upcoming|past|cancelled)
POST /sessions/{id}/start               stub — sets started_at, status=live
POST /sessions/{id}/end                 stub — sets ended_at, status=completed

# Mentee "my sessions"
GET  /me/sessions

# Admin (admin:sessions)
GET  /admin/reviews                      flagged reviews
POST /admin/reviews/{id}/hide
POST /admin/reviews/{id}/restore

# Internal — no Traefik auth, internal network only
PATCH /internal/sessions/{id}/mark-paid  sets is_paid=True
```

**Deferred:** `GET /admin/sessions/live`, `GET /admin/sessions/upcoming`, recording logic.

---

## Testing strategy

Coverage minimum: **60%** (MVP). Exception: `webhooks.py` and any file containing status-transition logic must reach **80%** — silent failures in those paths require the most manual cleanup.

### Fixtures (both services)

```python
def make_user(scopes: list[str], user_id: UUID | None = None) -> dict:
    return {
        "X-User-Id": str(user_id or uuid4()),
        "X-Username": "testuser",
        "X-User-Scopes": " ".join(scopes),
    }

# Standard fixtures
anon_app        # no headers → 401
mentor_client   # ["mentor:me", "sessions:manage"]
mentee_client   # ["sessions:read", "sessions:write", "sessions:cancel"]
admin_client    # ["admin:mentors", "admin:applications", "admin:sessions"]
client_factory  # client_factory(make_user(scopes=[...]))
```

Mock the CRUD layer, not the database. Use `unittest.mock.AsyncMock`.

### Per-file coverage targets

| File | Cases |
|---|---|
| `test_mentors.py` | list filters, profile fetch, availability slots, empty states, 401 anon |
| `test_applications.py` | submit, duplicate guard, status transitions, note add, 403 wrong scope |
| `test_mentor_me.py` | profile get/update, schedule get/save, 401/403 |
| `test_admin_mentors.py` | list + search, suspend, reactivate, 403 non-admin |
| `test_sessions.py` | create, get, cancel, status transition guards (409 terminal), mark-paid |
| `test_reviews.py` | submit (happy + not-completed guard), hide, restore |

Every endpoint: happy path + 401 anon + 403 wrong scope + invalid state (409/422).

Run: `pytest --cov=app --cov-fail-under=60` (global floor; webhooks + transitions must individually pass `--cov-fail-under=80`)

---

---

## Phase 4: payments-ms

### Cross-service data dependencies

| Caller | Target | Data needed | Risk |
|---|---|---|---|
| payments-ms | sessions-ms | `price_eur` | Price mismatch if session is updated while payment is pending — read price at PaymentIntent creation time and lock it in `Payment.amount_eur` |
| payments-ms | mentors-ms | `stripe_account_id` | If mentor hasn't finished Stripe onboarding this is `null` — block PaymentIntent creation with 409 and surface a clear error |
| mentors-ms | users-ms | scopes | Essential for the approval flow — users-ms must be reachable; failure rolls back the whole approval |

### Stripe Connect strategy

**Express accounts** — Stripe handles KYC and onboarding entirely via Account Links. Platform controls payout timing and fee split. Mentors get a limited Express Dashboard (balance + payouts only). Destination charges with `application_fee_amount` enforce the fee split at charge time.

**Funds flow:** full charge amount routes to mentor's Express account → `application_fee_amount` transferred back to platform → Stripe fees deducted from platform balance.

**Payout timing:** Stripe automatic payouts on the Express account's default schedule (MVP). Manual batch payouts deferred.

### Service layout

```
adviz-payments-ms/
  app/
    __init__.py
    settings.py       # DB_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET_V1,
                      # STRIPE_WEBHOOK_SECRET_V2, PLATFORM_FEE_RATE,
                      # SESSIONS_MS_URL, MENTORS_MS_URL
    models.py
    schemas.py
    crud.py
    deps.py           # same X-User-* header pattern
    scopes.py         # PaymentScope (unchanged from users-ms)
    logging.py
    routers/
      payments.py     # create PaymentIntent
      connect.py      # Stripe Express onboarding
      webhooks.py     # v1 + v2 webhook handlers
      admin.py        # admin payment listing
      health.py
  migrations/
  tests/
    conftest.py
    factories.py
    test_payments.py
    test_connect.py
    test_webhooks.py
    test_admin.py
  main.py
  pyproject.toml      # adds stripe>=X to dependencies
  Dockerfile
  entrypoint.sh
  .dockerignore
```

### Model

```python
class PaymentStatus(StrEnum):
    PENDING   = "pending"    # PaymentIntent created, awaiting confirmation
    SUCCEEDED = "succeeded"  # payment_intent.succeeded received
    FAILED    = "failed"     # payment_intent.payment_failed received
    REFUNDED  = "refunded"   # deferred

class Payment(AbstractModel):
    id                       = fields.UUIDField(primary_key=True)
    session_id               = fields.UUIDField(unique=True)    # cross-service ref
    mentor_id                = fields.UUIDField()               # denormalized for reporting
    mentee_id                = fields.UUIDField()               # denormalized for reporting
    amount_eur               = fields.DecimalField(max_digits=8, decimal_places=2)
    platform_fee_eur         = fields.DecimalField(max_digits=8, decimal_places=2)
    payout_eur               = fields.DecimalField(max_digits=8, decimal_places=2)
    stripe_payment_intent_id = fields.CharField(max_length=128, unique=True)
    stripe_client_secret     = fields.TextField()               # returned to frontend for Stripe.js
    status                   = fields.CharEnumField(PaymentStatus, default=PaymentStatus.PENDING)
    created_at               = fields.DatetimeField(auto_now_add=True)
    succeeded_at             = fields.DatetimeField(null=True)
    failed_at                = fields.DatetimeField(null=True)

    class Meta:
        table = "payments"
```

`platform_fee_eur` = `amount_eur × PLATFORM_FEE_RATE` (env var, e.g. `0.10`). `payout_eur` = `amount_eur − platform_fee_eur`. Both locked in at creation — historical accuracy if the rate changes.

`Payout` model deferred — Stripe manages payouts to Express accounts automatically.

### Endpoints

```
# Mentee — initiate payment for a session (sessions:write)
POST /payments/sessions/{session_id}
  → reads session from sessions-ms (internal call) to get price_eur + mentor_id
  → reads mentor stripe_account_id from mentors-ms (internal call)
  → reads session from sessions-ms (internal call) to get price_eur + mentor_id
  → reads mentor stripe_account_id from mentors-ms (internal call); return 409 if null (onboarding incomplete)
  → creates Stripe PaymentIntent with:
      amount = price_eur (in cents)
      application_fee_amount = platform_fee_eur (in cents)
      transfer_data[destination] = mentor.stripe_account_id
      metadata = { session_id: <uuid> }   ← required for Stripe Dashboard traceability
  → persists Payment record (status=pending)
  → returns { client_secret } for Stripe.js
  Idempotent: if Payment already exists for session_id, returns existing client_secret with 200

# Mentor — Stripe Connect onboarding (mentor:me)
POST /mentor/stripe/connect
  → creates Express account if stripe_account_id is null on MentorProfile
  → patches mentors-ms PATCH /internal/mentors/{id}/stripe-account
  → generates Account Link URL (type=account_onboarding)
  → returns { onboarding_url }

GET  /mentor/stripe/status
  → fetches Stripe account, checks charges_enabled
  → returns { connected: bool, charges_enabled: bool }

# Stripe webhooks (no Traefik auth — verified via Stripe-Signature)
POST /webhooks/v1
  → Webhook.construct_event(payload, Stripe-Signature, STRIPE_WEBHOOK_SECRET_V1)
  → payment_intent.succeeded:
      marks Payment succeeded, calls PATCH /internal/sessions/{id}/mark-paid on sessions-ms
      idempotent: if Payment is already succeeded, return 200 and skip the sessions-ms call
  → payment_intent.payment_failed:
      marks Payment failed; idempotent if already failed
  → account.updated:
      syncs charges_enabled to MentorProfile via mentors-ms internal call

POST /webhooks/v2
  → client.parse_event_notification(payload, Stripe-Signature, STRIPE_WEBHOOK_SECRET_V2)
  → calls event_notif.fetch_related_object() to hydrate thin event
  → no v2 events handled for MVP — returns 200 (endpoint ready for future)

# Admin (admin:payments)
GET  /admin/payments          list (?status=&page=)
GET  /admin/payments/{id}     detail
```

Both webhook endpoints return 400 on invalid payload or signature before any processing. Both are on public Traefik routes (no JWT middleware) — security is the Stripe signature verification only.

### Inter-service calls payments-ms makes

| Target | Endpoint | Purpose |
|---|---|---|
| sessions-ms | `GET /internal/sessions/{id}` | read price_eur, mentor_id, mentee_id |
| sessions-ms | `PATCH /internal/sessions/{id}/mark-paid` | set is_paid=True on success |
| mentors-ms | `GET /internal/mentors/{user_id}/stripe-account` | read stripe_account_id |
| mentors-ms | `PATCH /internal/mentors/{user_id}/stripe-account` | write stripe_account_id after Express account creation |

### Additional internal endpoints needed

**sessions-ms** adds:
```
GET  /internal/sessions/{id}          read session for payments-ms
```

**mentors-ms** adds:
```
GET  /internal/mentors/{user_id}/stripe-account
PATCH /internal/mentors/{user_id}/stripe-account   body: { stripe_account_id }
```

All `/internal/*` routes are on the `backend` Docker network only — no Traefik label, not reachable externally.

### Testing

```
test_payments.py   create PaymentIntent (happy path, idempotent retry, session not found, mentor no stripe account)
test_connect.py    onboarding URL generation, status check (connected/not connected)
test_webhooks.py   v1 succeeded → mark-paid called, v1 failed, invalid signature → 400, v2 unknown event → 200
test_admin.py      list payments, detail, 403 non-admin
```

Coverage minimum: **60%** overall; `test_webhooks.py` must reach **80%**.

**Webhook race condition (frontend):** The frontend may redirect to a "Success" page before the Stripe webhook has been processed and `is_paid` flipped. The frontend must poll `GET /sessions/{id}` and display a "Payment processing…" state until `is_paid=True` or a timeout is reached — do not assume paid on client-side redirect alone.

---

## Logging

All four backend services (users-ms, mentors-ms, sessions-ms, payments-ms) use **loguru** via `app/logging.py` + `setup_logging()` called in `main.py`. `LOG_LEVEL` env var controls verbosity (default `INFO`; set `DEBUG` locally).

Minimum log points per service:

| Event | Level |
|---|---|
| Service startup (host, port, DB_URL masked) | `INFO` |
| Every request/response (method, path, status, latency) | `INFO` |
| Scope check failure (user_id, missing scopes) | `WARNING` |
| Status transition (entity id, old → new) | `INFO` |
| Transition guard rejection (entity id, attempted transition, reason) | `WARNING` |
| Inter-service call (target, endpoint, status code) | `DEBUG` |
| Inter-service call failure | `ERROR` |
| Stripe webhook received (event type, payment intent id) | `INFO` |
| Stripe signature verification failure | `ERROR` |
| Idempotent duplicate detected (entity id, idempotency key) | `DEBUG` |
| Unhandled exception (full traceback) | `ERROR` |

---

## Deferred (post-MVP)

- Application actions: `request-info`, `schedule-interview`
- Mentor dashboard stats endpoint
- Admin live session monitoring (`/admin/sessions/live`, `/admin/sessions/upcoming`)
- Google Calendar integration
- Recording URL logic
- Stripe manual payout batching + `Payout` model
- Reviews system enhancements
- Stripe v2 webhook event handlers
