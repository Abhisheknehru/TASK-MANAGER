import { useState, useCallback } from 'react';
import { APPS_SCRIPT_CODE } from '../services/sheetsApi';
import './SetupWizard.css';

const TOTAL_STEPS = 3;

const SetupWizard = ({ onClose, onConnect }) => {
    const [step, setStep] = useState(1);
    const [scriptUrl, setScriptUrlInput] = useState('');
    const [testStatus, setTestStatus] = useState(null);
    const [testMessage, setTestMessage] = useState('');
    const [copiedScript, setCopiedScript] = useState(false);

    const copyScript = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
            setCopiedScript(true);
            setTimeout(() => setCopiedScript(false), 3000);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = APPS_SCRIPT_CODE;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopiedScript(true);
            setTimeout(() => setCopiedScript(false), 3000);
        }
    }, []);

    const handleTestConnection = useCallback(async () => {
        const url = scriptUrl.trim();
        if (!url) {
            setTestStatus('error');
            setTestMessage('Please paste your Web App URL first');
            return;
        }

        if (!url.startsWith('https://script.google.com/')) {
            setTestStatus('error');
            setTestMessage('URL must start with https://script.google.com/');
            return;
        }

        setTestStatus('loading');
        setTestMessage('Testing connection...');

        try {
            await onConnect(url);
            setTestStatus('success');
            setTestMessage('Connected successfully! Your tasks will now sync to Google Sheets.');
        } catch (e) {
            setTestStatus('error');
            setTestMessage(e.message || 'Connection failed. Check your URL and try again.');
        }
    }, [scriptUrl, onConnect]);

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <div className="wizard-step-title">
                            <span className="wizard-step-number">1</span>
                            Create a Google Sheet
                        </div>
                        <p className="wizard-step-desc">
                            Open Google Sheets and create a new blank spreadsheet. Name it anything you like (e.g., "My Tasks").
                        </p>
                        <a
                            href="https://sheets.new"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wizard-action-btn"
                        >
                            📊 Create New Google Sheet
                        </a>
                        <div className="wizard-tip">
                            <span className="tip-icon">💡</span>
                            <span>This opens a new Google Sheet in a new tab. Keep it open — you'll need it for the next step.</span>
                        </div>
                    </>
                );

            case 2:
                return (
                    <>
                        <div className="wizard-step-title">
                            <span className="wizard-step-number">2</span>
                            Add the Sync Script
                        </div>
                        <p className="wizard-step-desc">
                            In your new Google Sheet, follow these steps:
                        </p>
                        <ol className="wizard-instructions">
                            <li>Click <strong>Extensions → Apps Script</strong> in the menu bar</li>
                            <li>Delete any existing code in the editor</li>
                            <li>
                                Click the button below to copy our script, then paste it:
                                <button
                                    className={`wizard-copy-btn ${copiedScript ? 'copied' : ''}`}
                                    onClick={copyScript}
                                    style={{ marginTop: '8px', display: 'block' }}
                                >
                                    {copiedScript ? '✅ Copied! Now paste in Apps Script' : '📋 Copy Script to Clipboard'}
                                </button>
                            </li>
                            <li>Click the <strong>💾 Save</strong> button (or Ctrl+S)</li>
                            <li>Click <strong>Deploy → New deployment</strong></li>
                            <li>
                                Set <strong>Type</strong> = "Web app", <strong>Execute as</strong> = "Me", <strong>Who has access</strong> = "Anyone"
                            </li>
                            <li>Click <strong>Deploy</strong> and <strong>Authorize</strong> when prompted</li>
                            <li>Copy the <strong>Web App URL</strong> that appears</li>
                        </ol>

                        <div className="wizard-tip">
                            <span className="tip-icon">⚠️</span>
                            <span>When Google asks you to authorize, click "Advanced" → "Go to (project name)" → "Allow". This is safe — the script only accesses YOUR sheet.</span>
                        </div>
                    </>
                );

            case 3:
                return (
                    <>
                        <div className="wizard-step-title">
                            <span className="wizard-step-number">3</span>
                            Paste Your Web App URL
                        </div>
                        <p className="wizard-step-desc">
                            Paste the Web App URL you copied from the deployment:
                        </p>
                        <div className="wizard-input-group">
                            <input
                                type="url"
                                className="wizard-url-input"
                                placeholder="https://script.google.com/macros/s/your-script-id/exec"
                                value={scriptUrl}
                                onChange={(e) => {
                                    setScriptUrlInput(e.target.value);
                                    setTestStatus(null);
                                }}
                                autoFocus
                            />
                        </div>

                        <button
                            className={`wizard-connect-btn ${testStatus === 'loading' ? 'loading' : ''}`}
                            onClick={handleTestConnection}
                            disabled={testStatus === 'loading' || !scriptUrl.trim()}
                        >
                            {testStatus === 'loading' ? (
                                <><span className="wizard-spinner" /> Connecting...</>
                            ) : (
                                '🔗 Connect & Test'
                            )}
                        </button>

                        {testStatus && testStatus !== 'loading' && (
                            <div className={`wizard-test-result ${testStatus}`}>
                                {testStatus === 'success' ? '✅' : '❌'} {testMessage}
                            </div>
                        )}

                        {testStatus === 'success' && (
                            <div className="wizard-success-actions">
                                <p className="wizard-success-text">🎉 You're all set! Tasks will sync automatically.</p>
                            </div>
                        )}
                    </>
                );

            default:
                return null;
        }
    };

    const canProceed = () => {
        if (step === 3 && testStatus !== 'success') return false;
        return true;
    };

    return (
        <div className="wizard-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="wizard-modal">
                <div className="wizard-header">
                    <h3>📊 Connect Google Sheets</h3>
                    <button className="wizard-close" onClick={onClose}>✕</button>
                </div>

                {/* Progress bar */}
                <div className="wizard-progress">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                        <div
                            key={i}
                            className={`wizard-progress-step ${i + 1 === step ? 'active' : i + 1 < step ? 'completed' : ''}`}
                        >
                            <span className="progress-dot">{i + 1 < step ? '✓' : i + 1}</span>
                            <span className="progress-label">
                                {i === 0 ? 'Create Sheet' : i === 1 ? 'Add Script' : 'Connect'}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="wizard-body">
                    {renderStep()}
                </div>

                <div className="wizard-footer">
                    {step > 1 && (
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
                            onClick={() => setStep(s => s + 1)}
                        >
                            Next →
                        </button>
                    ) : (
                        testStatus === 'success' && (
                            <button
                                className="wizard-btn wizard-btn-next"
                                onClick={onClose}
                            >
                                Done ✓
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;
