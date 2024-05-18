import { DB, ExtendMap, GetMap, TabDB, UpdateMap, UrlDB } from '@root/src/db';
import { toMap } from '../utils';
import { faviconURL } from './common';

/**
 * 判断空tab
 */
export function isEmptyTab(tab) {
    if (!tab) return true;
    const url = typeof tab === 'string' ? tab : tab?.url || tab.pendingUrl;
    return ['about:blank', 'chrome://newtab/', ''].includes(url);
}

/**
 * 除了空tab的标签页集合
 */
export async function getTabsWithoutEmpty(queryInfo: chrome.tabs.QueryInfo = {}) {
    const tabs = await chrome.tabs.query(queryInfo);
    return tabs.filter((tab) => !isEmptyTab(tab)).filter(Boolean);
}

/**
 * 更新tabs
 */
export const updateTabs = async (tabs) => {
    tabs = tabs ?? (await getTabsWithoutEmpty({}));
    const tabsMap = toMap(tabs, 'id');
    await ExtendMap(TabDB, DB.TabDB.TabsMap, tabsMap);
};

/**
 * 更新单个标签页信息
 */
export const updateTab = async (tabId, tab: chrome.tabs.Tab) => {
    if (!tab) {
        tab = await chrome.tabs.get(tabId);
        if (isEmptyTab(tab)) return;
    }

    tab.id = tabId;
    await UpdateMap(TabDB, DB.TabDB.TabsMap, tabId, tab);
};

export const getFaviconUrl = async (tab: chrome.tabs.Tab) => {
    const { id, favIconUrl, pendingUrl, url = pendingUrl } = tab;
    if (favIconUrl) return favIconUrl;
    if (!url) return;
    const { host, hostname = host } = new URL(url);
    const favicon = await GetMap(UrlDB, DB.UrlDB.URLOriginFaviconMap);
    if (favicon.get(hostname)) return favicon.get(hostname);
    return faviconURL(url);
};
