// Minimal, restrained left navigation sidebar with Lucide icons
import React from 'react';
import { Home, PlusCircle, Layers, Settings } from 'lucide-react';

export default function Sidebar({ currentScreen, onNavigate }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'configure', label: 'New Work', icon: PlusCircle },
    { id: 'workspace', label: 'Workspace', icon: Layers },
  ];

  return (
    <aside style={{
      width: '54px',
      height: '100vh',
      backgroundColor: '#ffffff',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '14px 0',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 50
    }}>
      {/* Brand logo icon */}
      <div 
        onClick={() => onNavigate('home')}
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '6px',
          backgroundColor: 'var(--btn-primary-bg)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '13px',
          cursor: 'pointer',
          marginBottom: '20px',
          letterSpacing: '-0.02em'
        }}
        title="IntelForge"
      >
        IF
      </div>

      {/* Nav icons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isActive ? 'var(--bg-subtle)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.1s'
              }}
              title={item.label}
            >
              <Icon size={16} strokeWidth={1.75} />
            </button>
          );
        })}
      </div>

      {/* Settings & Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <button 
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Settings"
        >
          <Settings size={16} strokeWidth={1.75} />
        </button>

        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 600
        }}>
          AR
        </div>
      </div>
    </aside>
  );
}
