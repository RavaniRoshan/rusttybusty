# Immutable Shared-State DOM in Rust
## Master Development Plan & Source of Truth

**Project Owner:** Roshan Ravani  
**Status:** Phase 1 — Foundation Architecture  
**Target Delivery:** 12–18 weeks (4–5 phases)  
**Rust Scope:** 550–700 lines (proof of concept, not full engine)  

---

## PART 1: SYSTEM ARCHITECTURE PLAN

### System Overview (One Sentence)
A lock-free, thread-safe DOM implementation using Arc-backed persistent data structures, where mutations produce new tree versions sharing 90% of nodes with the old version, enabling concurrent readers without any synchronisation.

### Core Architectural Principles

```
IMMUTABILITY RULE
━━━━━━━━━━━━━━━
Every mutation produces a NEW tree root.
Old tree remains valid and unchanged.
Readers never block. Writers never lock.
```

### Three-Layer Design

```
┌─────────────────────────────────────────────────┐
│ LAYER 1: Node Structure (Immutable)             │
│ ─────────────────────────────────────────────   │
│ Arc<Node<T>> + im::Vector<Arc<Node>> children  │
│ im::HashMap<String, String> attributes         │
│ Reference-counted, structurally shared         │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ LAYER 2: Tree Builder (Mutation API)            │
│ ─────────────────────────────────────────────   │
│ fn mutate(root: Arc<Node>, path, change)       │
│ → Arc<Node> (new root)                         │
│ Structural sharing: only path copied            │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ LAYER 3: Renderer (Concurrent Reader)           │
│ ─────────────────────────────────────────────   │
│ trait Visitor<T> { traverse(node) }            │
│ Snapshot-based: locked to one tree version     │
│ No locks needed inside traversal                │
└─────────────────────────────────────────────────┘
```

### Data Flow

```
JavaScript Thread          Layout Worker         Paint Worker
      │                         │                    │
      ├─ mutate(root) ──────────┼────────────────────┤
      │                         │                    │
      └─ new root created       │                    │
           │                    │                    │
           └──► Arc swap (atomic pointer)            │
                 │                                   │
                 ├─► old_root still valid ◄──────────┤ (reader holds Arc)
                 │   for old readers                 │
                 │                                   │
                 └─► new_root visible ──────────────►│ (new readers)
                     to new readers
```

### Memory Model: Structural Sharing Example

```
BEFORE MUTATION:
┌─ root
├─ [Arc] elem_1 (content: "Hello")
├─ [Arc] elem_2 (content: "World")
└─ [Arc] elem_3 (content: "Rust")

MUTATION: Change elem_2 to "Immutable"
└─ new_root
   ├─ [Arc] elem_1 ◄─────── SAME as before (shared)
   ├─ [NEW Arc] elem_2_v2   NEW node (elem_2 replaced)
   └─ [Arc] elem_3 ◄─────── SAME as before (shared)

MEMORY SAVED: 2/3 of tree shared. Only path from root to elem_2 copied.
For a 10,000-node tree with one leaf mutation: ~30 nodes copied, 9,970 shared.
```

### Thread Safety Invariants

| Thread | Holds | Can Do | Cannot Do |
|--------|-------|--------|-----------|
| **JS** | `Arc<Node>` (mutable) | Call `mutate()` → swap root | Read across versions |
| **Layout** | `Arc<Node>` (immutable snapshot) | Traverse tree, never blocks | Mutate tree |
| **Paint** | `Arc<Node>` (same snapshot) | Traverse tree in parallel | Mutate tree |
| **Compositor** | `Arc<Node>` (stale ok) | Read, display | Mutate tree |

**The Magic:** All threads can hold `Arc` to *different* versions of the tree *simultaneously* because `Arc` is `Sync` and immutable. No locks needed.

---

## PART 2: PHASE BREAKDOWN & PRIORITY

### Master Phase Timeline

