import { getFaviconUrl } from '@root/src/shared/bus';
import { DB, GetMap, GetSet, SettingDB, SettingDBKeys, WindowDB } from '@root/src/db';
import { orderBy } from 'lodash-es';
import { reloadStore, topHistoryStore } from '../store';
import { atomFamily } from 'recoil';
import { toMap } from '@root/src/shared/utils';
import { asyncMap } from '@root/src/shared/utils/common';
import { tabs$db } from '@root/src/DBStore';

export const windowSettingAtom = atomFamily({
    key: 'ruyi/windows/setting',
    default: async (key: SettingDBKeys) => {
        const value = await SettingDB.getItem(key);
        return value;
    },
    effects: (key) => [
        ({ onSet }) => {
            onSet(async (value) => {
                await SettingDB.setItem(key, value);
            });
        }
    ]
});

export const currentWindowIdStore = selector({
    key: 'ruyi/currentWindowIdStore',
    get: async ({ get }) => {
        get(reloadStore);
        const currentWindowId = await WindowDB.getItem(DB.WindowDB.CurrentId);
        return currentWindowId;
    }
});

export const windowSearchAtom = atom({
    key: 'ruyi/windowSearchAtom',
    default: ''
});

export const windowsStore = selector({
    key: 'ruyi/windows',
    get: async ({ get }) => {
        get(reloadStore);

        const { topOrigins, topPages, topUrls } = get(topHistoryStore);
        const showHistoryWindows = get(windowSettingAtom(SettingDBKeys.TabsShowHistoryWindows));
        const showActiveWindows = get(windowSettingAtom(SettingDBKeys.TabsShowActiveWindows));
        const showTopViewer = get(windowSettingAtom(SettingDBKeys.TabsShowTopViewer));

        // 所有窗口信息
        const all = await GetMap(WindowDB, DB.WindowDB.AllWindowTabsMap);
        // 当前活跃的窗口
        const actives = await GetSet(WindowDB, DB.WindowDB.ActiveWindowsSet);
        // Window
        const currentWindowId = await WindowDB.getItem(DB.WindowDB.CurrentId);

        let windows = await asyncMap([...all.entries()], async ([windowId, tabIds]) => {
            const tabs = await tabs$db.byIds([...tabIds], (item, key) => {
                return item ?? { id: key };
            });
            const active = actives.has(windowId);
            const current = windowId === currentWindowId;

            if (!showHistoryWindows && !active) return void 0;
            if (!showActiveWindows && active) return void 0;

            return { windowId, tabs, active, current, title: current ? 'Current Window' : '' };
        });

        // 按照状态进行排序
        windows = orderBy(windows.filter(Boolean), ['topHistory', 'current', 'active'], ['desc', 'desc', 'desc']);

        if (showTopViewer) {
            windows = [topUrls, topPages, topOrigins, ...windows];
        }

        windows = windows.filter(({ tabs }) => !!tabs.length);

        const data = await asyncMap(windows, async ({ tabs, ...rest }) => {
            return {
                ...rest,
                tabs: await asyncMap(tabs, async (tab) => {
                    const favIconUrl = await getFaviconUrl(tab);
                    return { ...tab, favIconUrl };
                })
            };
        });

        return { data };
    }
});

export function tabMatcher(tab, search) {
    return [tab.title, tab.url, tab.pendingUrl].join(',').toLowerCase().includes(search.toLowerCase());
}

export const searchByWindowsStore = selector({
    key: 'ruyi/searchByWindowsStore',
    get: async ({ get }) => {
        const search = get(windowSearchAtom);
        const onlyMatched = get(windowSettingAtom(SettingDBKeys.TabsOnlyMatched));
        const { data } = get(windowsStore);

        if (onlyMatched && search) {
            const data$ = data
                .filter(({ tabs, ...rest }) => {
                    if (onlyMatched && search) {
                        const tabs$ = tabs.filter((tab) => {
                            return tabMatcher(tab, search);
                        });
                        return tabs$?.length ? { ...rest, tabs: tabs$ } : void 0;
                    }
                })
                .filter(Boolean);

            return toMap(data$, 'windowId');
        }

        return toMap(data, 'windowId');
    }
});

export const windowsMatchedStore = selector({
    key: 'ruyi/windowsMatchedStore',
    get: ({ get }) => {
        const search = get(windowSearchAtom)?.toLowerCase();
        const windows = get(windowsStore);
        const tabs = windows.data.map(({ tabs }) => tabs).flat(Infinity);
        const matched = search
            ? tabs.filter((tab) => {
                  return tabMatcher(tab, search);
              })
            : [];

        return matched;
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

/**
 * 打开窗口
 */
export const useOpenWindow = () => {
    return useRecoilCallback(({ snapshot, refresh }) => async (windowInfo) => {
        await chrome.runtime.sendMessage({
            type: 'openWindow',
            options: windowInfo
        });
        refresh(windowsStore);
    });
};

/**
 * 打开标签页
 */
export const useOpenTab = () => {
    return useRecoilCallback(({ snapshot, refresh }) => async (options) => {
        await chrome.runtime.sendMessage({
            type: 'openTab',
            options
        });
        refresh(windowsStore);
    });
};

/**
 * 删除标签页
 */
export const useRemoveTab = () => {
    return useRecoilCallback(({ snapshot, refresh }) => async (options) => {
        await chrome.runtime.sendMessage({
            type: 'removeTab',
            options
        });
        refresh(windowsStore);
    });
};

/**
 * 固定标签页
 */
export const usePinnedTab = () => {
    return useRecoilCallback(({ snapshot, refresh }) => async (options) => {
        await chrome.runtime.sendMessage({
            type: 'pinnedTab',
            options
        });
        refresh(windowsStore);
    });
};

/**
 * 打开搜索匹配到的tab
 */
export const useOpenMatchedTabToNewWindow = () => {
    return useRecoilCallback(({ snapshot, refresh, reset }) => async (type: 'keepSource' | 'deleteSource') => {
        /**
         * type = 'keepSource' | 'deleteSource'
         * keepSource: 保留源标签
         * keepSource: 删除源标签
         */
        const matched = await snapshot.getPromise(windowsMatchedStore);
        await chrome.runtime.sendMessage({
            type: 'openWindow',
            options: { tabs: matched, type }
        });
        reset(windowSearchAtom);
        refresh(windowsStore);
    });
};

/**
 * 删除标签页集合
 */
export const useRemoveVariousTabs = () => {
    return useRecoilCallback(({ snapshot, reset, refresh }) => async () => {
        const matched = await snapshot.getPromise(windowsMatchedStore);
        await chrome.runtime.sendMessage({
            type: 'removeVariousTabs',
            options: { tabs: matched }
        });
        reset(windowSearchAtom);
        refresh(windowsStore);
    });
};
