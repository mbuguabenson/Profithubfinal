import Cookies from 'js-cookie';

/**
 * Clears authentication data from local storage and reloads the page
 */
export const clearAuthData = (is_reload: boolean = true): void => {
    localStorage.removeItem('accountsList');
    localStorage.removeItem('clientAccounts');
    localStorage.removeItem('callback_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('active_loginid');
    localStorage.removeItem('client.accounts');
    localStorage.removeItem('client.country');
    sessionStorage.removeItem('query_param_currency');
    if (is_reload) {
        location.reload();
    }
};

/**
 * Handles OIDC authentication failure by clearing auth data and showing logged out view
 * @param error - The error that occurred during OIDC authentication
 */

export const handleOidcAuthFailure = (error: any) => {
    console.error('[OIDC] Authentication failure:', error);
    // Clear logged_state to prevent infinite authentication loops
    Cookies.set('logged_state', 'false');
    // Optionally clear other auth data
    localStorage.removeItem('accountsList');
    localStorage.removeItem('clientAccounts');
};

/**
 * Synchronizes Profithub's clientAccounts with DTrader's client.accounts
 */
export const syncStorage = (): void => {
    try {
        const clientAccounts = JSON.parse(localStorage.getItem('clientAccounts') || '{}');
        const activeLoginid = localStorage.getItem('active_loginid');

        if (Object.keys(clientAccounts).length > 0) {
            const dtraderAccounts: Record<string, any> = {};
            Object.keys(clientAccounts).forEach(loginid => {
                const acc = clientAccounts[loginid];
                dtraderAccounts[loginid] = {
                    token: acc.token || '',
                    currency: acc.currency || '',
                    loginid: acc.loginid || loginid,
                    is_virtual: (acc.loginid || loginid).startsWith('VR') ? 1 : 0,
                    landing_company_shortcode: acc.landing_company_name || acc.landing_company_shortcode || '',
                };
            });
            localStorage.setItem('client.accounts', JSON.stringify(dtraderAccounts));
        }

        if (activeLoginid) {
            localStorage.setItem('active_loginid', activeLoginid);
        }
    } catch (e) {
        console.error('[StorageSync] Failed to sync storage:', e);
    }
};