| Phase | Focus | Duration | Rust Learning | Deliverable |
|-------|-------|----------|----------------|-------------|
| **1** | Core DOM + Mutations | 2–3 weeks | Arc, ownership, lifetimes | Working tree mutator |
| **2** | Thread Safety Proof | 1–2 weeks | Concurrency, Sync/Send | 4-thread concurrent reader test |
| **3** | Display List Generator | 1 week | Trait objects, visitors | Flat vector renderer |
| **4** | Benchmarks + Profiling | 1 week | Criterion, perf analysis | Memory & CPU graphs |
| **5** | Docs + Blog Post | 1–2 weeks | Technical writing | Published article |

---

## PART 3: DETAILED PHASE BREAKDOWN

### PHASE 1: Core DOM Structure & Mutation Engine
**Duration:** 2–3 weeks  
**Goal:** Build a working DOM with immutable mutations  
**Learning Focus:** Arc, structural sharing, Rust's ownership model

#### 1.1 — Setup & Project Structure
**Output:** Cargo.toml, lib.rs skeleton, initial tests

```toml
[package]
name = "immutable-dom"
version = "0.1.0"
edition = "2021"

[dependencies]
im = "15.1"        # Persistent data structures
criterion = "0.5"  # Benchmarking

[lib]
```

#### 1.2 — Node Data Structure
**Output:** `struct Node<T>`, `Arc` wrapper, attributes model

Core requirements:
- Node must store: `id`, `tag`, `children: im::Vector<Arc<Node<T>>>`, `attrs: im::HashMap`
- Must be generic over content type `T`
- Must implement `Debug`, `Clone`
- Children are `Arc`-wrapped to enable sharing

```rust
pub struct Node<T> {
    pub id: usize,
    pub tag: String,
    pub children: im::Vector<Arc<Node<T>>>,
    pub attrs: im::HashMap<String, String>,
    pub content: Option<T>,
}

pub type DomNode = Arc<Node<String>>;
```

#### 1.3 — Mutation Function
**Output:** `fn mutate()` that takes root + path + change, returns new root

Core logic:
- Path is a `Vec<usize>` (child indices)
- Returns new root with *only* the path nodes copied
- Prove structural sharing with reference equality checks

```rust
pub fn mutate(
    root: Arc<Node<String>>,
    path: &[usize],
    change: impl FnOnce(&mut Node<String>),
) -> Arc<Node<String>> {
    // TODO: Implement recursive clone-only-on-path
}
```

#### 1.4 — Builder API
**Output:** Fluent interface to construct trees without `mutate()`

```rust
pub struct TreeBuilder { /* ... */ }
impl TreeBuilder {
    pub fn new(tag: &str) -> Self { /* ... */ }
    pub fn child(self, child: Arc<Node<String>>) -> Self { /* ... */ }
    pub fn attr(self, k: String, v: String) -> Self { /* ... */ }
    pub fn build(self) -> Arc<Node<String>> { /* ... */ }
}
```

#### 1.5 — Unit Tests
**Output:** Tests for mutation, builder, structural sharing verification

```rust
#[test]
fn test_mutation_creates_new_root() { /* ... */ }

#[test]
fn test_structural_sharing_siblings() { /* ... */ }

#[test]
fn test_mutation_preserves_untouched_nodes() { /* ... */ }
```

### PHASE 2: Thread-Safety & Concurrency Proof
**Duration:** 1–2 weeks  
**Goal:** Demonstrate lock-free concurrent reads  
**Learning Focus:** `Sync`/`Send`, Arc semantics, thread spawning

#### 2.1 — Snapshot Reader Trait
**Output:** `trait Reader` for concurrent tree traversal

```rust
pub trait Reader {
    fn visit(&self, node: &Arc<Node<String>>);
}

pub struct CountVisitor { count: usize }
pub struct SerializeVisitor { output: String }
```

#### 2.2 — Concurrent Reader Test
**Output:** 4 threads holding same `Arc`, traversing without locks

```rust
#[test]
fn test_concurrent_readers_no_locks() {
    let root = TreeBuilder::new("div").build();
    let arc = Arc::new(root);
    
    let handles: Vec<_> = (0..4)
        .map(|_| {
            let arc_clone = Arc::clone(&arc);
            thread::spawn(move || {
                let reader = CountVisitor::new();
                reader.visit(&arc_clone);
            })
        })
        .collect();
    
    for h in handles { h.join().unwrap(); }
}
```

