import { DB, GetMap, GetSet, RemoveMap, TabDB, WindowDB } from '@root/src/db';
import { difference, orderBy } from 'lodash-es';
import { reloadStore } from '../store';

export const windowsStore = selector({
    key: 'ruyi/windows',
    get: async ({ get }) => {
        get(reloadStore);

        // 所有窗口信息
        const all = await GetMap(WindowDB, DB.WindowDB.AllWindowTabsMap);
        // 当前活跃的窗口
        const actives = await GetSet(WindowDB, DB.WindowDB.ActiveWindowsSet);
        // Tabs
        const tabMap = await GetMap(TabDB, DB.TabDB.TabsMap);
        // Window
        const currentWindowId = await WindowDB.getItem(DB.WindowDB.CurrentId);

        let windows = [...all.entries()].map(([windowId, tabIds]) => {
            const tabs = [...tabIds].map((tabId) => {
                return tabMap.get(tabId) ?? { id: tabId };
            });
            const active = actives.has(windowId);
            const current = windowId === currentWindowId;
            return { windowId, tabs, active, current };
        });

        // 按照状态进行排序
        windows = orderBy(windows, ['topHistory', 'current', 'active'], ['desc', 'desc', 'desc']);

        return { data: windows };
    }
});

/**
 * 删除视窗
 */
export const useRemoveWindow = () => {
    return useRecoilCallback(({ snapshot, refresh }) => async (windowInfo) => {
        await chrome.runtime.sendMessage({
            type: 'removeWindow',
            options: windowInfo
        });
        refresh(windowsStore);
    });
};

/**
 * 移动tab
 */
export const useMoveTab = () => {
    return useRecoilCallback(({ snapshot, refresh }) => async ({ sourceWindowId, targetWindowId, tabId, index }) => {
        await chrome.runtime.sendMessage({
            type: 'moveTab',
            options: { sourceWindowId, targetWindowId, tabId, index }
        });
        refresh(windowsStore);
    });
};

export const useOpenWindow = () => {
    return useRecoilCallback(({ snapshot, refresh }) => async (windowInfo) => {
        await chrome.runtime.sendMessage({
            type: 'openWindow',
            options: windowInfo
        });
        refresh(windowsStore);
    });
};

export const useOpenTab = () => {
    return useRecoilCallback(({ snapshot, refresh }) => async (options) => {
        await chrome.runtime.sendMessage({
            type: 'openTab',
            options
        });
        refresh(windowsStore);
    });
};

export const useRemoveTab = () => {
    return useRecoilCallback(({ snapshot, refresh }) => async (options) => {
        await chrome.runtime.sendMessage({
            type: 'removeTab',
            options
        });
        refresh(windowsStore);
    });
};
