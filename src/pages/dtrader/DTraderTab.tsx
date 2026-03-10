import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { api_base } from '@/external/bot-skeleton';
import { observer } from 'mobx-react-lite';

const TRADER_SCRIPT_SRC = '/trader/js/trader.js';

function useTraderScript(): { ready: boolean; error: string | null } {
    const [ready, setReady] = useState(() => {
        return typeof window !== 'undefined' && !!(window as any)['@deriv/trader'];
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (ready) return;

        if (document.querySelector(`script[src="${TRADER_SCRIPT_SRC}"]`)) {
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
    }, [ready]);

    return { ready, error };
}

const DTraderTab = observer(() => {
    const root_store = useStore();
    const { client } = root_store;
    const { ready, error } = useTraderScript();
    const containerRef = useRef<HTMLDivElement>(null);
    const traderRootRef = useRef<any>(null);

    useEffect(() => {
        if (!ready || !client.is_logged_in || !containerRef.current) return;

        const traderModule = (window as any)['@deriv/trader'];
        if (!traderModule) return;

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

        const TraderApp = traderModule.default || traderModule;
        const traderReact = (window as any).__TRADER_REACT__ || React;
        const traderReactDOM = (window as any).__TRADER_REACT_DOM__;

        if (traderReactDOM && containerRef.current) {
            traderReactDOM.render(
                traderReact.createElement(TraderApp, { passthrough }),
                containerRef.current
            );
            traderRootRef.current = { unmount: () => traderReactDOM.unmountComponentAtNode(containerRef.current!) };
        } else {
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
    }, [ready, client.is_logged_in]);

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h3>⚠️ DTrader failed to load</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (!ready) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px' }}>
                <p>Loading DTrader...</p>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef} 
            style={{ 
                width: '100%', 
                height: 'calc(100vh - 120px)', // Adjust based on Profithub header/tab height
                overflow: 'hidden',
                background: 'var(--general-section-1)'
            }} 
        />
    );
});

export default DTraderTab;
