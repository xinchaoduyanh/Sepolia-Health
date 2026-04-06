# Phase 04: Backend Integration and Compatibility

## Objective

- Nối `Be/` với `AI/` mà không phá UX chat hiện tại, đồng thời tạo đường rút dần khỏi module chatbot cũ.

## Preconditions

- `AI/` service and `SchedulingAgent` are available.

## Tasks

1. Add backend AI client
   - create internal HTTP client in `Be/` for session creation, message send, confirm, cancel, and session fetch.
2. Add backend-facing endpoints for clients
   - expose public `Be/` endpoints that proxy to `AI/`
   - keep auth, role checks, and business ownership in `Be/`
3. Add internal tool bridge endpoints
   - create internal-only endpoints or service adapters used by `AI/`
   - reuse existing appointment and doctor-schedule services instead of duplicating logic
4. Preserve temporary compatibility
   - maintain current chat entrypoints as wrappers while mobile/web migrate
   - mark DigitalOcean-specific code paths as deprecated
5. Update chat payload semantics
   - backend returns:
     - `message`
     - `sessionState`
     - `proposedAction`
     - `requiresConfirmation`
     - `toolResultsSummary`
     - `traceId`
6. Plan frontend follow-up hooks
   - mobile/web must render confirmation UI from structured payload
   - clients should stop relying on AI free-text for mutation intent
7. Prepare deployment topology
   - add `AI/` service to compose/pm2/deployment diagrams
   - secure internal traffic between `Be/` and `AI/`

## Verification

- Commands:
  - backend integration tests with mocked `AI/`
  - end-to-end chat flow in local environment with `Be + AI`
  - compatibility checks for legacy chatbot entrypoint
- Expected results:
  - clients can continue chatting through `Be/`
  - booking confirmations still land in the existing appointment domain service
  - DigitalOcean config is no longer required for the new path

## Exit Criteria

- `Be/` can operate with `AI/` as the AI runtime.
- Legacy chatbot path is optional compatibility only.
- No client needs direct network access to `AI/`.
- Deployment artifacts include `AI/` as a first-class service.

