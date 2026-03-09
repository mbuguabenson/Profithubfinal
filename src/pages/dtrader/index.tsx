import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { api_base } from '@/external/bot-skeleton';
import { generateOAuthURL } from '@/components/shared';
import { observer } from 'mobx-react-lite';

// The pre-built trader.js is a UMD bundle. Loading it via script tag
// keeps its bundled React Router v5 completely isolated from Profithub's RR v7.
const TRADER_SCRIPT_SRC = '/trader/js/trader.js';

function useTraderScript(): { ready: boolean; error: string | null } {
    const [ready, setReady] = useState(() => {
        // Check if already loaded (e.g. HMR / fast refresh)
        return typeof window !== 'undefined' && !!(window as any)['@deriv/trader'];
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (ready) return;

        // Avoid injecting the same script twice
        if (document.querySelector(`script[src="${TRADER_SCRIPT_SRC}"]`)) {
            // Script tag exists but module not ready yet – wait for its load event
            const existingScript = document.querySelector(`script[src="${TRADER_SCRIPT_SRC}"]`) as HTMLScriptElement;
            const onLoad = () => setReady(true);
            const onError = () => setError('Failed to load trader.js');
            existingScript.addEventListener('load', onLoad);
            existingScript.addEventListener('error', onError);
            return () => {
                existingScript.removeEventListener('load', onLoad);
                existingScript.removeEventListener('error', onError);
            };
        }

        const script = document.createElement('script');
        script.src = TRADER_SCRIPT_SRC;
        script.async = true;
        script.onload = () => setReady(true);
        script.onerror = () => setError('Failed to load DTrader bundle. Make sure trader.js is built.');
        document.head.appendChild(script);

        return () => {
            // Do NOT remove the script on unmount – keep it cached for re-entry
        };
    }, [ready]);

    return { ready, error };
}

const DTraderPage = observer(() => {
    const root_store = useStore();
    const { client } = root_store;
    const { ready, error } = useTraderScript();
    const containerRef = useRef<HTMLDivElement>(null);
    const traderRootRef = useRef<any>(null);

    // Auth guard
    useEffect(() => {
        if (!client.is_logged_in && !client.is_logging_in) {
            window.location.assign(generateOAuthURL());
        }
    }, [client.is_logged_in, client.is_logging_in]);

    // Mount DTrader into its container using ReactDOM.render from the DTrader bundle's React
    // so it uses DTrader's own React instance (and its own React Router v5)
    useEffect(() => {
        if (!ready || !client.is_logged_in || !containerRef.current) return;

        const traderModule = (window as any)['@deriv/trader'];
        if (!traderModule) return;

        // Build the passthrough store required by DTrader (TCoreStores interface)
        const common_store = (root_store as any).common || {};
        const ui_store = (root_store as any).ui || {};
        const modules_store = (root_store as any).modules || {};

        const passthrough_store = {
            ...root_store,
            common: {
                ...common_store,
                network_status: common_store.network_status || { tooltip: 'Online', class: 'online' },
            },
            ui: {
                ...ui_store,
                is_mobile: ui_store.is_mobile || false,
                is_desktop: ui_store.is_desktop ?? true,
                populateHeaderExtensions: ui_store.populateHeaderExtensions || (() => {}),
                populateSettingsExtensions: ui_store.populateSettingsExtensions || (() => {}),
                populateFooterExtensions: ui_store.populateFooterExtensions || (() => {}),
            },
            portfolio: (root_store as any).portfolio || {
                active_positions_count: 0,
                onMount: () => {},
                onUnmount: () => {},
            },
            modules: {
                ...modules_store,
                cashier: modules_store.cashier || {
                    general_store: {
                        is_crypto: false,
                        onMountCommon: () => {},
                        setAccountSwitchListener: () => {},
                    },
                },
            },
        };

        const passthrough = {
            root_store: passthrough_store,
            WS: api_base.api,
        };

        // DTrader's UMD bundle exposes its own React + ReactDOM on its module.
        // Use the trader bundle's internal React to render, so both React Router
        // instances stay completely isolated.
        const TraderApp = traderModule.default || traderModule;
        const traderReact = (window as any).__TRADER_REACT__ || React;
        const traderReactDOM = (window as any).__TRADER_REACT_DOM__;

        if (traderReactDOM && containerRef.current) {
            // Use DTrader bundle's own ReactDOM.render (React 17 style) if available
            traderReactDOM.render(
                traderReact.createElement(TraderApp, { passthrough }),
                containerRef.current
            );
            traderRootRef.current = { unmount: () => traderReactDOM.unmountComponentAtNode(containerRef.current!) };
        } else {
            // Fallback: render via shared React (both are React 18 – still isolated router contexts)
            const ReactDOM = (window as any).ReactDOM || require('react-dom');
            ReactDOM.render(
                React.createElement(TraderApp, { passthrough }),
                containerRef.current
            );
            traderRootRef.current = { unmount: () => ReactDOM.unmountComponentAtNode(containerRef.current!) };
        }

        return () => {
            traderRootRef.current?.unmount();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, client.is_logged_in]);

    if (!client.is_logged_in) return null;

    if (error) {
        return (
            <div
                style={{
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '16px',
                    background: '#0E0E0E',
                    color: '#fff',
                    fontFamily: 'Inter, sans-serif',
                }}
            >
                <h2 style={{ margin: 0 }}>⚠️ DTrader failed to load</h2>
                <p style={{ margin: 0, opacity: 0.6, fontSize: '14px' }}>{error}</p>
                <p style={{ margin: 0, opacity: 0.4, fontSize: '12px' }}>
                    Run <code>npm run build</code> in <code>packages/trader</code> to generate trader.js
                </p>
            </div>
        );
    }

    if (!ready) {
        return (
            <div
                style={{
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0E0E0E',
                    color: '#fff',
                    fontFamily: 'Inter, sans-serif',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid rgba(255,255,255,0.1)',
                            borderTop: '3px solid #FF444F',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 16px',
                        }}
                    />
                    <p style={{ margin: 0, opacity: 0.6 }}>Loading DTrader…</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
        />
    );
});

export default DTraderPage;
