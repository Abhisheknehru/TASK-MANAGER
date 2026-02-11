import { useState } from 'react';
import { setClientId, getClientId } from '../services/googleAuth';
import './SettingsModal.css';

const SettingsModal = ({ settings, onSaveSettings, onClose }) => {
    const [dailyGoal, setDailyGoal] = useState(settings.dailyGoal || 5);
    const [weeklyGoal, setWeeklyGoal] = useState(settings.weeklyGoal || 25);
    const [clientId, setClientIdState] = useState(getClientId());

    const handleSave = () => {
        if (clientId.trim()) {
            setClientId(clientId.trim());
        }
        onSaveSettings({ dailyGoal: Number(dailyGoal), weeklyGoal: Number(weeklyGoal) });
        onClose();
    };

    return (
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
                        <h4>Google Sheets API</h4>
                        <p className="settings-hint">
                            To sync with Google Sheets, create a Google Cloud project and add an OAuth 2.0 Client ID.
                            Set the authorized JavaScript origin to your app's URL.
                        </p>
                        <div className="form-group">
                            <label className="form-label">OAuth Client ID</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="your-client-id.apps.googleusercontent.com"
                                value={clientId}
                                onChange={(e) => setClientIdState(e.target.value)}
                            />
                        </div>
                        <div className="setup-steps">
                            <p className="setup-step">1. Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener">Google Cloud Console</a></p>
                            <p className="setup-step">2. Create a project → Enable "Google Sheets API" & "Google Drive API"</p>
                            <p className="setup-step">3. Create OAuth 2.0 credentials (Web application type)</p>
                            <p className="setup-step">4. Add <code>{window.location.origin}</code> as authorized JavaScript origin</p>
                            <p className="setup-step">5. Paste the Client ID above</p>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
