/**
 * Standalone routes that use the domain helper functions.
 * Uses template literals to compose URLs dynamically.
 */
export const standalone_routes = {
    account_settings: `${window.location.origin}/accounts`,
    bot: `${window.location.origin}`,
    cashier: `${window.location.origin}/cashier/`,
    cashier_deposit: `${window.location.origin}/cashier/deposit`,
    cashier_p2p: `${window.location.origin}/cashier/p2p`,
    contract: `${window.location.origin}/contract/:contract_id`,
    personal_details: `${window.location.origin}/account/personal-details`,
    positions: `${window.location.origin}/reports/positions`,
    profit: `${window.location.origin}/reports/profit`,
    reports: `${window.location.origin}/reports`,
    root: window.location.origin,
    smarttrader: window.location.origin,
    statement: `${window.location.origin}/reports/statement`,
    trade: `${window.location.origin}/dtrader`,
    traders_hub: window.location.origin,
    traders_hub_lowcode: window.location.origin,
    recent_transactions: `${window.location.origin}/tradershub/redirect?action=redirect_to&redirect_to=wallet`,
    wallets_transfer: `${window.location.origin}/wallet/account-transfer`,
    signup: `${window.location.origin}/signup`,
    deriv_com: window.location.origin,
    deriv_app: window.location.origin,
    endpoint: `${window.location.origin}/endpoint`,
    account_limits: `${window.location.origin}/account/account-limits`,
    help_center: `${window.location.origin}/help/`,
    responsible: `${window.location.origin}/responsible/`,
};
