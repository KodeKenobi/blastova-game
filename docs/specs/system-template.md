# System Spec Template

## Name

System name.

## Purpose

One-paragraph description of the problem this system solves.

## Inputs

- Events consumed
- State read
- Config required

## Outputs

- Events emitted
- State mutations
- Visual/audio hooks

## Public API

- `initialize(config)`
- `update(dt)`
- `dispose()`

Add system-specific methods as needed.

## Data Model

Define minimum data shape, defaults, and constraints.

## Failure Modes

- Invalid input behavior
- Recovery strategy
- Logging/telemetry expectations

## Acceptance Criteria

- Functional checks
- Determinism checks
- Performance checks

## Test Scenarios

1. Happy path
2. Edge case
3. Failure case

## Open Questions

List unresolved design decisions before implementation.