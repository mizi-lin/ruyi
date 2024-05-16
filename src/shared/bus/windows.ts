import { DB, GetMap, WindowDB } from '@root/src/db';
import { groupBy } from 'lodash-es';
import { getTabsWithoutEmpty } from './tabs';

/**
 * 更新 windows 相关的映射表
 */
export const updateWindow = async () => {
    const tabs = await getTabsWithoutEmpty();
    const windowIdTabsMap = groupBy(tabs, 'windowId');
    const activeWindowEntries: [number, Set<number>][] = Object.entries(windowIdTabsMap).map(([windowId, tabs]) => [
        +windowId,
        new Set(tabs.map(({ id }) => id))
    ]);

    // 更新 all windows map
    const allWindowsMap = await GetMap(WindowDB, DB.WindowDB.AllWindowTabsMap);
    const activeWindowSet = new Set();

    for await (const [windowId, tabIds] of activeWindowEntries) {
        activeWindowSet.add(windowId);
        allWindowsMap.set(windowId, tabIds);
    }

    await WindowDB.setItem(DB.WindowDB.ActiveWindowsSet, activeWindowSet);
    await WindowDB.setItem(DB.WindowDB.AllWindowTabsMap, allWindowsMap);

    // 更新 current windowId
    await updateCurrentWindowId();

    // 基于更新 windows urls, urls 是一个 set 的记录集
    const windowUrlsMap = await GetMap(WindowDB, DB.WindowDB.WindowURLsHistoryMap);
    for await (const tab of tabs) {
        const urlset = windowUrlsMap.get(tab.windowId) ?? new Set();
        urlset.add(tab.url);
        windowUrlsMap.set(tab.windowId, urlset);
    }
    await WindowDB.setItem(DB.WindowDB.WindowURLsHistoryMap, windowUrlsMap);
};

export async function updateCurrentWindowId() {
    const current = await chrome.windows.getCurrent();
    await WindowDB.setItem(DB.WindowDB.CurrentId, current.id);
}
