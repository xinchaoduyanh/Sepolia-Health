# Phase 05: Governance, RAG Readiness, and Voice Extension Points

## Objective

- Add the controls and extension points needed for long-term AI ownership without overbuilding V1.

## Preconditions

- Scheduling flow is working through `AI/`.

## Tasks

1. Implement governance controls
   - persona and xưng hô policy
   - sensitive-topic refusal policy
   - PHI minimization rules
   - audit logging for prompts, responses, tool actions, and policy outcomes
2. Add prompt and model registry basics
   - version prompts by use case
   - record which model version handled each session turn
3. Prepare RAG readiness
   - separate knowledge retrieval pipeline from patient data
   - define source types:
     - clinic info
     - service catalog
     - FAQ
     - policy / SOP
   - do not mix RAG index with raw clinical PHI in V1
4. Prepare self-host path
   - add `vLLM` adapter contract
   - define workloads suitable for self-host first:
     - intent classification
     - response summarization
     - lower-complexity slot-filling
5. Define voice/STT extension points
   - keep STT/TTS as optional peripheral services
   - expose transcript input path into the same session runtime
   - do not make LLM responsible for speech recognition itself
   - allow future addition of:
     - speech-to-text service
     - text-to-speech renderer
     - voice activity / call transcription pipeline
6. Define operational readiness
   - dashboards for latency, costs, provider failure rate, unsafe-response blocks
   - benchmark transcript set for offline evaluation

## Verification

- Commands:
  - policy tests for blocked content and persona enforcement
  - prompt snapshot tests
  - retrieval contract tests for future RAG adapters
  - config tests for provider routing and self-host readiness
- Expected results:
  - unsafe or out-of-scope replies are blocked or rewritten deterministically
  - prompt and model versions are auditable
  - voice/STT can be added later without redesigning the session runtime

## Exit Criteria

- Governance controls are enforceable outside the model itself.
- The system is ready for future RAG without leaking PHI into the wrong store.
- Voice/STT is correctly modeled as an extension, not a core LLM dependency.
- The platform is ready for staged migration toward self-hosted inference.

