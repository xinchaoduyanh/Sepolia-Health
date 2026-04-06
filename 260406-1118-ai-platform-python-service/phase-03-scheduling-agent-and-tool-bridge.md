# Phase 03: Scheduling Agent and Tool Bridge

## Objective

- Implement `SchedulingAgent` and the first production tool workflow for booking assistance.

## Preconditions

- Phase 02 runtime is working.
- Tool bridge contract to `Be/` is available or stubbed.

## Tasks

1. Implement agent state machine
   - states:
     - `idle`
     - `collecting_requirements`
     - `candidate_selection`
     - `slot_selection`
     - `draft_ready`
     - `awaiting_confirmation`
     - `booked`
     - `handoff_or_failed`
2. Implement decision loop
   - user message -> state load -> agent decision -> optional tool call -> state update -> response.
3. Implement typed tool registry
   - tools return structured JSON only
   - add schema validation on every tool result
4. Implement booking support tools
   - `searchClinics`
   - `searchServices`
   - `searchDoctors`
   - `findAvailableDoctors`
   - `getDoctorAvailability`
   - `resolveDoctorService`
   - `resolvePatientProfile`
   - `createBookingDraft`
   - `confirmBooking`
   - `getMyUpcomingAppointments`
5. Implement booking draft protocol
   - `createBookingDraft` does not mutate final appointments
   - revalidate availability and ownership before returning draft
   - produce recap text and structured summary for UI confirmation card
6. Implement confirmation-only mutation
   - `confirmBooking` is the sole path to call final appointment creation
   - add idempotency handling to prevent duplicate booking on repeated confirms
7. Implement guardrails around tool usage
   - no direct mutation without explicit user confirmation
   - no medical diagnosis beyond scope
   - no exposure of full PHI in prompt or tool output unless later approved

## Verification

- Commands:
  - agent state transition tests
  - tool contract tests against backend stubs
  - booking draft unit tests
  - integration tests for booking happy path and unhappy paths
- Expected results:
  - the agent can move from vague request to confirmed booking without free-form unsafe mutation
  - every tool output is machine-validated
  - conflicting slot on confirm returns safe recovery message and updated state

## Exit Criteria

- `SchedulingAgent` handles the full V1 booking workflow.
- Confirmation is mandatory for booking mutation.
- The agent never parses prose from tools.
- State and tool traces are sufficient to debug failures.

