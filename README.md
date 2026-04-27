# Immutable Shared-State DOM in Rust
## A Proof-of-Concept Lock-Free Browser DOM

> **Status:** Phase 1 Ready  
> **Ownership:** Roshan Ravani  
> **Target Completion:** 18 weeks (5 phases)  
> **Scope:** 550–700 lines of Rust (proof of concept, not full engine)

---

## Quick Start

```bash
# Clone and setup
git clone <repo>
cd immutable-dom

# Run all tests
cargo test

# Run the core proof-of-concept test
cargo test test_immutable_dom_proof -- --nocapture

# Watch mode (requires `cargo install cargo-watch`)
cargo watch -x test
```

If all tests pass, you're good. Start with **Phase 1 execution** (see below).

---

## What Is This?

A **lock-free DOM** using immutable persistent data structures. Every mutation creates a *new* tree version that **shares 90%+ of nodes** with the old version via `Arc`. Multiple threads can read different tree versions simultaneously **without any locks or synchronization**.

### Core Innovation

```
Traditional DOM (Browser)
━━━━━━━━━━━━━━━━━━━━━━━━━━
JavaScript mutates → Lock tree → Layout reads (blocked) → Paint reads (blocked)
Result: Single-threaded renderer, high jank

Immutable DOM (This Project)
━━━━━━━━━━━━━━━━━━━━━━━━━━
JavaScript mutates → New root created (atomic swap) → Layout reads old version (no lock)
                                                   → Paint reads old version (no lock)
                                                   → Next frame: readers switch to new root
Result: Fully parallel, zero locks, no jank
```

---

## Architecture in One Sentence

**Node<T> wrapped in Arc + persistent Im vectors = structure sharing.  
Mutation on path only, siblings shared, readers never block.**

---

## File Structure

```
immutable-dom/
├── Cargo.toml                           — Project manifest + dependencies
├── src/
│   └── lib.rs                          — All code (Phase 1: 300 lines)
├── README.md                           — This file
│
├── IMMUTABLE_DOM_DEVELOPMENT_PLAN.md   — Master plan (5 phases, timelines, system design)
├── PHASE_1_PROMPT_PACK.md              — 5 sequential prompts (execute NOW)
├── PHASE_1_DOCTOR_PROMPT.md            — Verification checklist (run after prompts complete)
│
├── benches/                            — Benchmarks (Phase 4)
│   └── mutation_benches.rs
│
└── .gitignore
```

### Key Documents

| Document | Purpose | Read When |
|----------|---------|-----------|
| `IMMUTABLE_DOM_DEVELOPMENT_PLAN.md` | Full system design, all 5 phases, architecture | NOW (overview) |
| `PHASE_1_PROMPT_PACK.md` | 5 sequential execution prompts | START HERE (execution) |
| `PHASE_1_DOCTOR_PROMPT.md` | Learning verification checklist | After Prompt 5 |

---

## The 5 Phases

### Phase 1: Core DOM Structure (2–3 weeks)
**Goal:** Working mutations with structural sharing proof  
**Learning:** Arc, ownership, lifetimes, persistent data structures  
**Deliverable:** `cargo test test_immutable_dom_proof` passes

- Build Node<T> with Arc + ImVector
- Implement mutate() function
- TreeBuilder API
- Unit tests proving structural sharing
- Doctor prompt verification

**START WITH PHASE_1_PROMPT_PACK.md**

### Phase 2: Thread Safety (1–2 weeks)
**Goal:** Concurrent readers on same snapshot  
**Learning:** Sync/Send bounds, Arc semantics, thread spawning  
**Deliverable:** 4 threads reading different tree versions simultaneously

- Reader trait
- Concurrent reader tests
- Atomic root swap (Mutex<Arc>)
- Verify Sync + Send bounds
- Thread-safety proof

### Phase 3: Renderer & Display List (1 week)
**Goal:** Convert tree to flat display list  
**Learning:** Trait objects, recursive traversal, visitor pattern  
**Deliverable:** Flat vector renderer + HTML serializer

- Display list struct
- Layout calculator (DFS traversal)
- HTML output serializer
- Integration tests

### Phase 4: Benchmarks & Analysis (1 week)
**Goal:** Quantify structural sharing benefit  
**Learning:** Criterion.rs, memory profiling, performance thinking  
**Deliverable:** Graphs showing mutation cost vs. full clone

- Criterion benchmarks
- Memory report (% nodes copied vs. shared)
- Comparison table
- Performance analysis

### Phase 5: Docs & Blog Post (1–2 weeks)
**Goal:** Public communication of the system  
**Learning:** Technical writing for developers  
**Deliverable:** Published article + polished README

- README rewrite
- Blog post: "Lock-Free DOM: Why Immutability Matters"
- Architecture video script
- GitHub documentation

---

## Learning Objectives by Phase

| Phase | Rust Concepts | Browser/Systems Knowledge |
|-------|--------------|-------------------------|
| 1 | Arc, ownership, Clone, lifetimes, generic bounds | DOM mutations, structural sharing |
| 2 | Sync/Send, thread::spawn, Mutex, concurrent reads | Thread safety without locks |
| 3 | Trait objects, recursion, visitors | Layout algorithm basics, rendering |
| 4 | Criterion, perf analysis, profiling tools | Memory models, benchmarking |
| 5 | — | Technical writing, communication |

---

## Success Criteria

### Phase 1 Complete When:
- ✅ `cargo test` passes all tests
- ✅ `cargo build --release` has zero warnings
- ✅ test_immutable_dom_proof shows correct Arc pointers
- ✅ Doctor prompt answered without looking at code
- ✅ Can explain Arc + structural sharing in 2 minutes

