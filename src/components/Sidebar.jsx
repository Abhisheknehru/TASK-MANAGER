import ThemeSwitcher from './ThemeSwitcher';
import { getSheetUrl, isConnected } from '../services/sheetsApi';
import './Sidebar.css';

const NAV_ITEMS = [
    { id: 'tasks', icon: '📋', label: 'Tasks' },
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
];

const Sidebar = ({ activeView, onViewChange, streakData, isAuthenticated, onSignIn, onSignOut, isSyncing }) => {
    const connected = isConnected();
    const sheetUrl = connected ? getSheetUrl() : null;

    return (
        <aside className="sidebar">
            <div className="sidebar-inner">
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="logo-icon">✦</div>
                    <span className="logo-text">TaskFlow</span>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                            onClick={() => onViewChange(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                            {activeView === item.id && <div className="nav-indicator" />}
                        </button>
                    ))}
                </nav>

                {/* Streak Display */}
                <div className="sidebar-streak">
                    <div className="streak-flame">🔥</div>
                    <div className="streak-info">
                        <div className="streak-count">{streakData.currentStreak}</div>
                        <div className="streak-label">Day Streak</div>
                    </div>
                    {streakData.longestStreak > 0 && (
                        <div className="streak-best">Best: {streakData.longestStreak}</div>
                    )}
                </div>

                {/* Theme Switcher */}
                <ThemeSwitcher />

                {/* Google Sync */}
                <div className="sidebar-sync">
                    {connected ? (
                        <div className="sync-status">
                            <div className="sync-connected">
                                <span className={`sync-dot ${isSyncing ? 'syncing' : 'connected'}`} />
                                <span className="sync-text">{isSyncing ? 'Syncing...' : 'Sheets Connected'}</span>
                            </div>
                            {sheetUrl && (
                                <a
                                    href={sheetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sidebar-sheet-link"
                                    title="Open Google Sheet"
                                >
                                    📊 View Sheet
                                </a>
                            )}
                            <button className="btn btn-ghost btn-sm" onClick={onSignOut}>Disconnect</button>
                        </div>
                    ) : (
                        <div className="sync-not-connected">
                            <span className="sync-hint">Sync to Google Sheets</span>
                            <span className="sync-hint-sub">Set up in ⚙️ Settings</span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
