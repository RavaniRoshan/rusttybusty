//! # Immutable Shared-State DOM
//!
//! A lock-free, concurrent DOM using Arc-backed persistent data structures.
//!
//! ## Core Idea
//! Every mutation produces a NEW tree root. Old tree remains valid.
//! Sibling nodes are SHARED via Arc<Node> — only the path from root to mutation is copied.
//!
//! ## Thread Safety (Phase 2+)
//! Arc<Node<T>> is Sync + Send because Node is immutable after creation.
//!
//! ## This File
//! Phase 1 focus: Node structure, mutate(), TreeBuilder, unit tests.
//! Threading comes in Phase 2.

use std::sync::Arc;
use im::{HashMap as ImHashMap, Vector as ImVector};

// ============================================================================
// SECTION 1: NODE STRUCTURE
// ============================================================================

/// Immutable DOM node. Generic over content type T.
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

/// Fluent builder for constructing Node trees.
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
pub fn mutate<F>(root: DomNode, path: Vec<usize>, change: F) -> DomNode
where
    F: FnOnce(&mut Node<String>),
{
    mutate_recursive(&root, &path, change)
}

/// Recursive helper for mutate(). Called internally.
fn mutate_recursive<F>(
    node: &DomNode,
    path: &[usize],
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
        let node = Node::<String>::new(1, "div");
        assert_eq!(node.tag, "div");
        assert_eq!(node.id, 1);
        assert_eq!(node.child_count(), 0);
    }

    #[test]
    fn test_tree_builder_simple() {
        let tree = TreeBuilder::new("p")
            .content("Hello, World!".to_string())
            .build();

        assert_eq!(tree.tag, "p");
        assert_eq!(tree.content, Some("Hello, World!".to_string()));
    }

    #[test]
    fn test_tree_builder_with_children() {
        let child = TreeBuilder::new("span")
            .content("child".to_string())
            .build();

        let parent = TreeBuilder::new("div")
            .child(child)
            .build();

        assert_eq!(parent.tag, "div");
        assert_eq!(parent.child_count(), 1);
    }

    #[test]
    fn test_mutation_returns_new_arc() {
        let root = TreeBuilder::new("div")
            .content("original".to_string())
            .build();

        let original_ptr = Arc::as_ptr(&root);

        let new_root = mutate(Arc::clone(&root), vec![], |node| {
            node.content = Some("mutated".to_string());
        });

        let new_ptr = Arc::as_ptr(&new_root);

        // Different Arc pointers
        assert_ne!(original_ptr, new_ptr);

        // Old root unchanged
        assert_eq!(root.content, Some("original".to_string()));

        // New root has mutation
        assert_eq!(new_root.content, Some("mutated".to_string()));
    }

    #[test]
    fn test_untouched_siblings_are_shared() {
        let left_child = TreeBuilder::new("p").content("left".to_string()).build();
        let right_child = TreeBuilder::new("p").content("right".to_string()).build();

        let root = TreeBuilder::new("div")
            .child(Arc::clone(&left_child))
            .child(Arc::clone(&right_child))
            .build();

        // Mutate the left child (index 0)
        let new_root = mutate(Arc::clone(&root), vec![0], |node| {
            node.attrs.insert("class".to_string(), "active".to_string());
        });

        // Right child (index 1) should be the SAME Arc in both trees
        let old_right = root.children.get(1).unwrap();
        let new_right = new_root.children.get(1).unwrap();

        assert!(arcs_identical(old_right, new_right));
    }

    #[test]
    fn test_immutable_dom_proof() {
        // Build a 5-node tree
        //   div
        //   ├─ p (id=1, content="First")
        //   └─ section
        //      ├─ span (id=2, content="Original")
        //      └─ span (id=3, content="Third")

        let span_2 = TreeBuilder::new("span")
            .content("Original".to_string())
            .build();

        let span_3 = TreeBuilder::new("span")
            .content("Third".to_string())
            .build();

        let section = TreeBuilder::new("section")
            .child(Arc::clone(&span_2))
            .child(Arc::clone(&span_3))
            .build();

        let p = TreeBuilder::new("p")
            .content("First".to_string())
            .build();

        let root = TreeBuilder::new("div")
            .child(Arc::clone(&p))
            .child(Arc::clone(&section))
            .build();

        // Save the original
        let original_root = Arc::clone(&root);

        // MUTATE: section -> child 0 (span_2) -> change content to "Mutated"
        let new_root = mutate(Arc::clone(&root), vec![1, 0], |node| {
            node.content = Some("Mutated".to_string());
        });

        // Verify immutability
        assert_eq!(
            original_root.children.get(1).unwrap().children.get(0).unwrap().content,
            Some("Original".to_string()),
            "Old tree should be unchanged"
        );

        assert_eq!(
            new_root.children.get(1).unwrap().children.get(0).unwrap().content,
            Some("Mutated".to_string()),
            "New tree should have mutation"
        );

        // Verify structural sharing: the right subtree (span_3) is shared
        let old_span_3 = original_root.children.get(1).unwrap().children.get(1).unwrap();
        let new_span_3 = new_root.children.get(1).unwrap().children.get(1).unwrap();

        assert!(
            arcs_identical(old_span_3, new_span_3),
            "Untouched subtree should be shared via Arc"
        );

        println!("✓ Immutable DOM proof passed!");
        println!("  Old root: {:p}", Arc::as_ptr(&original_root));
        println!("  New root: {:p}", Arc::as_ptr(&new_root));
        println!("  Shared span_3: {:p}", Arc::as_ptr(old_span_3));
    }
}
