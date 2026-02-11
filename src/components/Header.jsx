import { useState } from 'react';
import './Header.css';

const Header = ({ onSearch, focusMode, onFocusModeChange, isSyncing, lastSynced, onSync, onQuickAdd, isAuthenticated, onSignIn, onSignOut, streakData }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        onSearch(e.target.value);
    };

    return (
        <header className="header">
            <div className="header-inner">
                {/* Mobile logo */}
                <div className="header-mobile-logo">
                    <div className="logo-icon-sm">✦</div>
                    <span className="logo-text-sm">TaskFlow</span>
                </div>

                {/* Search */}
                <div className="header-search">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={() => { setSearchQuery(''); onSearch(''); }}>✕</button>
                    )}
                </div>

                {/* Actions */}
                <div className="header-actions">
                    {/* Focus Mode */}
                    <div className="focus-mode-toggle">
                        <select
                            className="focus-select"
                            value={focusMode}
                            onChange={(e) => onFocusModeChange(e.target.value)}
                        >
                            <option value="all">All Tasks</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    {/* Sync Button */}
                    {isAuthenticated && (
                        <button
                            className={`btn btn-ghost btn-icon header-sync-btn ${isSyncing ? 'syncing' : ''}`}
                            onClick={onSync}
                            title={lastSynced ? `Last synced: ${new Date(lastSynced).toLocaleTimeString()}` : 'Sync now'}
                        >
                            <span className={isSyncing ? 'animate-spin' : ''}>🔄</span>
                        </button>
                    )}

                    {/* Quick Add */}
                    <button
                        className="btn btn-primary btn-add"
                        onClick={onQuickAdd}
                        title="Add Task (Ctrl+N)"
                    >
                        <span className="btn-add-icon">+</span>
                        <span className="btn-add-text">New Task</span>
                    </button>

                    {/* Mobile menu */}
                    <button className="btn btn-ghost btn-icon mobile-menu-btn" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                        ⚙️
                    </button>
                </div>
            </div>

            {/* Mobile dropdown menu */}
            {showMobileMenu && (
                <div className="mobile-menu animate-fade-in-down">
                    <div className="mobile-menu-item">
                        <span className="mobile-streak">🔥 {streakData.currentStreak} day streak</span>
                    </div>
                    {isAuthenticated ? (
                        <>
                            <button className="mobile-menu-item" onClick={onSync}>
                                🔄 Sync Now
                            </button>
                            <button className="mobile-menu-item" onClick={onSignOut}>
                                🚪 Sign Out
                            </button>
                        </>
                    ) : (
                        <button className="mobile-menu-item" onClick={onSignIn}>
                            🔗 Connect Google Sheets
                        </button>
                    )}
                    <div className="mobile-menu-item mobile-menu-theme">
                        {/* Theme handled in sidebar on desktop, shown here on mobile */}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