### Project Complete When:
- ✅ All 5 phases pass their doctor prompts
- ✅ Blog post published
- ✅ GitHub repo is public + polished
- ✅ You can pitch the system to a tech audience in 5 minutes

---

## How to Execute Phase 1 (RIGHT NOW)

### Step 1: Read the Master Plan
Read `IMMUTABLE_DOM_DEVELOPMENT_PLAN.md` **PART 1** (System Architecture).
This gives you the conceptual foundation. ~20 min read.

### Step 2: Execute Prompt Pack
Follow `PHASE_1_PROMPT_PACK.md` sequentially:
- Prompt 1: Verify setup
- Prompt 2: Understand Node structure
- Prompt 3: Understand mutation function
- Prompt 4: Test TreeBuilder
- Prompt 5: The big proof test

Allocate 1–2 hours per prompt. Do them over 2–3 weeks.

### Step 3: Run Doctor Prompt
When all Prompts pass, run `PHASE_1_DOCTOR_PROMPT.md`.
Answer all 20+ questions. If you can answer without code, you're done.

### Step 4: Move to Phase 2
Once Phase 1 doctor passes:
- Commit: `git commit -m "Phase 1: Immutable DOM structure"`
- Tag: `git tag v0.1.0-phase1`
- We'll create PHASE_2_PROMPT_PACK.md

---

## Key Concepts Explained Simply

### Arc (Atomic Reference Counting)
Think of it as a shared pointer. Multiple owners can hold an Arc to the same data. When the last owner drops it, the data is freed. No garbage collector, no manual memory management.

```rust
let root = Arc::new(Node { /* ... */ });
let clone1 = Arc::clone(&root);  // Same data, new Arc wrapper
let clone2 = Arc::clone(&root);  // Same data, another Arc wrapper
// All three point to the same Node allocation
```

### Structural Sharing
When you mutate a tree, don't copy the whole thing. Only copy the path from root to the changed node. Siblings stay as Arc references to the old version.

```
Before mutation:    After mutation to child[0]:
root                root'
├─ child[0]         ├─ child[0]'   (NEW)
├─ child[1]    →    ├─ child[1]    (SAME Arc)
└─ child[2]         └─ child[2]    (SAME Arc)
```

### Immutability
Once a Node is created, it never changes. Mutations always create a new Node. This is why Arc is safe without locks — immutable data is automatically thread-safe.

### ImVector / ImHashMap
Persistent data structures that support efficient structural sharing. When you modify a persistent vector, the new vector shares most of its elements with the old one.

---

## Dependencies

- **im** (15.1): Persistent vectors and maps for structural sharing
- **criterion** (0.5): Benchmarking framework (Phase 4)

No external DOM libraries. This is from scratch.

---

## Compilation & Testing

```bash
# Build (dev)
cargo build

# Build (optimized)
cargo build --release

# Test all
cargo test

# Test specific
cargo test test_immutable_dom_proof

# Test with output
cargo test test_immutable_dom_proof -- --nocapture

# Continuous testing
cargo watch -x test
```

---

## FAQ

**Q: Why build this in Rust?**
A: Rust forces you to think about ownership and memory layout. You can't hide from Arc semantics. This project teaches you Rust's hardest concepts by building something real.

**Q: Why only 550 lines?**
A: Proof of concept. We prove the architecture works, not build a full engine. Adding full CSS, layout algorithms, and event handling would be 50k+ lines.

**Q: Why not use Rc instead of Arc?**
A: Rc is single-threaded. Phase 2 requires multiple threads, so we need Arc (atomic).

**Q: Can I use this in production?**
A: No. This is educational. Real browsers need much more (CSS parsing, event handling, memory limits, etc.).

**Q: How long will Phase 1 take?**
A: 2–3 weeks if you're new to Rust. 1 week if you know Arc already.

**Q: What if I get stuck?**
A: The doctor prompt tells you which concepts are weak. Go back to that section. Reread the code comments. Build a tiny example. Iterate.

---

## Next Steps

### NOW:
1. Read `IMMUTABLE_DOM_DEVELOPMENT_PLAN.md` PART 1 (20 min)
2. Start `PHASE_1_PROMPT_PACK.md` Prompt 1

### After Phase 1 (2–3 weeks):
1. Run `PHASE_1_DOCTOR_PROMPT.md`
2. Commit & tag
3. Start Phase 2 (we'll provide prompts)

### Long-term (18 weeks):
- Finish all 5 phases
- Publish blog post
- Open-source the repo

---

## Resources

**Learning:**
- Rust Book (Smart Pointers chapter): https://doc.rust-lang.org/book/ch15-00-smart-pointers.html
- im crate docs: https://docs.rs/im/latest/im/

**Inspiration:**
- Servo browser (parallel layout): https://github.com/servo/servo
- React virtual DOM (structural sharing philosophy): https://react.dev/
- Xi editor (immutable rope in Rust): https://github.com/xi-editor/xi-core

---

## How This Connects to OpenJCK

Your OpenJCK observability traces need thread-safe, immutable representations too. Building an immutable trace tree is next. This DOM project teaches you the patterns.

---

## License

MIT

---

## Contact & Feedback

Built by Roshan Ravani. Questions? Stuck?

- Check `PHASE_1_DOCTOR_PROMPT.md` for common issues
- Reread PART 1 of the development plan
- Iterate with Claude until it clicks

---

**Ready?** Start with `PHASE_1_PROMPT_PACK.md` Prompt 1.

Good luck. You're building something no mainstream browser has.