#### 2.3 — Atomic Root Swap
**Output:** Demonstrate mutation during concurrent reads

```rust
pub struct DomRoot {
    current: Arc<Mutex<Arc<Node<String>>>>,
}

impl DomRoot {
    pub fn mutate(&self, change: impl Fn(Arc<Node<String>>) -> Arc<Node<String>>) {
        let mut root = self.current.lock().unwrap();
        *root = change(Arc::clone(&root));
    }
    
    pub fn with_snapshot<F, R>(&self, f: F) -> R
    where F: FnOnce(Arc<Node<String>>) -> R
    {
        let root = Arc::clone(&self.current.lock().unwrap());
        f(root)
    }
}
```

#### 2.4 — Sync/Send Bounds Verification
**Output:** Tests proving `Arc<Node>` is `Sync + Send`

```rust
#[test]
fn test_arc_node_is_sync() {
    fn assert_sync<T: Sync>() {}
    assert_sync::<Arc<Node<String>>>();
}

#[test]
fn test_arc_node_is_send() {
    fn assert_send<T: Send>() {}
    assert_send::<Arc<Node<String>>>();
}
```

### PHASE 3: Renderer & Display List Generator
**Duration:** 1 week  
**Goal:** Build a visitor that produces a flat display list  
**Learning Focus:** Trait objects, recursive traversal, owned vs. borrowed

#### 3.1 — Display List Struct
**Output:** Flat representation of rendered tree

```rust
pub struct DisplayItem {
    pub node_id: usize,
    pub tag: String,
    pub depth: usize,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

pub struct DisplayList(pub Vec<DisplayItem>);
```

#### 3.2 — Layout Calculator
**Output:** Recursive depth-first traversal assigning coordinates

```rust
pub fn layout(root: &Arc<Node<String>>) -> DisplayList {
    let mut items = Vec::new();
    fn walk(
        node: &Arc<Node<String>>,
        depth: usize,
        x: f32,
        y: f32,
        items: &mut Vec<DisplayItem>,
    ) {
        // TODO: Compute width/height based on children count + content
    }
    walk(root, 0, 0.0, 0.0, &mut items);
    DisplayList(items)
}
```

#### 3.3 — Serializer (HTML Output)
**Output:** Convert tree back to HTML string for verification

```rust
pub fn to_html(root: &Arc<Node<String>>) -> String {
    fn walk(node: &Arc<Node<String>>) -> String {
        let attrs_str = node.attrs
            .iter()
            .map(|(k, v)| format!(r#" {}="{}""#, k, v))
            .collect::<String>();
        
        let children_str = node.children
            .iter()
            .map(walk)
            .collect::<String>();
        
        if node.children.is_empty() {
            format!("<{tag}{attrs}>{content}</{tag}>", 
                tag = node.tag,
                attrs = attrs_str,
                content = node.content.as_ref().unwrap_or(&String::new()))
        } else {
            format!("<{tag}{attrs}>{children}</{tag}>",
                tag = node.tag,
                attrs = attrs_str,
                children = children_str)
        }
    }
    walk(root)
}
```

#### 3.4 — Visitor Tests
**Output:** Tests for layout and serialization

```rust
#[test]
fn test_layout_assigns_depths_correctly() { /* ... */ }

#[test]
fn test_serialization_round_trip() { /* ... */ }
```

### PHASE 4: Benchmarking & Memory Analysis
**Duration:** 1 week  
**Goal:** Quantify structural sharing benefit  
**Learning Focus:** Criterion.rs, memory profiling, performance thinking

#### 4.1 — Mutation Benchmark
**Output:** Criterion benchmark comparing mutation time

