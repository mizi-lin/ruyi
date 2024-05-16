import { DB, GetMap, WindowDB, GetSet, TabDB, RemoveMap } from '@root/src/db';
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

/**
 * 当浏览器重启或遇到以外的时候
 * 会关闭所有的窗口然后重启
 * 这样会额外的造就许多重复的历史窗口
 * 所以这里需要清理这种情况
 */
export async function cleanupDuplicateHistoryWindows() {
    const actives = await GetSet(WindowDB, DB.WindowDB.ActiveWindowsSet);
    const historiesMap = await GetMap(WindowDB, DB.WindowDB.AllWindowTabsMap);
    const tabMap = await GetMap(TabDB, DB.TabDB.TabsMap);
    const histories = Array.from(historiesMap);
    const uniqMap = new Map();
    const uniqWindowIds = [];
    for (const [windowId, tabIds] of histories) {
        const urlkey = [...tabIds]
            .map((id) => tabMap.get(id)?.url)
            .sort()
            .join(',');
        if (uniqMap.has(urlkey)) {
            uniqWindowIds.push(actives.has(windowId) ? uniqMap.get(urlkey) : windowId);
            uniqMap.set(urlkey, actives.has(windowId) ? windowId : uniqMap.get(urlkey));
        } else {
            uniqMap.set(urlkey, windowId);
        }
    }

    if (uniqWindowIds?.length) {
        for await (const windowId of uniqWindowIds) {
            await RemoveMap(WindowDB, DB.WindowDB.AllWindowTabsMap, windowId);
        }
    }
}
