import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import Calendar from './components/Calendar';
import Dashboard from './components/Dashboard';
import StreakBadges from './components/StreakBadges';
import SettingsModal from './components/SettingsModal';
import useTasks from './hooks/useTasks';
import useNotifications from './hooks/useNotifications';
import useStreak from './hooks/useStreak';
import useGoogleSheets from './hooks/useGoogleSheets';
import storage from './services/localStorage';

function App() {
  const [activeView, setActiveView] = useState('tasks');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [focusMode, setFocusMode] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => storage.getSettings());

  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    updateTimeSpent,
    bulkSetTasks,
  } = useTasks();

  useNotifications(tasks);
  const { streakData, badges, newBadge, dismissBadge, allBadges } = useStreak(tasks);

  const {
    isAuthenticated,
    isSyncing,
    lastSynced,
    syncError,
    handleSignIn,
    handleSignOut,
    performSync,
    handleExportReport,
  } = useGoogleSheets(tasks, bulkSetTasks);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowTaskForm(true);
        setEditingTask(null);
      }
      if (e.key === 'Escape') {
        setShowTaskForm(false);
        setEditingTask(null);
        setShowSettings(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Set theme on mount
  useEffect(() => {
    const theme = storage.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    const colors = storage.getCustomColors();
    document.documentElement.style.setProperty('--custom-hue', colors.hue);
    document.documentElement.style.setProperty('--custom-sat', `${colors.sat}%`);
  }, []);

  const handleSaveTask = useCallback((data) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
    setEditingTask(null);
    setShowTaskForm(false);

    // Sync after save if authenticated
    if (isAuthenticated) {
      setTimeout(performSync, 500);
    }
  }, [editingTask, updateTask, addTask, isAuthenticated, performSync]);

  const handleEditTask = useCallback((task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  }, []);

  const handleDeleteTask = useCallback((id) => {
    deleteTask(id);
    if (isAuthenticated) {
      setTimeout(performSync, 500);
    }
  }, [deleteTask, isAuthenticated, performSync]);

  const handleToggleComplete = useCallback((id) => {
    toggleComplete(id);
    if (isAuthenticated) {
      setTimeout(performSync, 500);
    }
  }, [toggleComplete, isAuthenticated, performSync]);

  const handleSaveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    storage.setSettings(newSettings);
  }, []);

  const handleQuickAdd = useCallback(() => {
    setEditingTask(null);
    setShowTaskForm(true);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'tasks':
        return (
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onUpdateTime={updateTimeSpent}
            focusMode={focusMode}
            searchQuery={searchQuery}
          />
        );
      case 'calendar':
        return (
          <>
            <Calendar streakData={streakData} />
            <StreakBadges
              badges={badges}
              allBadges={allBadges}
              newBadge={null}
              onDismiss={dismissBadge}
            />
          </>
        );
      case 'dashboard':
        return (
          <Dashboard
            tasks={tasks}
            settings={settings}
            onExportReport={handleExportReport}
            isAuthenticated={isAuthenticated}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        streakData={streakData}
        isAuthenticated={isAuthenticated}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isSyncing={isSyncing}
      />

      <div className="main-area">
        <Header
          onSearch={setSearchQuery}
          focusMode={focusMode}
          onFocusModeChange={setFocusMode}
          isSyncing={isSyncing}
          lastSynced={lastSynced}
          onSync={performSync}
          onQuickAdd={handleQuickAdd}
          isAuthenticated={isAuthenticated}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          streakData={streakData}
        />

        <main className="main-content">
          {renderView()}
        </main>
      </div>

      {/* Modals */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => { setShowTaskForm(false); setEditingTask(null); }}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Badge notification */}
      {newBadge && (
        <StreakBadges
          badges={badges}
          allBadges={allBadges}
          newBadge={newBadge}
          onDismiss={dismissBadge}
        />
      )}

      {/* FAB for settings on mobile */}
      <button
        className="fab-settings"
        onClick={() => setShowSettings(true)}
        title="Settings"
      >
        ⚙️
      </button>

      {/* Sync error toast */}
      {syncError && (
        <div className="sync-error-toast animate-fade-in-up">
          <span>⚠️ Sync: {syncError}</span>
          <button onClick={() => performSync()}>Retry</button>
        </div>
      )}

      {/* Offline indicator */}
      <OfflineIndicator />
    </div>
  );
}

function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-banner animate-fade-in-down">
      📡 You're offline — changes will sync when you reconnect
    </div>
  );
}

export default App;