```rust
#[cfg(test)]
mod benches {
    use criterion::{black_box, criterion_group, criterion_main, Criterion};
    
    fn bench_mutation(c: &mut Criterion) {
        c.bench_function("mutate_leaf_1k_nodes", |b| {
            let root = build_large_tree(1000);
            b.iter(|| mutate(black_box(Arc::clone(&root)), &[0, 1, 2], |n| {
                n.attrs.insert("key".to_string(), "value".to_string());
            }));
        });
    }
}
```

#### 4.2 — Memory Report
**Output:** Document showing how many nodes are copied vs. shared

Script to produce:
```rust
fn memory_report(root: &Arc<Node<String>>, mutations: usize) {
    println!("Tree size: {} nodes", count_nodes(root));
    println!("After {} mutations: {}% nodes shared", 
        mutations, 
        100 - (mutations_copied(root) as f32 / count_nodes(root) as f32 * 100.0)
    );
}
```

#### 4.3 — Comparison Document
**Output:** Table comparing mutation cost vs. naive clone

| Operation | Time (μs) | Memory Copied | Notes |
|-----------|-----------|---------------|-------|
| Full tree clone (1000 nodes) | 250 | 100% (8KB) | Baseline |
| Mutate leaf (1000 nodes) | 15 | 0.3% (24 bytes) | 16× faster |
| Mutate middle (1000 nodes) | 45 | 1.2% (96 bytes) | 5× faster |

### PHASE 5: Documentation & Public Communication
**Duration:** 1–2 weeks  
**Goal:** Write blog post + README explaining the system  
**Learning Focus:** Technical writing for developers

#### 5.1 — README.md
**Output:** Project README with architecture, benchmarks, usage example

Structure:
- What problem does this solve?
- How it works (with diagrams)
- Benchmark results
- Code walkthrough (pick one function, explain deeply)
- How to extend it
- Related work

#### 5.2 — Blog Post: "Lock-Free DOM: Why Immutability Matters"
**Output:** Published technical article (LinkedIn, Dev.to, or personal blog)

Structure:
- Hook: "No mainstream browser does this"
- Problem: Why browser rendering is slow
- Solution: Immutable trees + structural sharing
- Technical deep dive: Arc, persistent data structures, thread safety
- Benchmarks: memory usage, mutation latency
- Implications: for OpenJCK trace trees, agent observability

#### 5.3 — Architecture Video Script (Optional)
**Output:** Notes for 10-minute whiteboard explanation

---

## PART 4: PHASE 1 — DETAILED EXECUTION PLAN

### Phase 1 Ambitious Goal (NOT Overambitious)

**By end of Phase 1, you will have:**
1. ✅ A working `Node<T>` structure using Arc and persistent vectors
2. ✅ A `mutate()` function that proves structural sharing (with reference equality tests)
3. ✅ A `TreeBuilder` for constructing test trees without hand-coding Arcs
4. ✅ 10+ unit tests verifying mutation correctness
5. ✅ Clear proof that the old tree version is still valid after mutation

**You will NOT have:** Full rendering, threading, benchmarking, or docs yet. That's intentional.

### Phase 1 Prompt Pack

#### PROMPT 1: Project Setup
**Title:** "Set up Rust project with dependencies"

```
I'm building an immutable-DOM proof of concept in Rust.

Project structure:
- Cargo.toml: add `im = "15.1"` for persistent vectors, `criterion = "0.5"` for later benchmarks
- src/lib.rs: Start with module declarations (nodes, mutator, tests)
- Cargo.lock: checked in

I'll need a clean project structure that:
1. Compiles with zero warnings
2. Has clear module boundaries (mod nodes, mod mutator, mod tests)
3. Has a lib.rs that I can incrementally add to

Set up the project, show me Cargo.toml, create src/lib.rs skeleton with module declarations.
I want to see the bare minimum: no implementation yet, just the structure.
```

#### PROMPT 2: Core Node Structure
**Title:** "Implement immutable Node<T> with Arc and persistent vectors"

