import { DB, GetMap, WindowDB } from '@root/src/db';

export const getAppUrl = () => {
    return chrome.runtime.getURL('src/pages/app/index.html');
};

export const getAppTabId = async () => {
    const [tab] = await chrome.tabs.query({ url: getAppUrl() });
    return tab?.id;
};

export const sendMsgToApp = async (type: string, options: Record<string, any> = {}) => {
    const appTabId = await getAppTabId();
    if (appTabId) {
        chrome.tabs.sendMessage(appTabId, { type, ...options });
    }
};
