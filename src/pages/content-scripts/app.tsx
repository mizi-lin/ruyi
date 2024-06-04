import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import { FloatIcon } from './float-icon';
import { RuyiSearch } from './ruyi-search';

export function render() {
    const selector = 'ruyi-container';
    if (!document.querySelector(`#${selector}`)) {
        const container = document.createElement('article');
        container.id = selector;
        document.body.appendChild(container);
        const root = createRoot(container);
        root.render(
            <StrictMode>
                <RecoilRoot>
                    <Suspense fallback={<></>}>
                        <FloatIcon />
                    </Suspense>

                    <Suspense fallback={<></>}>
                        <RuyiSearch />
                    </Suspense>
                </RecoilRoot>
            </StrictMode>
        );
    }
}
