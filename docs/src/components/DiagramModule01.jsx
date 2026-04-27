import React, { useState } from 'react';

export default function DiagramModule01() {
  const [isV2, setIsV2] = useState(false);

  return (
    <div 
      className="diagram-bg" 
      style={{ flexDirection: 'column', gap: '2rem', padding: '2rem', cursor: 'pointer' }}
      onClick={() => setIsV2(!isV2)}
    >
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'var(--bg-surface)',
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        border: '1px solid var(--border-light)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        color: 'var(--text-secondary)'
      }}>
        Click to mutate
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '3rem', width: '100%' }}>
        {/* v1 Tree */}
        <div style={{ textAlign: 'center', opacity: isV2 ? 0.4 : 1, transition: 'opacity 0.3s ease' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid var(--border-medium)', margin: '0 auto', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>A</div>
          <div style={{ width: '1px', height: '30px', background: 'var(--border-medium)', margin: '0 auto' }}></div>
          <div style={{ display: 'flex', gap: '30px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--border-medium)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>B</div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--border-medium)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>C</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>v1 Tree</div>
        </div>
        
        <div style={{ fontSize: '1.5rem', color: isV2 ? 'var(--accent-primary)' : 'var(--border-medium)', alignSelf: 'center', marginTop: '-3rem', transition: 'color 0.3s ease' }}>
          →
        </div>
        
        {/* v2 Tree */}
        <div style={{ textAlign: 'center', opacity: isV2 ? 1 : 0.4, transition: 'opacity 0.3s ease' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: isV2 ? '2px solid var(--accent-primary)' : '2px solid var(--border-medium)', margin: '0 auto', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', transition: 'all 0.3s ease' }}>A'</div>
          <div style={{ width: '1px', height: '30px', background: isV2 ? 'var(--accent-primary)' : 'var(--border-medium)', margin: '0 auto', transition: 'background 0.3s ease' }}></div>
          <div style={{ display: 'flex', gap: '30px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: isV2 ? '2px solid var(--accent-primary)' : '2px solid var(--border-medium)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: isV2 ? 'var(--accent-primary)' : 'inherit', transition: 'all 0.3s ease' }}>B'</div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px dashed var(--border-medium)', background: 'var(--bg-code)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>C</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>v2 Tree (Shared C)</div>
        </div>
      </div>
      
      {isV2 && (
        <div style={{
          background: 'var(--bg-surface)',
          padding: '1rem',
          border: '1px solid var(--accent-primary)',
          borderRadius: '4px',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
          marginTop: '1rem',
          textAlign: 'center',
          animation: 'fadeInUp 0.3s ease'
        }}>
          <strong>Mutation Path:</strong> Only A and B are cloned. C is shared!
        </div>
      )}
    </div>
  );
}
