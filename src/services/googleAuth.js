/* Google Auth Service using Google Identity Services */

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

// Users need to set their own Client ID from Google Cloud Console
// This is configured via environment variable or the settings modal
let CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

let tokenClient = null;
let isInitialized = false;

export const setClientId = (id) => {
    CLIENT_ID = id;
    localStorage.setItem('taskmanager_client_id', id);
};

export const getClientId = () => {
    if (!CLIENT_ID) {
        CLIENT_ID = localStorage.getItem('taskmanager_client_id') || '';
    }
    return CLIENT_ID;
};

export const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
        if (document.getElementById('google-gsi-script')) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

export const loadGapiScript = () => {
    return new Promise((resolve, reject) => {
        if (document.getElementById('gapi-script')) {
            if (window.gapi) {
                resolve();
            }
            return;
        }
        const script = document.createElement('script');
        script.id = 'gapi-script';
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            window.gapi.load('client', async () => {
                await window.gapi.client.init({});
                await window.gapi.client.load('sheets', 'v4');
                await window.gapi.client.load('drive', 'v3');
                resolve();
            });
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

export const initGoogleAuth = async () => {
    if (isInitialized) return;
    const clientId = getClientId();
    if (!clientId) return;

    try {
        await loadGoogleScript();
        await loadGapiScript();
        isInitialized = true;
    } catch (e) {
        console.error('Failed to load Google scripts:', e);
    }
};

export const signIn = () => {
    return new Promise((resolve, reject) => {
        const clientId = getClientId();
        if (!clientId) {
            reject(new Error('Google Client ID not configured. Please set it in Settings.'));
            return;
        }

        try {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: SCOPES,
                callback: (response) => {
                    if (response.error) {
                        reject(response);
                        return;
                    }
                    const tokenData = {
                        access_token: response.access_token,
                        expires_at: Date.now() + response.expires_in * 1000,
                    };
                    localStorage.setItem('taskmanager_google_token', JSON.stringify(tokenData));
                    window.gapi.client.setToken({ access_token: response.access_token });
                    resolve(tokenData);
                },
            });
            tokenClient.requestAccessToken();
        } catch (e) {
            reject(e);
        }
    });
};

export const signOut = () => {
    const tokenStr = localStorage.getItem('taskmanager_google_token');
    if (tokenStr) {
        const token = JSON.parse(tokenStr);
        if (token.access_token && window.google?.accounts?.oauth2) {
            window.google.accounts.oauth2.revoke(token.access_token);
        }
    }
    localStorage.removeItem('taskmanager_google_token');
    if (window.gapi?.client) {
        window.gapi.client.setToken(null);
    }
};

export const getAccessToken = () => {
    const tokenStr = localStorage.getItem('taskmanager_google_token');
    if (!tokenStr) return null;
    const token = JSON.parse(tokenStr);
    if (Date.now() > token.expires_at) {
        localStorage.removeItem('taskmanager_google_token');
        return null;
    }
    return token.access_token;
};

export const isSignedIn = () => {
    return !!getAccessToken();
};

export const restoreSession = async () => {
    const token = getAccessToken();
    if (token && window.gapi?.client) {
        window.gapi.client.setToken({ access_token: token });
        return true;
    }
    return false;
};
