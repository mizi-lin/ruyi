import { DB, ExtendMap, GetMap, GetSet, RemoveMap, TabDB, UpdateMap, WindowDB, dbGetTabsByWindowId } from '@root/src/db';
import { getTabsWithoutEmpty, updateTabs } from '@root/src/shared/bus';
import { insertSet, toMap } from '@root/src/shared/utils';

export async function existTab(tabId) {
    try {
        await chrome.tabs.get(tabId);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 判断 window 是否活跃
 */
export async function isActiveWindowById(windowId) {
    const now = +new Date();
    const winddows = await chrome.windows.getAll();
    const next = +new Date();
    console.log('isActivechrome.windows.getAll', winddows, +new Date() - now);
    const activeWindows = await GetSet(WindowDB, DB.WindowDB.ActiveWindowsSet);
    console.log('isActivechrome.windows.getAll', activeWindows, +new Date() - next);

    return activeWindows.has(windowId);
}

const funcMap = {
    /**
     * 打开网页
     */
    openTab: async ({ windowId, tab, incognito = false }) => {
        // 新建窗口打开
        if (!windowId) {
            return await chrome.windows.create({ url: tab.url, incognito });
        }

        // 在当前窗口打开
        await chrome.tabs.create({ url: tab.url, windowId: chrome.windows.WINDOW_ID_CURRENT, active: true });
    },
    /**
     * 移动 tab
     * - 两个 windowId 都 active, 直接移动
     * - 若 target window inactive, 直接修改db
     * - 若 tab inactive 则在 window 上新建 tab
     */
    moveTab: async ({ sourceWindowId, targetWindowId, tabId, index }, sendResponse) => {
        const isActiveTargetWindow = await isActiveWindowById(targetWindowId);
        const isActiveSourceWindow = await isActiveWindowById(sourceWindowId);

        // 若从历史窗口移走，删除历史记录
        !isActiveSourceWindow &&
            (await UpdateMap(WindowDB, DB.WindowDB.AllWindowTabsMap, sourceWindowId, (value: Set<number>) => {
                value.delete(tabId);
                return value;
            }));

        if (!isActiveTargetWindow) {
            // 若标签页从活跃的窗口移向历史窗口, 则关闭Tab;
            if (isActiveSourceWindow) {
                try {
                    await chrome.tabs.remove(tabId);
                } catch (e) {}
            }

            await UpdateMap(WindowDB, DB.WindowDB.AllWindowTabsMap, targetWindowId, (value: Set<number>) => {
                return insertSet(value, index, tabId);
            });

            return;
        }

        try {
            await chrome.tabs.get(tabId);
            await chrome.tabs.move(tabId, { windowId: targetWindowId, index });
        } catch (e) {
            const tabsMap = await GetMap(TabDB, DB.TabDB.TabsMap);
            const { url } = tabsMap.get(tabId) ?? {};
            url && (await chrome.tabs.create({ url, windowId: targetWindowId, index }));
        }
    },

    removeTab: async ({ windowId, tab, active }) => {
        // 删除 tab
        if (active) {
            return await chrome.tabs.remove(tab.id);
        }
        await UpdateMap(WindowDB, DB.WindowDB.AllWindowTabsMap, windowId, (tabs = new Set()) => {
            tabs.delete(tab.id);
            return tabs;
        });
    },

    /**
     * 打开窗口
     * - 活跃的窗口，直接打开
     * - 历史窗户，新建窗户，恢复URLs
     */
    openWindow: async ({ windowId, active, tabs: oldTabs }) => {
        if (active) {
            return await chrome.windows.update(windowId, { focused: true });
        }

        // 根据windowId 获取 tabs
        const urls = oldTabs.map((tab) => tab?.url).filter(Boolean);

        // 将urls创建改为
        const window = await chrome.windows.create({ url: urls, incognito: false });

        // 删除历史记录
        await RemoveMap(WindowDB, DB.WindowDB.AllWindowTabsMap, windowId);

        // 不能使用 isEmptyTab 判断，这个时候，tab 为padding 状态， url 等信息尚未完全填充
        const { tabs } = await chrome.windows.getCurrent({ populate: true });

        const oldMap = toMap(oldTabs, 'url');

        for await (const tab of tabs) {
            await UpdateMap(TabDB, DB.TabDB.TabsMap, tab.id, async () => {
                const { url, pendingUrl } = tab;
                const url$ = url || pendingUrl;
                const old = oldMap.get(url$);
                if (old) {
                    const { title, favIconUrl, id } = old;
                    const tab$ = { ...tab, title, favIconUrl };
                    return tab$;
                } else {
                    const url = new URL(url$);
                    const tab$ = { ...tab, title: url.hostname, url: url$ };
                    return tab$;
                }
            });
        }

        for await (const tab of oldTabs) {
            await RemoveMap(TabDB, DB.TabDB.TabsMap, tab.id);
        }
    },

    /**
     * 关闭窗口 或 删除窗口
     */
    removeWindow: async ({ windowId, active }) => {
        if (active) {
            // todo 验证 windowId 是否为活跃状态
            return await chrome.windows.remove(windowId);
        }
        await RemoveMap(WindowDB, DB.WindowDB.AllWindowTabsMap, windowId);
    }
};

chrome.runtime.onMessage.addListener(async (request, render, sendResponse) => {
    const { type, options } = request;
    console.log('from-app-message', request);
    try {
        await funcMap[type]?.(options, sendResponse, render);
    } catch (e) {
        console.trace(e);
    }
});
