import { asyncDebounce } from '@root/src/shared/utils';
export const getAppUrl = () => {
    return chrome.runtime.getURL('src/pages/app/index.html');
};

export const getAppTabId = async () => {
    const [tab] = await chrome.tabs.query({ url: getAppUrl() });
    return tab?.id;
};

export const sendMsgToAppFunc = async (type: string, options: Record<string, any> = {}) => {
    const appTabId = await getAppTabId();
    if (appTabId) {
        try {
            await chrome.tabs.sendMessage(appTabId, { type, ...options });
        } catch (e) {}
    }
};

export const sendMsgToApp = asyncDebounce(sendMsgToAppFunc, 1000);
