import { GOOGLE_CLIENT_ID, SCOPES } from '../config';

let tokenClient: any | null = null;
let gapiInited = false;
let gisInited = false;

const STORAGE_KEY = 'meowlog_google_token';
const STORAGE_EXPIRY_KEY = 'meowlog_google_token_expiry';

// --- Token Persistence ---

// Use any for TokenResponse to avoid declaration issues
const saveStoredToken = (token: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(token));
    // Calculate absolute expiry time (now + expires_in seconds - 5 minutes buffer)
    const expiryTime = Date.now() + (Number(token.expires_in) * 1000) - (5 * 60 * 1000);
    localStorage.setItem(STORAGE_EXPIRY_KEY, expiryTime.toString());
};

const getStoredToken = (): any | null => {
    const tokenStr = localStorage.getItem(STORAGE_KEY);
    const expiryStr = localStorage.getItem(STORAGE_EXPIRY_KEY);

    if (!tokenStr || !expiryStr) return null;

    if (Date.now() > Number(expiryStr)) {
        // Expired
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRY_KEY);
        return null;
    }

    try {
        return JSON.parse(tokenStr);
    } catch {
        return null;
    }
};

const clearStoredToken = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
};


export const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Load GAPI
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;

        const onGapiLoad = () => {
            window.gapi.load('client', async () => {
                await window.gapi.client.init({
                    // apiKey: API_KEY, // Optional if we only use Drive API with Access Token
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                });
                gapiInited = true;
                if (gisInited) resolve();
            });
        };

        script.onload = onGapiLoad;
        script.onerror = reject;
        document.body.appendChild(script);

        // Load GIS
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.async = true;
        gisScript.defer = true;

        const onGisLoad = () => {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: SCOPES,
                callback: '', // defined at request time
            });
            gisInited = true;
            if (gapiInited) resolve();
        };

        gisScript.onload = onGisLoad;
        gisScript.onerror = reject;
        document.body.appendChild(gisScript);
    });
};

export const tryAutoLogin = async (): Promise<boolean> => {
    // Wait slightly to ensure GAPI is loaded if called immediately after loadGoogleScript resolves (it should resolve when fully ready, but gapi client init is async inside)
    // Actually loadGoogleScript promise resolves after gapi.client.init awaits.

    // Check local storage
    const token = getStoredToken();
    if (token && gapiInited) {
        window.gapi.client.setToken(token);
        return true;
    }
    return false;
};

export const handleAuthClick = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error("Google Identity Services not initialized"));
            return;
        }

        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                reject(resp);
            }
            // Save token
            saveStoredToken(resp);
            resolve();
        };

        if (window.gapi.client.getToken() === null) {
            // Prompt the user to select a Google Account and ask for consent to share their data
            // when establishing a new session.
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            // Skip display of account chooser and consent dialog for an existing session.
            tokenClient.requestAccessToken({ prompt: '' });
        }
    });
};

export const signOut = () => {
    const token = window.gapi.client.getToken();
    clearStoredToken(); // Clear local persistence
    if (token !== null) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {
            window.gapi.client.setToken(null);
            // Callback
        });
    } else {
        window.gapi.client.setToken(null);
    }
};

export const getAccessToken = () => {
    return window.gapi.client.getToken();
}