```
Now I'm building the core Node structure.

Requirements:
- Generic over content type T
- Fields: id (usize), tag (String), children (im::Vector<Arc<Node<T>>>), attrs (im::HashMap<String, String>), content (Option<T>)
- Implements: Debug, Clone
- Is wrapped in Arc for sharing: pub type DomNode = Arc<Node<String>>

This is the ONLY data structure we need to get right. Everything else flows from this.

Build:
1. struct Node<T> with all fields
2. pub type DomNode = Arc<Node<String>> as the concrete type
3. impl Debug, Clone manually (derive won't work well because Arc isn't always Clone automatically)
4. Add a constructor: pub fn new(id: usize, tag: &str) -> Self
5. Three helper methods:
   - pub fn with_child(mut self, child: Arc<Node<T>>) -> Self
   - pub fn with_attr(mut self, k: String, v: String) -> Self
   - pub fn with_content(mut self, content: T) -> Self

Test it by constructing a 3-node tree by hand in a test.

Show me the complete Node struct + all methods. I want to understand every line.
```

#### PROMPT 3: Structural Sharing Proof
**Title:** "Implement mutation function with reference-equality tests"

```
Now the critical function: mutate().

This function takes:
- root: Arc<Node<String>> (the tree we're mutating)
- path: &[usize] (indices to follow: [0, 1] means "child 0, then child 1")
- change: a closure FnOnce(&mut Node<String>) that modifies the target node

It returns Arc<Node<String>> (the NEW root).

The trick is: ONLY the nodes on the path are cloned. Sibling nodes are SHARED via Arc.

Implementation strategy:
1. If path is empty, modify root in place and wrap in Arc
2. Otherwise:
   a. Get the first index from path
   b. Clone the current node (Arc::make_mut? No. Clone the inner value)
   c. Recursively mutate the child at path[0] with path[1..], get new child Arc
   d. Update the cloned node's children with the new child Arc
   e. Wrap in Arc and return

Then write THREE tests:
1. test_mutation_returns_new_arc() — prove the returned Arc is different from input (!=)
2. test_untouched_siblings_are_shared() — prove siblings are the SAME Arc (Arc::ptr_eq)
3. test_mutated_path_is_new() — prove the mutated node is NOT the same Arc

Show me the mutate() function fully implemented. Then show me the three tests passing.
I want to SEE the structural sharing working.
```

#### PROMPT 4: TreeBuilder API
**Title:** "Build a fluent API for constructing test trees"

```
I don't want to hand-code Arc wrapping in every test. Build TreeBuilder.

TreeBuilder:
- pub struct TreeBuilder { tag: String, attrs: im::HashMap, children: Vec<Arc<Node<String>>>, content: Option<String> }
- pub fn new(tag: &str) -> Self
- pub fn child(mut self, c: Arc<Node<String>>) -> Self — adds a child
- pub fn attr(mut self, k: String, v: String) -> Self — adds an attribute
- pub fn content(mut self, text: String) -> Self — sets content
- pub fn build(self) -> Arc<Node<String>> — wraps in Arc and returns

Test it: build a tree like TreeBuilder::new("div").child(TreeBuilder::new("p").content("Hello".to_string()).build()).attr("id".to_string(), "main".to_string()).build()

Show me TreeBuilder fully implemented, and a test that builds a 3-node tree.
```

#### PROMPT 5: Integration Test
**Title:** "Write a comprehensive test demonstrating the system"

```
Now the proof. Write ONE test called test_immutable_dom_proof() that:

1. Uses TreeBuilder to construct a 5-node tree (a div with 2 children, one of which has 2 children)
2. Saves a reference to the original root
3. Mutates the deepest node (change its content from "Original" to "Mutated")
4. Gets the new root back
5. Verifies:
   a. The new root is a different Arc (!=)
   b. The old root still has "Original" content (unchanged!)
   c. The new root has "Mutated" content
   d. Sibling nodes between old and new are shared (Arc::ptr_eq)

This test is the heart of the system. It proves immutability + structural sharing work.

Show me this test. If it passes, Phase 1 is complete.
```

---

## PART 5: PHASE 1 DOCTOR PROMPT

**This prompt runs AFTER all Phase 1 code is written and tests pass.**

### Doctor Prompt: Verify Phase 1 Completeness

