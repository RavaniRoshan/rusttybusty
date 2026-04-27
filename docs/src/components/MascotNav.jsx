const MascotNav = ({ class: className }) => {
  return (
    <div 
      className={`mascot-nav ${className || ''}`}
      style={{
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer',
        borderRadius: '50%',
        background: 'transparent',
        transition: 'all 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
      title="Immutable DOM Mascot - Rust + Structure"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          transition: 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <path
          d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 1.5"
        />
        
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 12c0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5-2-4.5-4.5-4.5-4.5 2-4.5 4.5z" />
          <path d="M12 16c0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5-2-4.5-4.5-4.5-4.5 2-4.5 4.5z" />
          <path d="M12 20c0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5-2-4.5-4.5-4.5-4.5 2-4.5 4.5z" />
        </g>
        
        <circle
          cx="16"
          cy="16"
          r="2"
          fill="currentColor"
        />
      </svg>
      
      <style>{`
        .mascot-nav:hover {
          background: rgba(183, 65, 14, 0.15);
        }
        .mascot-nav:hover svg {
          transform: scale(1.1) rotate(10deg);
        }
        .mascot-nav:active {
          transform: scale(0.95);
        }
        .mascot-nav {
          color: var(--text-secondary);
        }
        .mascot-nav:hover {
          color: var(--rust-orange);
        }
      `}</style>
    </div>
  );
};

export default MascotNav;