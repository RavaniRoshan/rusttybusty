# Agent Guidelines for Immutable DOM Project

**Status:** Planning phase — code not yet implemented  
**Source of Truth:** `IMMUTABLE_DOM_DEVELOPMENT_PLAN.md` (not README)  
**Project Owner:** Roshan Ravani

---

## Critical Understanding

- This is a **single-crate Rust library** (`immutable-dom`), not a monorepo
- The `IMMUTABLE_DOM_DEVELOPMENT_PLAN.md` is the authoritative design document (1000+ lines). README is secondary.
- Current state: Phase 1 ready but **no code exists yet**. Your first task is implementation, not modification.
- All code goes in `src/lib.rs` (no separate modules initially). Keep it in one file until Phase 1 is complete.

---

## Exact Commands

```bash
# Setup (when starting Phase 1)
cargo new immutable-dom
cd immutable-dom
# Add dependencies to Cargo.toml: im = "15.1", criterion = "0.5"

# Build
cargo build
cargo build --release

# Test
cargo test
cargo test test_immutable_dom_proof -- --nocapture

# Watch mode (optional)
cargo install cargo-watch
cargo watch -x test
```

---

## Architecture Non-Negotiables

1. **Node structure MUST use `Arc<Node<T>>` with `im::Vector` and `im::HashMap`**
   - Do NOT use `Rc` (phase 2 needs thread safety)
   - Do NOT use `Vec`/`HashMap` (no structural sharing)
   - Children type: `im::Vector<Arc<Node<T>>>`
   - Attributes type: `im::HashMap<String, String>`

2. **Immutability invariant**: Once a `Node` is created, never mutate it in place. `mutate()` must return a new `Arc<Node>`.

3. **Structural sharing proof**: Tests must use `Arc::ptr_eq()` to verify identity, not `==`.

4. **Type alias**: `pub type DomNode = Arc<Node<String>>` (concrete type uses `String` for content).

---

## Testing Conventions

- Test names from the plan are **prescriptive**: `test_mutation_returns_new_arc`, `test_untouched_siblings_are_shared`, `test_mutated_path_is_new`, `test_immutable_dom_proof`.
- The `test_immutable_dom_proof` test is the **Phase 1 completion criterion**. It must prove:
  - Old root unchanged after mutation
  - New root contains mutation
  - Sibling nodes shared via `Arc::ptr_eq`
- Run all tests before marking Phase 1 complete: `cargo test` must pass with zero failures.

---

## Phase 1 Execution Order

Follow the **PHASE_1_PROMPT_PACK.md** prompts sequentially (if/when created). If not created, follow the prompts section in `IMMUTABLE_DOM_DEVELOPMENT_PLAN.md` PART 4, pages 464–586.

Order:
1. Project setup (Cargo.toml, src/lib.rs skeleton)
2. Node<T> struct + methods (new, with_child, with_attr, with_content)
3. TreeBuilder fluent API
4. `mutate()` function with recursive helper
5. `test_immutable_dom_proof` integration test

Do NOT skip to later phases. Do NOT optimize prematurely.

---

## Verification Checklist

Before declaring Phase 1 complete, run the **PHASE_1_DOCTOR_PROMPT.md** (from the plan, PART 5, pages 590–628). Must answer all questions **without looking at code**.

Key verifiable facts:
- `cargo build --release` succeeds with zero warnings
- `cargo test` passes all tests
- You can trace through `mutate()` on paper and identify which nodes are cloned vs shared
- You can explain why `Mutex` is not needed for readers (Arc<Node> is Sync + Send)

---

## Important Constraints

- **Lines of code target**: 550–700 lines for entire Phase 1. Keep it minimal.
- **No external DOM crates**: Build from scratch using only `im` and std.
- **No complexity**: Do not implement rendering, threading, or benchmarks until Phase 2/3.
- **Preserve the design**: The three-layer architecture (Node, Tree Builder, Renderer) is fixed. Do not deviate.

---

## What's Missing (But Needed Later)

- `Cargo.toml` (create with package name `immutable-dom`, edition 2021)
- `src/lib.rs` (entire implementation)
- `PHASE_1_PROMPT_PACK.md` and `PHASE_1_DOCTOR_PROMPT.md` (extracted from the master plan)
- `.gitignore` (standard Rust: target/, Cargo.lock)

Create these when starting implementation.Anchor to the development plan, not to generic Rust patterns.

---

## When Stuck

1. Reread the corresponding section in `IMMUTABLE_DOM_DEVELOPMENT_PLAN.md` (it contains exact code skeletons)
2. Check the Failure Modes table in the plan (APPENDIX C, lines 991–999)
3. If the question is about *why* something is designed this way, see PART 1 (System Architecture)
4. If the question is about *how* to write it, see PART 4 (Phase 1 Detailed Execution) or the SOURCE CODE TRUTH FILE (lines 638–970)

---

**Last Updated:** 2025-04-25 (from plan analysis)
