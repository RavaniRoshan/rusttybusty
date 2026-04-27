//! Immutable Shared-State DOM
//! Phase 1: Foundation Architecture

use std::sync::Arc;
use im::{HashMap as ImHashMap, Vector as ImVector};

/// Immutable DOM node. Generic over content type T.
#[derive(Debug, Clone)]
pub struct Node<T> {
    pub id: usize,
    pub tag: String,
    pub children: ImVector<Arc<Node<T>>>,
    pub attrs: ImHashMap<String, String>,
    pub content: Option<T>,
}

/// Concrete DOM node type using String for content.
pub type DomNode = Arc<Node<String>>;

impl<T: Clone> Node<T> {
    pub fn new(id: usize, tag: &str) -> Self {
        Node {
            id,
            tag: tag.to_string(),
            children: ImVector::new(),
            attrs: ImHashMap::new(),
            content: None,
        }
    }

    pub fn with_child(mut self, child: Arc<Node<T>>) -> Self {
        self.children.push_back(child);
        self
    }

    pub fn with_attr(mut self, k: String, v: String) -> Self {
        self.attrs.insert(k, v);
        self
    }

    pub fn with_content(mut self, content: T) -> Self {
        self.content = Some(content);
        self
    }

    pub fn child_count(&self) -> usize {
        self.children.len()
    }

    pub fn child(&self, idx: usize) -> Option<&Arc<Node<T>>> {
        self.children.get(idx)
    }
}

/// Fluent builder for constructing Node trees.
pub struct TreeBuilder {
    id_counter: usize,
    tag: String,
    attrs: ImHashMap<String, String>,
    children: Vec<DomNode>,
    content: Option<String>,
}

impl TreeBuilder {
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

    pub fn child(mut self, child: DomNode) -> Self {
        self.children.push(child);
        self
    }

    pub fn attr(mut self, k: String, v: String) -> Self {
        self.attrs.insert(k, v);
        self
    }

