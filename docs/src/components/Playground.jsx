import React, { useState } from 'react';

class ImmutableNode {
  constructor(tag, content = null) {
    this.tag = tag;
    this.content = content;
    this.children = [];
    this.attrs = {};
    this.id = Math.random().toString(36).substr(2, 9);
  }

  withChild(child) {
    this.children.push(child);
    return this;
  }

  withAttr(key, value) {
    this.attrs[key] = value;
    return this;
  }

  withContent(content) {
    this.content = content;
    return this;
  }
}

function mutateTree(root, path, changeFn) {
  if (path.length === 0) {
    const newNode = Object.assign(Object.create(Object.getPrototypeOf(root)), root);
    newNode.id = Math.random().toString(36).substr(2, 9);
    changeFn(newNode);
    return newNode;
  }

  const newRoot = Object.assign(Object.create(Object.getPrototypeOf(root)), root);
  newRoot.id = Math.random().toString(36).substr(2, 9);
  const childIndex = path[0];

  if (newRoot.children[childIndex]) {
    const newChildren = [...newRoot.children];
    newChildren[childIndex] = mutateTree(newRoot.children[childIndex], path.slice(1), changeFn);
    newRoot.children = newChildren;
  }

  return newRoot;
}

function renderTree(node, path = [], depth = 0, highlightPath = []) {
  const isHighlighted = highlightPath.length > 0 && 
    path.length > 0 && 
    path[0] === highlightPath[0] &&
    JSON.stringify(path) === JSON.stringify(highlightPath.slice(0, path.length));

  const isOnPath = highlightPath.length > 0 && 
    path.length <= highlightPath.length &&
    JSON.stringify(path) === JSON.stringify(highlightPath.slice(0, path.length));

  let borderColor = 'transparent';
  let bgColor = 'transparent';

  if (isHighlighted) {
    borderColor = 'var(--accent-primary)';
    bgColor = 'rgba(183, 65, 14, 0.1)';
  } else if (isOnPath) {
    borderColor = '#4ade80';
    bgColor = 'rgba(74, 222, 128, 0.1)';
  }

  return (
    <div key={node.id} style={{ 
      marginLeft: depth > 0 ? '24px' : '0',
      borderLeft: '1px dashed var(--border-medium)',
      paddingLeft: '12px',
      marginTop: '8px'
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        border: `1px solid ${borderColor}`,
        background: bgColor,
        borderRadius: '4px',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '14px',
      }}>
        <span style={{ color: 'var(--text-tertiary)' }}>&lt;</span>
        <span style={{ color: 'var(--rust-orange)', fontWeight: '600' }}>{node.tag}</span>
        {Object.entries(node.attrs).map(([k, v]) => (
          <span key={k} style={{ color: 'var(--text-muted)' }}>
            {k}="{v}"
          </span>
        ))}
        <span style={{ color: 'var(--text-tertiary)' }}>&gt;</span>
        {node.content && (
          <span style={{ color: 'var(--text-primary)' }}>{node.content}</span>
        )}
        <span style={{ 
          fontSize: '10px', 
          color: 'var(--text-muted)',
          marginLeft: '8px'
        }}>
          id:{node.id.substr(0, 6)}
        </span>
      </div>
      {node.children.map((child, idx) => 
        renderTree(child, [...path, idx], depth + 1, highlightPath)
      )}
    </div>
  );
}

export default function Playground() {
  const [tree, setTree] = useState(() => {
    const root = new ImmutableNode('div');
    root.withAttr('id', 'root');

    const section = new ImmutableNode('section');
    section.withChild(new ImmutableNode('span').withContent('Child A'));
    section.withChild(new ImmutableNode('span').withContent('Child B'));

    root.withChild(section);
    root.withChild(new ImmutableNode('p').withContent('Footer'));

    return root;
  });

  const [oldTree, setOldTree] = useState(null);
  const [mutatedPath, setMutatedPath] = useState([]);
  const [newTree, setNewTree] = useState(null);

  const handleMutate = () => {
    const path = mutatedPath.length > 0 ? mutatedPath : [0, 0];
    const newT = mutateTree(tree, path, (node) => {
      node.content = node.content ? node.content + ' (MUTATED)' : 'MUTATED';
    });
    setOldTree(tree);
    setNewTree(newT);
  };

  const handleReset = () => {
    setOldTree(null);
    setNewTree(null);
    setMutatedPath([]);
  };

  const pathInput = mutatedPath.join(', ');

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Controls</h3>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Mutation Path</h4>
          <input
            type="text"
            value={pathInput}
            onChange={(e) => setMutatedPath(e.target.value.split(',').map(Number).filter(n => !isNaN(n)))}
            placeholder="e.g., 0, 0"
            style={{
              background: 'var(--bg-code)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-primary)',
              padding: '12px 16px',
              borderRadius: '8px',
              width: '100%',
              fontFamily: 'var(--font-mono)',
              boxSizing: 'border-box',
              marginBottom: '16px'
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Comma-separated indices: "0, 1" = root.children[0].children[1]
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={handleMutate}
              className="hero-cta"
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Mutate!
            </button>
            <button
              onClick={handleReset}
              className="hero-cta-secondary"
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                borderRadius: '9999px',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="card diagram-container" style={{ padding: '24px', margin: 0 }}>
          <h3 style={{ marginBottom: '16px' }}>Current Tree</h3>
          {renderTree(tree, [], 0, newTree ? mutatedPath : [])}
        </div>
      </div>

      {oldTree && newTree && (
        <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '24px' }}>After Mutation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div className="diagram-container" style={{ padding: '24px', margin: 0 }}>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Old Tree (unchanged)</h4>
              {renderTree(oldTree)}
            </div>
            <div className="diagram-container" style={{ padding: '24px', margin: 0 }}>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>New Tree (mutated)</h4>
              {renderTree(newTree, [], 0, mutatedPath)}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Legend</h3>
        <div style={{ display: 'flex', gap: '24px', fontSize: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', background: 'rgba(183, 65, 14, 0.1)', border: '1px solid var(--accent-primary)', borderRadius: '4px' }}></div>
            <span style={{ color: 'var(--text-secondary)' }}>Target (will mutate)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid #4ade80', borderRadius: '4px' }}></div>
            <span style={{ color: 'var(--text-secondary)' }}>Path (will clone)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', background: 'transparent', border: '1px solid var(--border-medium)', borderRadius: '4px' }}></div>
            <span style={{ color: 'var(--text-secondary)' }}>Shared (unchanged)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
