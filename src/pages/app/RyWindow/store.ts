import { DB, GetMap, GetSet, TabDB, WindowDB } from '@root/src/db';
import { orderBy } from 'lodash-es';
import { reloadStore } from '../store';
import { WindowSetting } from '@root/src/constants';
import { atomFamily } from 'recoil';
import { toMap } from '@root/src/shared/utils';

export const windowSettingAtom = atomFamily({
    key: 'ruyi/windows/setting',
    default: (key: WindowSetting) => {
        const settingMap = {
            [WindowSetting.showHistoryWindow]: true,
            [WindowSetting.showCurrentWindow]: true,
            [WindowSetting.showTopHistory]: true,
            [WindowSetting.onlyShowMatched]: false
        };
        return settingMap[key];
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
                return { windowId, tabs, active, current };
            })
            .filter(Boolean);

        // 按照状态进行排序
        windows = orderBy(windows, ['topHistory', 'current', 'active'], ['desc', 'desc', 'desc']);

        return { data: windows };
    }
});

export function tabMatcher(tab, search) {
    return [tab.title, tab.url, tab.pendingUrl].join(',').toLowerCase().includes(search.toLowerCase());
}

export const searchByWindowsStore = selector({
    key: 'ruyi/searchByWindowsStore',
    get: async ({ get }) => {
        const search = get(windowSearchAtom);
        const onlyMatched = get(windowSettingAtom(WindowSetting.onlyShowMatched));
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
