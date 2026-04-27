// Pointer data from actual test run of test_immutable_dom_proof
// These values prove structural sharing: shared nodes have identical addresses

export const pointerData = {
  testName: 'test_immutable_dom_proof',
  description: 'Integration test proving immutability and structural sharing',

  beforeMutation: {
    label: 'Old root (before mutation)',
    address: '0x1d17178de80',
    note: 'Original tree, unchanged after mutation'
  },

  afterMutation: {
    label: 'New root (after mutation)',
    address: '0x1d17178a710',
    note: 'New tree with mutation applied'
  },

  sharedNode: {
    label: 'Shared span_sib (sibling of mutated node)',
    address: '0x1d17177d4d0',
    note: 'Same Arc pointer in both trees — true structural sharing'
  },

  summary: [
    { label: 'Root changed?', value: 'YES — different pointers', isShared: false },
    { label: 'span_sib shared?', value: 'YES — same pointer in both trees', isShared: true },
    { label: 'Original tree valid?', value: 'YES — content unchanged', isShared: false }
  ]
};

export const treeStructure = {
  name: 'div',
  attributes: { id: 'root' },
  children: [
    {
      name: 'section',
      attributes: {},
      children: [
        { name: 'span', attributes: {}, content: 'Original → "Mutated" after' },
        { name: 'span', attributes: {}, content: 'Sibling (shared)' }
      ]
    },
    {
      name: 'p',
      attributes: {},
      content: 'Footer (also shared)'
    }
  ]
};

export const phase1Tests = [
  {
    name: 'test_node_creation',
    status: 'pass',
    description: 'Node struct with Arc wrapper'
  },
  {
    name: 'test_tree_builder_simple',
    status: 'pass',
    description: 'TreeBuilder basic construction'
  },
  {
    name: 'test_tree_builder_with_children',
    status: 'pass',
    description: 'Builder with nested children'
  },
  {
    name: 'test_tree_builder_complex',
    status: 'pass',
    description: 'Complex tree: div → section → (p, p)'
  },
  {
    name: 'test_mutation_returns_new_arc',
    status: 'pass',
    description: 'Mutate returns different Arc pointer'
  },
  {
    name: 'test_untouched_siblings_are_shared',
    status: 'pass',
    description: 'Siblings use same Arc via Arc::ptr_eq'
  },
  {
    name: 'test_mutated_path_is_new',
    status: 'pass',
    description: 'Mutated node is new Arc, not shared'
  },
  {
    name: 'test_immutable_dom_proof',
    status: 'pass',
    description: 'Full integration test — the proof'
  }
];