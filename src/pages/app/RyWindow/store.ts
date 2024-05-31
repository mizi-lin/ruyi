import { getFaviconUrl } from '@root/src/shared/bus';
import { DB, SettingDB, SettingDBKeys, WindowDB } from '@root/src/db';
import { orderBy } from 'lodash-es';
import { reloadStore } from '../store';
import { toMap } from '@root/src/shared/utils';
import { asyncMap } from '@root/src/shared/utils/common';
import { tabGroups$db, tabs$db, windows$db } from '@root/src/DBStore';
import { atomFamily } from 'recoil';
import { topHistoryStore } from '../RyHistory/store';

export function tabMatcher(tab, search) {
    return [tab.title, tab.url, tab.pendingUrl].join(',').toLowerCase().includes(search.toLowerCase());
}

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
        try {
            const showHistoryWindows = get(windowSettingAtom(SettingDBKeys.TabsShowHistoryWindows));
            const showActiveWindows = get(windowSettingAtom(SettingDBKeys.TabsShowActiveWindows));
            const showTopViewer = get(windowSettingAtom(SettingDBKeys.TabsShowTopViewer));
            const { topOrigins, topPages, topUrls } = get(topHistoryStore);

            const windows$ = await windows$db.getAll();
            const currentWindowId = await WindowDB.getItem(DB.WindowDB.CurrentId);
            const tops = showTopViewer ? [topOrigins, topPages, topUrls] : [];
            const actives = showActiveWindows ? windows$.filter((item) => item.active) : [];
            const histories = showHistoryWindows ? windows$.filter((item) => !item.active) : [];
            const all = !(showActiveWindows || showHistoryWindows) ? windows$ : [];

            const windows$1 = [...tops, ...actives, ...histories, ...all];
            const windows$2 = await asyncMap(windows$1, async (window) => {
                const { id, windowId = id, active = false, tabs, topHistory = false } = window;
                const tabs$1 = topHistory ? tabs : await tabs$db.byIds([...tabs]);
                const tabs$2 = await asyncMap(tabs$1, async (item: chrome.tabs.Tab, inx) => {
                    if (!item) return;
                    const favIconUrl = await getFaviconUrl(item);
                    return { ...item, favIconUrl, inx };
                });

                const current = windowId === currentWindowId;

                // const tabs$3 = tabs$2.filter(Boolean);
                // const group$1 = Object.keys(groupBy(tabs$3, 'groupId')).filter((key) => key !== '-1');
                // const group$2 = (await tabGroups$db.byIds(group$1)).filter(Boolean);
                // const group = toObj(group$2, 'id');

                return { ...window, windowId, active, current, topHistory, tabs: tabs$2.filter(Boolean) };
            });

            const windows$3 = orderBy(windows$2, ['topHistory', 'current', 'active'], ['desc', 'desc', 'desc']);

            return { data: windows$3 };
        } catch (e) {
            return { data: [] };
        }
    }
});

export const windowsWithGroupStore = selector({
    key: 'ruyi/windowsWithGroupStore',
    get: async ({ get }) => {
        const { data } = get(windowsStore);
        const windows$ = [];
        for await (const window of data) {
            const { tabs } = window;
            const tabs$temp = new Map();
            for await (const tab of tabs) {
                const { groupId, id } = tab;
                if (groupId === -1) {
                    tabs$temp.set(id, tab);
                    continue;
                }

                if (tabs$temp.has(groupId)) {
                    const group = tabs$temp.get(groupId);
                    group.children.push(tab);
                    tabs$temp.set(groupId, group);
                    continue;
                }

                const group = (await tabGroups$db.getValue(groupId)) ?? {};
                group.children = [tab];
                group.groupId = groupId;
                tabs$temp.set(groupId, group);
            }

            window.children = [...tabs$temp.values()];
            windows$.push(window);
        }

        return { data: windows$ };
    }
});

export const searchByWindowsStore = selector({
    key: 'ruyi/searchByWindowsStore',
    get: async ({ get }) => {
        const search = get(windowSearchAtom);
        const onlyMatched = get(windowSettingAtom(SettingDBKeys.TabsOnlyMatched));
        const { data } = get(windowsWithGroupStore);

        if (onlyMatched && search) {
            const data$ = data
                .map(({ children = [], ...rest }) => {
                    const children$ = children.filter((item) => {
                        if (item.groupId > -1) {
                            const children = item.children.filter((tab) => {
                                return tabMatcher(tab, search);
                            });
                            return children.length ? { ...rest, children } : void 0;
                        }

                        return tabMatcher(item, search) ? { ...rest, children } : void 0;
                    });

                    return children$?.length ? { ...rest, children: children$, matched: toMap(children$, 'id') } : void 0;
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
