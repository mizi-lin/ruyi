import { DB, GetMap, WindowDB, GetSet, RemoveMap } from '@root/src/db';
import { getKeyByTabIds, getTabsWithoutEmpty } from './tabs';
import { groupBy, toMap } from '../utils';
import { DBStore, tabs$db, windows$db } from '@root/src/DBStore';

export function pickWindow(window: chrome.windows.Window) {
    const { id, incognito, type } = window;
    if (type !== 'normal') return {};
    return { id, incognito };
}

export async function isActiveWindowByChrome(windowId) {
    const windows = await chrome.windows.getAll({});
    return toMap(windows, 'id').has(windowId);
}

export async function updateWindows() {
    const windows = await chrome.windows.getAll({ populate: true });
    await windows$db.updateRows(windows, 'id', (item) => {
        const { id, incognito, type, tabs } = item;
        const tabIds = tabs.map((tab) => tab.id);
        if (type !== 'normal') return DBStore.Break;
        return { id, incognito, tabs: new Set(tabIds), active: true, lastAccessed: Date.now() };
    });
}

export async function cleanupDuplicateWindows() {
    const windows = await windows$db.getAll();
    // 删除 tabs.size = 0 的 window
    const zeroTabsWindows = windows.filter((item) => item.tabs.size === 0);
    await windows$db.removeRows(zeroTabsWindows, 'id');

    // 删除 tabs.url 重复的 window
    const windowsByUrlMap = new Map();
    const windowsToDelete = [];

    for await (const window of windows) {
        const { tabs } = window;
        const urlsKey = getKeyByTabIds(tabs, 'url');

        if (windowsByUrlMap.has(urlsKey)) {
            const prev = windowsByUrlMap.get(urlsKey);
            // 优化逻辑判断，以处理多个非活跃窗口的情况
            if (window.active && !prev.active) {
                windowsToDelete.push(prev.id);
            } else if (!window.active) {
                windowsToDelete.push(window.id);
            }
        } else {
            windowsByUrlMap.set(urlsKey, window);
        }
    }

    // 批量删除重复窗口
    await windows$db.removeRows(windowsToDelete, 'id');
}

/**
 * 更新 windows 相关的映射表
 */
// export const updateWindow = async () => {
//     const tabs = await getTabsWithoutEmpty();
//     const windowIdTabsMap = groupBy(tabs, 'windowId');
//     const activeWindowEntries: [number, Set<number>][] = Object.entries(windowIdTabsMap).map(([windowId, tabs]) => [
//         +windowId,
//         new Set(tabs.map(({ id }) => id))
//     ]);

//     // 更新 all windows map
//     const allWindowsMap = await GetMap(WindowDB, DB.WindowDB.AllWindowTabsMap);
//     const activeWindowSet = new Set();

//     for await (const [windowId, tabIds] of activeWindowEntries) {
//         activeWindowSet.add(windowId);
//         allWindowsMap.set(windowId, tabIds);
//     }

//     await WindowDB.setItem(DB.WindowDB.ActiveWindowsSet, activeWindowSet);
//     await WindowDB.setItem(DB.WindowDB.AllWindowTabsMap, allWindowsMap);

//     // 更新 current windowId
//     await updateCurrentWindowId();

//     // 基于更新 windows urls, urls 是一个 set 的记录集
//     const windowUrlsMap = await GetMap(WindowDB, DB.WindowDB.WindowURLsHistoryMap);
//     for await (const tab of tabs) {
//         const urlset = windowUrlsMap.get(tab.windowId) ?? new Set();
//         urlset.add(tab.url);
//         windowUrlsMap.set(tab.windowId, urlset);
//     }
//     await WindowDB.setItem(DB.WindowDB.WindowURLsHistoryMap, windowUrlsMap);
// };

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
// export async function cleanupDuplicateHistoryWindows() {
//     const actives = await GetSet(WindowDB, DB.WindowDB.ActiveWindowsSet);
//     const historiesMap = await GetMap(WindowDB, DB.WindowDB.AllWindowTabsMap);
//     const histories = Array.from(historiesMap);
//     const uniqMap = new Map();
//     const uniqWindowIds = [];
//     for await (const [windowId, tabIds] of histories) {
//         const tabs = await tabs$db.byIds(tabIds);
//         const urlkey = tabs
//             .map((item) => item?.url)
//             .sort()
//             .join(',');
//         if (uniqMap.has(urlkey)) {
//             uniqWindowIds.push(actives.has(windowId) ? uniqMap.get(urlkey) : windowId);
//             uniqMap.set(urlkey, actives.has(windowId) ? windowId : uniqMap.get(urlkey));
//         } else {
//             uniqMap.set(urlkey, windowId);
//         }
//     }

//     if (uniqWindowIds?.length) {
//         for await (const windowId of uniqWindowIds) {
//             await RemoveMap(WindowDB, DB.WindowDB.AllWindowTabsMap, windowId);
//         }
//     }
// }