```
I'm the "Phase 1 Doctor". I'm going to verify that everything in Phase 1 is correct.

Answer these questions (yes/no + brief why):

1. STRUCTURE
   - Does Node<T> have all 5 required fields?
   - Is DomNode = Arc<Node<String>> defined?
   - Does the struct compile with zero warnings?

2. OWNERSHIP
   - Can you explain why children are im::Vector<Arc<Node<T>>> and not Vec?
   - Why is mutate() taking Arc by value, not reference?
   - Does Arc::clone() happen at the right places?

3. FUNCTIONAL CORRECTNESS
   - When you mutate a leaf node, are the siblings' Arcs IDENTICAL (ptr_eq)?
   - Run the test and show me the Arc pointers: print them with {:p} format.
   - Can you trace through the mutate() function and explain the path?

4. COMPILATION
   - Does `cargo build --release` succeed?
   - Does `cargo test` pass all tests?
   - Are there any dead code warnings?

5. UNDERSTANDING
   - Without looking at code, can you draw a diagram of what happens when you mutate node [0][1]?
   - Can you explain why we DON'T use Mutex here, even though we're sharing?
   - Why is this better than the traditional browser DOM?

If you can answer all 5 sections without looking at code, Phase 1 is solid.
If not, flag which section and we'll iterate.
```

---

## PART 6: SOURCE CODE TRUTH FILE

See **`lib.rs` skeleton** below.

---

# SOURCE CODE TRUTH FILE: lib.rs
## Immutable DOM — Architectural Skeleton

```rust
//! # Immutable Shared-State DOM
//!
//! A lock-free, concurrent DOM using Arc-backed persistent data structures.
//!
//! ## Core Idea
//! Every mutation produces a NEW tree root. Old tree remains valid.
//! Sibling nodes are SHARED via Arc<Node> — only the path from root to mutation is copied.
//!
//! ## Memory Model
//! - Node<T> is generic
//! - Children are im::Vector<Arc<Node<T>>> (persistent vector for structural sharing)
//! - Attrs are im::HashMap<String, String> (persistent map)
//! - Each Arc points to immutable Node — multiple threads can hold Arc simultaneously
//!
//! ## Thread Safety
//! Arc<Node<T>> is Sync + Send because Node is immutable after creation.
//! No locks needed for reading. Mutation is a single atomic pointer swap (stored in Mutex<Arc>).

use std::sync::Arc;
use im::{HashMap as ImHashMap, Vector as ImVector};

// ============================================================================
// SECTION 1: NODE STRUCTURE
// ============================================================================
//
// The only data structure in the system. Everything else is functions on Node.

/// Immutable DOM node. Generic over content type T.
///
/// # Fields
/// - id: unique identifier (not used for safety, just for debugging)
/// - tag: element name ("div", "p", etc.)
/// - children: persistent vector of child nodes (Arc-wrapped)
/// - attrs: persistent map of attributes
/// - content: optional text content
///
/// # Invariants
/// - Once created, never mutated directly. Create new versions via mutate().
/// - Children are Arc-wrapped to enable sharing across tree versions.
/// - This struct is immutable by design. Interior mutability not needed.
#[derive(Debug, Clone)]
pub struct Node<T> {
    pub id: usize,
    pub tag: String,
    pub children: ImVector<Arc<Node<T>>>,
    pub attrs: ImHashMap<String, String>,
    pub content: Option<T>,
}

impl<T: Clone> Node<T> {
    /// Create a new node with given id and tag.
    ///
    /// # Example
    /// ```ignore
    /// let node = Node::<String>::new(1, "div");
    /// ```
    pub fn new(id: usize, tag: &str) -> Self {
        Node {
            id,
            tag: tag.to_string(),
            children: ImVector::new(),
            attrs: ImHashMap::new(),
            content: None,
        }
    }

    /// Add a child node. Returns self for chaining.
    pub fn with_child(mut self, child: Arc<Node<T>>) -> Self {
        self.children.push_back(child);
        self
    }

    /// Add an attribute. Returns self for chaining.
    pub fn with_attr(mut self, k: String, v: String) -> Self {
        self.attrs.insert(k, v);
        self
    }

    /// Set content. Returns self for chaining.
    pub fn with_content(mut self, content: T) -> Self {
        self.content = Some(content);
        self
    }

    /// Get the number of direct children.
    pub fn child_count(&self) -> usize {
        self.children.len()
    }

    /// Get a child by index.
    pub fn child(&self, idx: usize) -> Option<&Arc<Node<T>>> {
        self.children.get(idx)
    }
}

