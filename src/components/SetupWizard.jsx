import { useState, useCallback } from 'react';
import { setClientId, getClientId, loadGoogleScript, loadGapiScript } from '../services/googleAuth';
import './SetupWizard.css';

const TOTAL_STEPS = 5;

const SetupWizard = ({ onClose, onConnected }) => {
    const [step, setStep] = useState(1);
    const [clientId, setClientIdInput] = useState(getClientId());
    const [testStatus, setTestStatus] = useState(null); // 'loading' | 'success' | 'error'
    const [testMessage, setTestMessage] = useState('');
    const [copiedField, setCopiedField] = useState(null);

    const copyToClipboard = useCallback(async (text, field) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            // Fallback for insecure contexts
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        }
    }, []);

    const handleTestConnection = useCallback(async () => {
        if (!clientId.trim()) {
            setTestStatus('error');
            setTestMessage('Please paste your Client ID first');
            return;
        }

        setTestStatus('loading');
        setTestMessage('Testing connection...');

        try {
            // Save the Client ID
            setClientId(clientId.trim());

            // Try loading Google scripts
            await loadGoogleScript();
            await loadGapiScript();

            // Try initializing token client
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId.trim(),
                scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
                callback: (response) => {
                    if (response.error) {
                        setTestStatus('error');
                        setTestMessage(`Auth failed: ${response.error}. Check your Client ID and authorized origins.`);
                    } else {
                        window.gapi.client.setToken({ access_token: response.access_token });
                        localStorage.setItem('taskmanager_google_token', JSON.stringify({
                            access_token: response.access_token,
                            expires_at: Date.now() + response.expires_in * 1000,
                        }));
                        setTestStatus('success');
                        setTestMessage('Connected successfully! Your Google account is linked.');
                        if (onConnected) onConnected();
                    }
                },
            });

            tokenClient.requestAccessToken();
        } catch (e) {
            setTestStatus('error');
            setTestMessage(`Failed to connect: ${e.message || 'Unknown error'}. Make sure your Client ID is correct.`);
        }
    }, [clientId, onConnected]);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <div className="wizard-step-title">
                            <span className="wizard-step-number">1</span>
                            Create a Google Cloud Project
                        </div>
                        <p className="wizard-step-desc">
                            This lets your app talk to Google Sheets. It's free and takes ~2 minutes.
                        </p>
                        <ol className="wizard-instructions">
                            <li data-step="a">
                                Open <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener">Google Cloud Console</a> (sign in with your Google account)
                            </li>
                            <li data-step="b">
                                Enter a <strong>Project Name</strong> (e.g., "My TaskFlow") and click <strong>Create</strong>
                            </li>
                            <li data-step="c">
                                Wait for the project to be created (a few seconds), then make sure it's selected in the top navbar
                            </li>
                        </ol>
                    </>
                );

            case 2:
                return (
                    <>
                        <div className="wizard-step-title">
                            <span className="wizard-step-number">2</span>
                            Enable Required APIs
                        </div>
                        <p className="wizard-step-desc">
                            Enable these two APIs so your app can create and read Google Sheets:
                        </p>
                        <ol className="wizard-instructions">
                            <li data-step="a">
                                Click this link to enable <a href="https://console.cloud.google.com/apis/library/sheets.googleapis.com" target="_blank" rel="noopener"><strong>Google Sheets API</strong></a>, then click <strong>Enable</strong>
                            </li>
                            <li data-step="b">
                                Click this link to enable <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" rel="noopener"><strong>Google Drive API</strong></a>, then click <strong>Enable</strong>
                            </li>
                        </ol>
                    </>
                );

            case 3:
                return (
                    <>
                        <div className="wizard-step-title">
                            <span className="wizard-step-number">3</span>
                            Create OAuth Credentials
                        </div>
                        <p className="wizard-step-desc">
                            This gives your app permission to access your Google account:
                        </p>
                        <ol className="wizard-instructions">
                            <li data-step="a">
                                Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener"><strong>Credentials page</strong></a>
                            </li>
                            <li data-step="b">
                                Click <strong>+ CREATE CREDENTIALS</strong> → <strong>OAuth client ID</strong>
                            </li>
                            <li data-step="c">
                                If asked to configure OAuth consent screen, select <strong>External</strong>, fill in app name, your email, and save
                            </li>
                            <li data-step="d">
                                Choose <strong>Web application</strong> type
                            </li>
                            <li data-step="e">
                                Under <strong>"Authorized JavaScript origins"</strong>, add this URL:
                            </li>
                        </ol>
                        <div className="wizard-copy-box">
                            <span className="wizard-copy-text">{origin}</span>
                            <button
                                className={`wizard-copy-btn ${copiedField === 'origin' ? 'copied' : ''}`}
                                onClick={() => copyToClipboard(origin, 'origin')}
                            >
                                {copiedField === 'origin' ? '✓ Copied' : 'Copy'}
                            </button>
                        </div>
                        <ol className="wizard-instructions" start="6">
                            <li data-step="f">
                                Click <strong>Create</strong> — your Client ID will appear
                            </li>
                        </ol>
                    </>
                );

            case 4:
                return (
                    <>
                        <div className="wizard-step-title">
                            <span className="wizard-step-number">4</span>
                            Paste Your Client ID
                        </div>
                        <p className="wizard-step-desc">
                            Copy the Client ID from the credentials page and paste it below:
                        </p>
                        <div className="wizard-input-group">
                            <label>OAuth Client ID</label>
                            <input
                                type="text"
                                placeholder="123456789-abcdef.apps.googleusercontent.com"
                                value={clientId}
                                onChange={(e) => {
                                    setClientIdInput(e.target.value);
                                    setTestStatus(null);
                                }}
                                autoFocus
                            />
                        </div>
                    </>
                );

            case 5:
                return testStatus === 'success' ? (
                    <div className="wizard-success">
                        <div className="wizard-success-icon">✅</div>
                        <h4>You're All Set!</h4>
                        <p>Your tasks will now sync to Google Sheets automatically.</p>
                        {getSheetUrl() && (
                            <a
                                href={getSheetUrl()}
                                target="_blank"
                                rel="noopener"
                                className="wizard-open-sheet"
                            >
                                📊 Open Your Google Sheet
                            </a>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="wizard-step-title">
                            <span className="wizard-step-number">5</span>
                            Test Your Connection
                        </div>
                        <p className="wizard-step-desc">
                            Let's make sure everything works. Click the button below to sign in with Google and verify the connection.
                        </p>
                        <div style={{ textAlign: 'center', margin: '20px 0' }}>
                            <button
                                className="wizard-btn wizard-btn-test"
                                onClick={handleTestConnection}
                                disabled={testStatus === 'loading' || !clientId.trim()}
                            >
                                {testStatus === 'loading' ? (
                                    <><span className="wizard-spinner" /> Connecting...</>
                                ) : (
                                    '🔗 Connect Google Account'
                                )}
                            </button>
                        </div>
                        {testStatus && testStatus !== 'loading' && (
                            <div className={`wizard-test-result ${testStatus}`}>
                                {testStatus === 'success' ? '✅' : '❌'} {testMessage}
                            </div>
                        )}
                    </>
                );

            default:
                return null;
        }
    };

    const getSheetUrl = () => {
        const sheetId = localStorage.getItem('taskmanager_sheet_id');
        if (!sheetId) return null;
        try {
            const id = JSON.parse(sheetId);
            return `https://docs.google.com/spreadsheets/d/${id}`;
        } catch {
            return null;
        }
    };

    const canProceed = () => {
        if (step === 4 && !clientId.trim()) return false;
        if (step === 5 && testStatus !== 'success') return false;
        return true;
    };

    return (
        <div className="wizard-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="wizard-modal">
                <div className="wizard-header">
                    <h3>🔧 Setup Google Sheets</h3>
                    <button className="wizard-close" onClick={onClose}>✕</button>
                </div>

                {/* Progress bar */}
                <div className="wizard-progress">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                        <div
                            key={i}
                            className={`wizard-progress-step ${i + 1 === step ? 'active' : i + 1 < step ? 'completed' : ''
                                }`}
                        />
                    ))}
                </div>

                <div className="wizard-body">
                    {renderStep()}
                </div>

                <div className="wizard-footer">
                    {step > 1 && step !== 5 && (
                        <button
                            className="wizard-btn wizard-btn-back"
                            onClick={() => setStep(s => s - 1)}
                        >
                            ← Back
                        </button>
                    )}
                    {step < TOTAL_STEPS ? (
                        <button
                            className="wizard-btn wizard-btn-next"
                            onClick={() => {
                                if (step === 4 && clientId.trim()) {
                                    setClientId(clientId.trim());
                                }
                                setStep(s => s + 1);
                            }}
                            disabled={!canProceed()}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            className="wizard-btn wizard-btn-next"
                            onClick={onClose}
                            style={testStatus === 'success' ? {} : { display: 'none' }}
                        >
                            Done ✓
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;
