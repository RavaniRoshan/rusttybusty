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
    borderColor = '#b7410e';
    bgColor = 'rgba(183, 65, 14, 0.2)';
  } else if (isOnPath) {
    borderColor = '#4ade80';
    bgColor = 'rgba(74, 222, 128, 0.1)';
  }

  return (
    <div key={node.id} style={{ 
      marginLeft: depth > 0 ? '24px' : '0',
      borderLeft: '1px dashed #404040',
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
        <span style={{ color: '#a8a8a8' }}>&lt;</span>
        <span style={{ color: '#b7410e', fontWeight: '600' }}>{node.tag}</span>
        {Object.entries(node.attrs).map(([k, v]) => (
          <span key={k} style={{ color: '#707070' }}>
            {k}="{v}"
          </span>
        ))}
        <span style={{ color: '#a8a8a8' }}>&gt;</span>
        {node.content && (
          <span style={{ color: '#e5e5e5' }}>{node.content}</span>
        )}
        <span style={{ 
          fontSize: '10px', 
          color: '#404040',
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
    <div style={{ padding: '24px', fontFamily: "'IBM Plex Mono', monospace" }}>
      <h1 style={{ color: '#b7410e', marginBottom: '16px' }}>Interactive Playground</h1>
      <p style={{ color: '#a8a8a8', marginBottom: '24px' }}>
        JavaScript simulation of the Immutable DOM. Build a tree, mutate it, see structural sharing.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div>
          <h3 style={{ color: '#e5e5e5', marginBottom: '12px' }}>Mutation Path</h3>
          <input
            type="text"
            value={pathInput}
            onChange={(e) => setMutatedPath(e.target.value.split(',').map(Number).filter(n => !isNaN(n)))}
            placeholder="e.g., 0, 0"
            style={{
              background: '#2d2d2d',
              border: '1px solid #404040',
              color: '#e5e5e5',
              padding: '8px 12px',
              borderRadius: '4px',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
          <p style={{ fontSize: '12px', color: '#707070', marginTop: '8px' }}>
            Comma-separated indices: "0, 1" = root.children[0].children[1]
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <button
            onClick={handleMutate}
            style={{
              background: '#b7410e',
              color: '#e5e5e5',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: '600',
            }}
          >
            Mutate!
          </button>
          <button
            onClick={handleReset}
            style={{
              background: 'transparent',
              color: '#707070',
              border: '1px solid #404040',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div style={{ 
        background: '#1c1c1c', 
        border: '1px solid #404040', 
        borderRadius: '6px', 
        padding: '16px',
        marginBottom: '24px' 
      }}>
        <h3 style={{ color: '#b7410e', marginBottom: '16px' }}>Current Tree</h3>
        {renderTree(tree, [], 0, newTree ? mutatedPath : [])}
      </div>

      {oldTree && newTree && (
        <div style={{ 
          background: '#1c1c1c', 
          border: '1px solid #404040', 
          borderRadius: '6px', 
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#b7410e', marginBottom: '16px' }}>After Mutation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <h4 style={{ color: '#a8a8a8', marginBottom: '8px' }}>Old Tree (unchanged)</h4>
              {renderTree(oldTree)}
            </div>
            <div>
              <h4 style={{ color: '#a8a8a8', marginBottom: '8px' }}>New Tree (mutated)</h4>
              {renderTree(newTree, [], 0, mutatedPath)}
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        background: '#2d2d2d', 
        border: '1px solid #404040', 
        borderRadius: '6px', 
        padding: '16px' 
      }}>
        <h3 style={{ color: '#b7410e', marginBottom: '12px' }}>Legend</h3>
        <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', background: 'rgba(183, 65, 14, 0.2)', border: '1px solid #b7410e', borderRadius: '2px' }}></div>
            <span style={{ color: '#a8a8a8' }}>Target (will mutate)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid #4ade80', borderRadius: '2px' }}></div>
            <span style={{ color: '#a8a8a8' }}>Path (will clone)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', background: 'transparent', border: '1px solid #404040', borderRadius: '2px' }}></div>
            <span style={{ color: '#a8a8a8' }}>Shared (unchanged)</span>
          </div>
        </div>
      </div>
    </div>
  );
}