/// Concrete DOM node for strings (primary use case).
pub type DomNode = Arc<Node<String>>;

// ============================================================================
// SECTION 2: TREE BUILDER
// ============================================================================
//
// Fluent API for constructing test trees without hand-coding Arc wrapping.

/// Fluent builder for constructing Node trees.
///
/// # Example
/// ```ignore
/// let tree = TreeBuilder::new("div")
///     .child(TreeBuilder::new("p").content("Hello").build())
///     .attr("id".to_string(), "root".to_string())
///     .build();
/// ```
pub struct TreeBuilder {
    id_counter: usize,
    tag: String,
    attrs: ImHashMap<String, String>,
    children: Vec<DomNode>,
    content: Option<String>,
}

impl TreeBuilder {
    /// Create a new builder with a tag name.
    pub fn new(tag: &str) -> Self {
        static NEXT_ID: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
        let id = NEXT_ID.fetch_add(1, std::sync::atomic::Ordering::SeqCst);

        TreeBuilder {
            id_counter: id,
            tag: tag.to_string(),
            attrs: ImHashMap::new(),
            children: Vec::new(),
            content: None,
        }
    }

    /// Add a child node.
    pub fn child(mut self, child: DomNode) -> Self {
        self.children.push(child);
        self
    }

    /// Add an attribute.
    pub fn attr(mut self, k: String, v: String) -> Self {
        self.attrs.insert(k, v);
        self
    }

    /// Set text content.
    pub fn content(mut self, text: String) -> Self {
        self.content = Some(text);
        self
    }

    /// Build the tree and wrap in Arc.
    pub fn build(self) -> DomNode {
        let children_arcs = self.children.into_iter().collect::<ImVector<_>>();
        Arc::new(Node {
            id: self.id_counter,
            tag: self.tag,
            children: children_arcs,
            attrs: self.attrs,
            content: self.content,
        })
    }
}

// ============================================================================
// SECTION 3: MUTATION ENGINE
// ============================================================================
//
// The core function: mutate() produces a new tree version.
// Only nodes on the path from root to mutation are copied.
// All other nodes are SHARED via Arc.

/// Mutate a tree by applying a change function to a node at a given path.
///
/// # Arguments
/// - root: The tree to mutate
/// - path: Vec of child indices to follow (e.g., [0, 1] means "child 0, then child 1")
/// - change: Closure that modifies the node in-place
///
/// # Returns
/// A new root Arc with the change applied. The old root is unchanged.
///
/// # Structural Sharing
/// Only nodes on the path are cloned. Sibling nodes remain shared via Arc.
///
/// # Example
/// ```ignore
/// let root = TreeBuilder::new("div").child(...).build();
/// let new_root = mutate(root, vec![0], |node| {
///     node.attrs.insert("class".to_string(), "active".to_string());
/// });
/// // root is unchanged. new_root has the attribute.
/// ```
pub fn mutate<F>(root: DomNode, path: Vec<usize>, change: F) -> DomNode
where
    F: FnOnce(&mut Node<String>),
{
    mutate_recursive(&root, &path, 0, change)
}

/// Recursive helper for mutate(). Called internally.
fn mutate_recursive<F>(
    node: &DomNode,
    path: &[usize],
    depth: usize,
    change: F,
) -> DomNode
where
    F: FnOnce(&mut Node<String>),
{
    if path.is_empty() {
        // Base case: we've reached the target node. Clone and apply change.
        let mut new_node = (**node).clone(); // Clone the node's data (not Arc)
        change(&mut new_node);
        Arc::new(new_node)
    } else {
        // Recursive case: follow path[0], recurse on children.
        let child_idx = path[0];

        // Clone current node (shallow — its fields are cloned, but children Arcs aren't re-Arced)
        let mut new_node = (**node).clone();

        // Recursively mutate the child at path[0]
        if let Some(child) = node.children.get(child_idx) {
            let new_child = mutate_recursive(
                child,
                &path[1..],
                depth + 1,
                change,
            );
            // Replace the child in the cloned node's children vector
            new_node.children = new_node.children.update(child_idx, new_child);
        }

        Arc::new(new_node)
    }
}

