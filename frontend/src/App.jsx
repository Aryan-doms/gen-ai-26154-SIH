// Main React application routing and URL sync container
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HomeScreen from './components/HomeScreen';
import ConfigureScreen from './components/ConfigureScreen';
import ProcessingScreen from './components/ProcessingScreen';
import WorkspaceScreen from './components/WorkspaceScreen';
import FinalizeScreen from './components/FinalizeScreen';
import { createTransformation } from './services/api';

// Error Boundary to prevent white screen if an unexpected child error occurs
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '80px 24px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Workspace Display Error
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {this.state.error?.message || "An unexpected error occurred while loading this workspace view."}
          </p>
          <button 
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
            style={{ padding: '8px 18px', backgroundColor: 'var(--text-primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
          >
            Return to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [activeWorkId, setActiveWorkId] = useState(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/^\/work\/([^/]+)/);
      if (match) return match[1];
    }
    return '2026-0417';
  });
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [processingState, setProcessingState] = useState({
    isReady: false,
    workId: null,
    workTitle: 'Operation Silver Falcon',
    error: null
  });

  // Sync URL on browser Back / Forward
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      const match = window.location.pathname.match(/^\/work\/([^/]+)/);
      if (match) {
        setActiveWorkId(match[1]);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Programmatic navigation that updates real browser URL
  const navigate = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setCurrentPath(path);
  };

  // Select work from dashboard
  const handleSelectWork = (workId) => {
    setActiveWorkId(workId);
    navigate(`/work/${workId}`);
  };

  // Start new transformation
  const handleStartNew = (promptText) => {
    setPendingPrompt(promptText || '');
    navigate('/new');
  };

  // Submit transformation configuration
  const handleTriggerTransformation = (payload) => {
    const title = payload.title || 'Incident Dossier Transformation';
    setProcessingState({
      isReady: false,
      workId: null,
      workTitle: title,
      error: null
    });
    navigate('/processing');

    createTransformation(payload)
      .then((res) => {
        setProcessingState(prev => ({
          ...prev,
          isReady: true,
          workId: res.id
        }));
      })
      .catch((err) => {
        console.warn("API transformation error, fallback to demo work:", err);
        setProcessingState(prev => ({
          ...prev,
          isReady: true,
          workId: '2026-0417',
          error: err.message
        }));
      });
  };

  // Map current path to sidebar active indicator
  const getSidebarScreen = () => {
    if (currentPath === '/') return 'home';
    if (currentPath === '/new') return 'configure';
    if (currentPath.startsWith('/work')) return 'workspace';
    return 'home';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar 
        currentScreen={getSidebarScreen()} 
        onNavigate={(screen) => {
          if (screen === 'home') navigate('/');
          else if (screen === 'configure') navigate('/new');
          else if (screen === 'workspace') navigate(`/work/${activeWorkId}`);
        }} 
      />

      {/* Main Content Area */}
      <div style={{ marginLeft: '54px', flex: 1, minHeight: '100vh' }}>
        {currentPath === '/' && (
          <HomeScreen 
            onSelectWork={handleSelectWork} 
            onStartNew={handleStartNew} 
          />
        )}

        {currentPath === '/new' && (
          <ConfigureScreen 
            initialPrompt={pendingPrompt}
            onStartTransformation={handleTriggerTransformation}
            onCancel={() => navigate('/')}
          />
        )}

        {currentPath === '/processing' && (
          <ProcessingScreen 
            workTitle={processingState.workTitle}
            workId={processingState.workId}
            isReady={processingState.isReady}
            onComplete={() => {
              const nextId = processingState.workId || activeWorkId || '2026-0417';
              setActiveWorkId(nextId);
              navigate(`/work/${nextId}`);
            }}
          />
        )}

        <ErrorBoundary>
          {currentPath.endsWith('/export') ? (
            <FinalizeScreen
              workId={activeWorkId}
              onBack={() => navigate(`/work/${activeWorkId}`)}
            />
          ) : currentPath.startsWith('/work') ? (
            <WorkspaceScreen 
              workId={activeWorkId}
              onBack={() => navigate('/')}
              onFinalize={() => navigate(`/work/${activeWorkId}/export`)}
            />
          ) : null}
        </ErrorBoundary>
      </div>
    </div>
  );
}
