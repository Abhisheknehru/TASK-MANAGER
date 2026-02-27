import { useState, useEffect } from 'react';
import './InstallPrompt.css';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            setIsInstalled(true);
            return;
        }

        // Check if dismissed recently (within 7 days)
        const dismissed = localStorage.getItem('taskflow_install_dismissed');
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);

        if (isIOSDevice) {
            // On iOS, show custom instructions after a delay
            const timer = setTimeout(() => setShowBanner(true), 3000);
            return () => clearTimeout(timer);
        }

        // Listen for the browser's install prompt
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show banner after a slight delay so user settles in first
            setTimeout(() => setShowBanner(true), 2000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // Listen for successful install
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowBanner(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstalled(true);
        }
        setDeferredPrompt(null);
        setShowBanner(false);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('taskflow_install_dismissed', String(Date.now()));
    };

    if (!showBanner || isInstalled) return null;

    return (
        <div className="install-banner">
            <img
                src="/pwa-192x192.png"
                alt="TaskFlow"
                className="install-banner-icon"
            />
            <div className="install-banner-content">
                <h4 className="install-banner-title">Install TaskFlow</h4>
                <p className="install-banner-subtitle">
                    {isIOS
                        ? 'Add to your home screen for the best experience'
                        : 'Get quick access & offline support'}
                </p>
                {isIOS && (
                    <div className="ios-install-steps">
                        <p><span className="step-emoji">1️⃣</span> Tap the Share button <strong>⎋</strong></p>
                        <p><span className="step-emoji">2️⃣</span> Scroll down & tap <strong>"Add to Home Screen"</strong></p>
                        <p><span className="step-emoji">3️⃣</span> Tap <strong>Add</strong></p>
                    </div>
                )}
            </div>
            <div className="install-banner-actions">
                {!isIOS && (
                    <button className="install-btn install-btn-primary" onClick={handleInstall}>
                        Install
                    </button>
                )}
                <button className="install-btn install-btn-dismiss" onClick={handleDismiss}>
                    {isIOS ? 'Got it' : 'Later'}
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
