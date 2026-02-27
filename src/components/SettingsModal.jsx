import { useState } from 'react';
import { getClientId } from '../services/googleAuth';
import { getSpreadsheetUrl } from '../services/sheetsApi';
import SetupWizard from './SetupWizard';
import './SettingsModal.css';

const SettingsModal = ({ settings, onSaveSettings, onClose, isAuthenticated, onSignOut }) => {
    const [dailyGoal, setDailyGoal] = useState(settings.dailyGoal || 5);
    const [weeklyGoal, setWeeklyGoal] = useState(settings.weeklyGoal || 25);
    const [showWizard, setShowWizard] = useState(false);

    const handleSave = () => {
        onSaveSettings({ dailyGoal: Number(dailyGoal), weeklyGoal: Number(weeklyGoal) });
        onClose();
    };

    const sheetUrl = getSpreadsheetUrl();
    const hasClientId = !!getClientId();

    return (
        <>
            <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="modal animate-scale-in">
                    <div className="modal-header">
                        <h3>⚙️ Settings</h3>
                        <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                    </div>
                    <div className="modal-body">
                        <div className="settings-section">
                            <h4>Goals</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Daily Goal (tasks)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={dailyGoal}
                                        onChange={(e) => setDailyGoal(e.target.value)}
                                        min="1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Weekly Goal (tasks)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={weeklyGoal}
                                        onChange={(e) => setWeeklyGoal(e.target.value)}
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="settings-section">
                            <h4>Google Sheets Integration</h4>
                            <div className="google-status-card">
                                <div className="google-status-indicator">
                                    <span className={`status-dot ${isAuthenticated ? 'connected' : 'disconnected'}`} />
                                    <span className="status-text">
                                        {isAuthenticated ? 'Connected' : hasClientId ? 'Not signed in' : 'Not set up'}
                                    </span>
                                </div>

                                {isAuthenticated && sheetUrl && (
                                    <a
                                        href={sheetUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="open-sheet-link"
                                    >
                                        📊 Open My Google Sheet
                                    </a>
                                )}

                                <div className="google-actions">
                                    {!isAuthenticated && (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => setShowWizard(true)}
                                        >
                                            {hasClientId ? '🔧 Reconfigure' : '🚀 Setup Google Sheets'}
                                        </button>
                                    )}
                                    {isAuthenticated && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={onSignOut}
                                        >
                                            Disconnect
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
                    </div>
                </div>
            </div>

            {showWizard && (
                <SetupWizard
                    onClose={() => setShowWizard(false)}
                    onConnected={() => {
                        setShowWizard(false);
                    }}
                />
            )}
        </>
    );
};

export default SettingsModal;
