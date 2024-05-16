import { DB, ExtendMap, TabDB, UpdateMap } from '@root/src/db';
import { toMap } from '../utils';

/**
 * 更新tabs
 */
export const updateTabs = async (windowId?: number) => {
    const tabs = await getTabsWithoutEmpty({ windowId });
    const tabsMap = new Map(Object.entries(toMap(tabs, 'id')));
    await ExtendMap(TabDB, DB.TabDB.TabsMap, tabsMap);
};

export const updateTab = async (tabId, tab: chrome.tabs.Tab) => {
    if (!tab) {
        tab = await chrome.tabs.get(tabId);
        if (isEmptyTab(tab)) return;
    }
    await UpdateMap(TabDB, DB.TabDB.TabsMap, tabId, tab);
};

export function isEmptyTab(tab) {
    if (!tab) return true;
    const url = typeof tab === 'string' ? tab : tab?.url;
    return ['about:blank', 'chrome://newtab/', ''].includes(url);
}

export async function getTabsWithoutEmpty(queryInfo: chrome.tabs.QueryInfo = {}) {
    const tabs = await chrome.tabs.query(queryInfo);
    return tabs.filter((tab) => !isEmptyTab(tab)).filter(Boolean);
}
