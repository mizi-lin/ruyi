import { ComponentType, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { RecoilRoot, RecoilEnv } from 'recoil';
import RecoilNexus from 'recoil-nexus';
import { ClickToComponent } from 'click-to-react-component';
import { beforeInit } from '@root/src/before-init';

RecoilEnv.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED = false;

export function render(App: ComponentType) {
    const container = document.getElementById('ruyi-container') as HTMLElement;
    const root = createRoot(container);
    beforeInit();
    root.render(
        <StrictMode>
            <RecoilRoot>
                <RecoilNexus />
                <HelmetProvider>
                    <App />
                </HelmetProvider>
            </RecoilRoot>
            {!import.meta.env.PROD && <ClickToComponent editor="vscode" />}
        </StrictMode>
    );
}
