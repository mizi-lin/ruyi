import { faviconURL, getFaviconUrl } from '@root/src/shared/bus';
import { DB, GetMap, GetSet, SettingDB, SettingDBKeys, TabDB, UrlDB, WindowDB } from '@root/src/db';
import { orderBy } from 'lodash-es';
import { reloadStore, topHistoryStore } from '../store';
import { WindowSetting } from '@root/src/constants';
import { atomFamily } from 'recoil';
import { toMap } from '@root/src/shared/utils';
import { asyncMap } from '@root/src/shared/utils/common';

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
        // Tabs
        const tabMap = await GetMap(TabDB, DB.TabDB.TabsMap);
        // Window
        const currentWindowId = await WindowDB.getItem(DB.WindowDB.CurrentId);

        let windows = [...all.entries()]
            .map(([windowId, tabIds]) => {
                const tabs = [...tabIds].map((tabId) => {
                    return tabMap.get(tabId) ?? { id: tabId };
                });
                const active = actives.has(windowId);
                const current = windowId === currentWindowId;

                if (!showHistoryWindows && !active) return void 0;
                if (!showActiveWindows && active) return void 0;

                return { windowId, tabs, active, current, title: current ? 'Current Window' : '' };
            })
            .filter(Boolean);

        // 按照状态进行排序
        windows = orderBy(windows, ['topHistory', 'current', 'active'], ['desc', 'desc', 'desc']);

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