    pub fn content(mut self, text: String) -> Self {
        self.content = Some(text);
        self
    }

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

/// Mutate a tree by applying a change function to a node at a given path.
pub fn mutate<F>(root: DomNode, path: Vec<usize>, change: F) -> DomNode
where
    F: FnOnce(&mut Node<String>),
{
    mutate_recursive(&root, &path, 0, change)
}

fn mutate_recursive<F>(
    node: &DomNode,
    path: &[usize],
    _depth: usize,
    change: F,
) -> DomNode
where
    F: FnOnce(&mut Node<String>),
{
    if path.is_empty() {
        let mut new_node = (**node).clone();
        change(&mut new_node);
        Arc::new(new_node)
    } else {
        let child_idx = path[0];
        let mut new_node = (**node).clone();

        if let Some(child) = node.children.get(child_idx) {
            let new_child = mutate_recursive(child, &path[1..], _depth + 1, change);
            new_node.children = new_node.children.update(child_idx, new_child);
        }

        Arc::new(new_node)
    }
}

/// Count the total number of nodes in a tree.
pub fn count_nodes(node: &DomNode) -> usize {
    1 + node.children.iter().map(count_nodes).sum::<usize>()
}

/// Compare two Arc pointers for identity.
pub fn arcs_identical<T>(a: &Arc<T>, b: &Arc<T>) -> bool {
    Arc::ptr_eq(a, b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_node_creation() {
        let node = Node::new(1, "section")
            .with_attr("class".to_string(), "container".to_string())
            .with_content("Hello".to_string());

        assert_eq!(node.id, 1);
        assert_eq!(node.tag, "section");
        assert_eq!(node.attrs.get("class"), Some(&"container".to_string()));
        assert_eq!(node.content, Some("Hello".to_string()));
    }

    #[test]
    fn test_tree_builder_simple() {
        let node = TreeBuilder::new("div")
            .attr("id".to_string(), "root".to_string())
            .build();

        assert_eq!(node.tag, "div");
        assert_eq!(node.attrs.get("id"), Some(&"root".to_string()));
        assert!(node.children.is_empty());
    }

    #[test]
    fn test_tree_builder_with_children() {
        let child1 = TreeBuilder::new("p").content("Hello".to_string()).build();
        let child2 = TreeBuilder::new("p").content("World".to_string()).build();

        let root = TreeBuilder::new("div")
            .child(Arc::clone(&child1))
            .child(Arc::clone(&child2))
            .build();

        assert_eq!(root.children.len(), 2);
        assert_eq!(root.children[0].content, Some("Hello".to_string()));
        assert_eq!(root.children[1].content, Some("World".to_string()));
    }

    #[test]
    fn test_tree_builder_complex() {
        // div#root → section → (p, p)
        let root = TreeBuilder::new("div")
            .attr("id".to_string(), "root".to_string())
            .child(
                TreeBuilder::new("section")
                    .child(TreeBuilder::new("p").content("Hello".to_string()).build())
                    .child(TreeBuilder::new("p").content("World".to_string()).build())
                    .build()
            )
            .build();

        // Total nodes: div, section, p, p = 4
        let total_nodes = count_nodes(&root);
        println!("Total nodes: {}", total_nodes);
        assert_eq!(total_nodes, 4);

        assert_eq!(root.child_count(), 1);

        let section = root.child(0).unwrap();
        assert_eq!(section.child_count(), 2);
    }

    #[test]
    fn test_mutation_returns_new_arc() {
        let root = TreeBuilder::new("div").build();
        let old_ptr = Arc::as_ptr(&root);

        let new_root = mutate(Arc::clone(&root), vec![], |n| {
            n.content = Some("m".to_string());
        });
        let new_ptr = Arc::as_ptr(&new_root);

        println!("old root ptr: {:p}", old_ptr);
        println!("new root ptr: {:p}", new_ptr);
        assert!(!Arc::ptr_eq(&root, &new_root));
    }

    #[test]
    fn test_untouched_siblings_are_shared() {
        let child1 = TreeBuilder::new("p").content("A".to_string()).build();
        let child2 = TreeBuilder::new("p").content("B".to_string()).build();
        let child3 = TreeBuilder::new("p").content("C".to_string()).build();

        let root = TreeBuilder::new("div")
            .child(Arc::clone(&child1))
            .child(Arc::clone(&child2))
            .child(Arc::clone(&child3))
            .build();

        let new_root = mutate(Arc::clone(&root), vec![1], |n| {
            n.content = Some("B-MUTATED".to_string());
        });

        let new_child0 = new_root.children.get(0).unwrap();
        let new_child2 = new_root.children.get(2).unwrap();

        println!("shared sibling (child0): {:p}", Arc::as_ptr(new_child0));
        assert!(Arc::ptr_eq(new_child0, &child1));
        assert!(Arc::ptr_eq(new_child2, &child3));

        let new_child1 = new_root.children.get(1).unwrap();
        println!("mutated child1 (new arc): {:p}", Arc::as_ptr(new_child1));
        assert!(!Arc::ptr_eq(new_child1, &child2));
    }

    #[test]
    fn test_mutated_path_is_new() {
        let grandchild = TreeBuilder::new("span").content("leaf".to_string()).build();
        let child = TreeBuilder::new("div").child(Arc::clone(&grandchild)).build();
        let root = TreeBuilder::new("div").child(Arc::clone(&child)).build();

        let old_leaf = root.children.get(0).unwrap().children.get(0).unwrap();
        let old_leaf_ptr = Arc::as_ptr(old_leaf);

        let new_root = mutate(Arc::clone(&root), vec![0, 0], |n| {
            n.content = Some("MUTATED".to_string());
        });

        let new_leaf = new_root.children.get(0).unwrap().children.get(0).unwrap();
        let new_leaf_ptr = Arc::as_ptr(new_leaf);

        println!("old leaf: {:p}", old_leaf_ptr);
        println!("new leaf: {:p}", new_leaf_ptr);
        assert_ne!(old_leaf_ptr, new_leaf_ptr);
        assert!(!Arc::ptr_eq(old_leaf, new_leaf));
    }

    #[test]
    fn test_immutable_dom_proof() {
        // Build a 5-node tree:
        // div
        //   ├─ section
        //   │    ├─ span (Original)
        //   │    └─ span (Sibling)
        //   └─ p (Footer)
        let span_orig = TreeBuilder::new("span").content("Original".to_string()).build();
        let span_sib = TreeBuilder::new("span").content("Sibling".to_string()).build();
        let section = TreeBuilder::new("section")
            .child(Arc::clone(&span_orig))
            .child(Arc::clone(&span_sib))
            .build();
        let p_footer = TreeBuilder::new("p").content("Footer".to_string()).build();
        let root = TreeBuilder::new("div")
            .child(Arc::clone(&section))
            .child(Arc::clone(&p_footer))
            .build();

        // Save old root pointer for comparison
        let old_root_ptr = Arc::as_ptr(&root);
        let old_span_orig_ptr = Arc::as_ptr(&span_orig);

        // Mutate the deep child: path [1, 0] = div's child[1] is p_footer? Wait carefully:
        // root.children: [section, p_footer]
        // We want to mutate the span_orig inside section.
        // Path to span_orig: root → section (index 0) → span_orig (index 0) = [0, 0]
        let new_root = mutate(Arc::clone(&root), vec![0, 0], |n| {
            n.content = Some("Mutated".to_string());
        });

        // 4a. Original root unchanged
        assert_eq!(root.children[0].children[0].content, Some("Original".to_string()));

        // 4b. New root has mutation
        assert_eq!(new_root.children[0].children[0].content, Some("Mutated".to_string()));

        // 4c. Untouched siblings shared:
        // - section's second child (span_sib) should be shared with old tree
        // Actually: we mutated span_orig. span_sib is the sibling inside section.
        let new_section = new_root.children[0].as_ref();
        let new_span_sib = &new_section.children[1];
        assert!(Arc::ptr_eq(new_span_sib, &span_sib), "span_sib should be shared");

        // - the p_footer child of root should also be shared (not on mutation path)
        let new_p = &new_root.children[1];
        assert!(Arc::ptr_eq(new_p, &p_footer), "p_footer should be shared");

        // Print pointers to verify structural sharing
        println!("Old root: {:p}", old_root_ptr);
        println!("New root: {:p}", Arc::as_ptr(&new_root));
        println!("Shared span_sib: {:p}", Arc::as_ptr(new_span_sib));
    }
}
