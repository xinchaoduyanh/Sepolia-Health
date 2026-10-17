# Tool contract table (Phase 3)

DATA-only tools. Errors use stable `error_code` strings. Side effects only on draft/confirm/cancel.

| Tool | Input (key fields) | Output | Ownership | Side effect | Idempotency |
|------|--------------------|--------|-----------|-------------|-------------|
| `search_clinics` | `q?`, `location?` | clinics[] | public | none | n/a |
| `search_services` | `q`, `clinic_id?` | services[] (filtered by clinic doctors if clinic_id) | public | none | n/a |
| `search_doctors` | `q?`, `service_id?`, `clinic_id?` | doctors[] | public | none | n/a |
| `get_clinic_detail` | `clinic_id` | clinic + services | public | none | n/a |
| `get_doctor_detail` | `doctor_id` | doctor | public | none | n/a |
| `get_doctor_availability` | `doctor_id`, `date`, `service_id?` | slots | public | none | n/a |
| `find_available_doctors` | `date`, `service_id?`, `time_preference?`, `clinic_id?` | doctors+slots | public | none | n/a |
| `search_knowledge` | `query`, `types[]` | chunks[] / empty note | public | none | n/a |
| `resolve_patient_profile` | acting user | profile | acting user | none | n/a |
| `create_booking_draft` | profile, doctor, service, start_time | draft_id + recap_data / error_code | profile manager = acting | creates/refreshes draft | key = hash(session, profile, doctor, **service**, start_time); recap always matches draft row |
| `confirm_booking` | draft_id | appointment_id / error_code | draft owner | appt+billing | draft re-confirm |
| `get_my_upcoming_appointments` | acting user | appointments[] | acting | none | n/a |
| `get_patient_history` | acting user | history (redacted clinically in AI loop) | acting | none | n/a |
| `request_cancel_booking` | appointment_id | pending_confirmation | acting | none | n/a |
| `cancel_appointment` | appointment_id | success / error_code | acting | cancel + notify | concurrent-safe |

## Stable error codes (booking)

| Code | Meaning |
|------|---------|
| `patient_profile_required` | missing profile id |
| `patient_profile_not_found` | id does not exist |
| `patient_profile_forbidden` | exists but not owned |
| `service_not_found` | invalid service |
| `doctor_not_found` | invalid/deleted doctor |
| `doctor_service_mismatch` | doctor does not offer service |
| `invalid_start_time` | unparseable time |
| `slot_in_past` | start <= now |
| `doctor_off` | day off / no availability |
| `slot_outside_working_hours` | not in working window |
| `slot_taken` | conflict / race |
| `draft_not_found` | bad draft id |
| `draft_expired` | TTL exceeded |
| `bridge_internal_error` | confirm/bridge lỗi hạ tầng (DB/billing/schema); HTTP 503 — **không** giả slot_taken |
| `confirm_failed` | (legacy alias, ưu tiên bridge_internal_error) |
| `appointment_not_found` | cancel target missing |
| `cannot_cancel_near_time` | < 4h rule |
| `appointment_not_cancellable` | wrong status |
| `bridge_unavailable` | circuit open |
| `retriever_not_available` | RAG down |
| `retrieval_failed` | embed/query error |
| `service_type_mismatch` | service does not support AI's offline-only booking scope |
| `clinic_not_available` | doctor has no active clinic for offline booking |
| `patient_gender_mismatch` | service gender restriction does not match patient |
| `patient_age_mismatch` | service age restriction does not match patient |
| `idempotency_conflict` | confirm key differs from the key already bound to the draft |