/// Count the total number of nodes in a tree.
pub fn count_nodes(node: &DomNode) -> usize {
    1 + node.children.iter().map(count_nodes).sum::<usize>()
}

// ============================================================================
// SECTION 4: VERIFICATION UTILITIES
// ============================================================================

/// Compare two Arc pointers for identity (not equality).
/// Returns true if they point to the same allocation.
pub fn arcs_identical<T>(a: &Arc<T>, b: &Arc<T>) -> bool {
    Arc::ptr_eq(a, b)
}

/// Serialize tree to HTML (for testing).
pub fn to_html(node: &DomNode) -> String {
    let mut html = String::new();
    to_html_recursive(node, &mut html);
    html
}

fn to_html_recursive(node: &DomNode, out: &mut String) {
    out.push('<');
    out.push_str(&node.tag);

    for (k, v) in node.attrs.iter() {
        out.push(' ');
        out.push_str(k);
        out.push_str(r#"=""#);
        out.push_str(v);
        out.push('"');
    }

    out.push('>');

    if let Some(content) = &node.content {
        out.push_str(content);
    }

    for child in node.children.iter() {
        to_html_recursive(child, out);
    }

    out.push_str("</");
    out.push_str(&node.tag);
    out.push('>');
}

// ============================================================================
// SECTION 5: TESTS (PHASE 1)
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_node_creation() {
        // TODO: Test Node::new, with_child, with_attr, with_content
    }

    #[test]
    fn test_tree_builder() {
        // TODO: Build a simple tree with TreeBuilder
    }

    #[test]
    fn test_mutation_returns_new_arc() {
        // TODO: Mutate root, prove new root != old root
    }

    #[test]
    fn test_untouched_siblings_are_shared() {
        // TODO: Prove Arc::ptr_eq on unmutated siblings
    }

    #[test]
    fn test_mutated_path_is_new() {
        // TODO: Prove mutated node is new Arc
    }

    #[test]
    fn test_immutable_dom_proof() {
        // TODO: The big integration test
    }
}
```

---

## APPENDIX A: How to Use This Document

1. **Read PART 1** to understand the system design
2. **Skim PART 2** to see all phases
3. **Deep dive PART 4** for Phase 1 execution
4. **Execute PROMPTS 1–5** in order over 2–3 weeks
5. **Run DOCTOR PROMPT** when all Phase 1 tests pass
6. **Advance to Phase 2** when doctor gives green light

## APPENDIX B: Key Files

| File | Purpose |
|------|---------|
| `Cargo.toml` | Dependencies: `im`, `criterion` |
| `src/lib.rs` | All code (550 lines by Phase 1 end) |
| `IMMUTABLE_DOM_DEVELOPMENT_PLAN.md` | This file (source of truth) |

## APPENDIX C: Failure Modes & Recovery

| If This Happens | Then Do This |
|-----------------|--------------|
| Compile errors on Arc type | Reread Prompt 2. Arc is a wrapper around the inner data. Clone the inner data, not the Arc. |
| Tests fail on ptr_eq | Use `Arc::ptr_eq()`, not `==`. Identity, not equality. |
| `im::Vector` API confuses you | Refer to `im` crate docs. It's like `Vec` but functional. |
| Mutate function is too complex | Break it into smaller functions. mutate_recursive is fine. |
| You're unclear on ownership | Draw the Arc pointers. Who owns what? Write it down. |

---

**Last Updated:** 2025-04-25  
**Author:** Claude (guided by Roshan Ravani)  
**Status:** Ready for Phase 1 Execution
