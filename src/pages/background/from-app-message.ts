import { getAppUrl } from './utils/bus';
import { DB, GetMap, GetSet, RemoveMap, RemoveSet, TabDB, UpdateMap, WindowDB } from '@root/src/db';
import { groupBy, insertSet, toMap } from '@root/src/shared/utils';

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
    const activeWindows = await GetSet(WindowDB, DB.WindowDB.ActiveWindowsSet);
    return activeWindows.has(windowId);
}

/**
 * 删除任意来源的标签页
 * - 搜索结果标签页
 */
export async function removeVariousTabs({ tabs }) {
    const windowTabs = groupBy<chrome.tabs.Tab>(tabs, 'windowId');
    const activeWindows = await GetSet(WindowDB, DB.WindowDB.ActiveWindowsSet);

    // 先从窗口映射中删除对应的标签页
    for await (const [winId, tabs] of Object.entries(windowTabs)) {
        // lodash groupBy 返回的key为字符串，需要转回数字
        const windowId = +winId;
        const isActive = activeWindows.has(windowId);
        const tabIds = tabs.map((tab) => tab.id);
        const wtmap = await GetMap(WindowDB, DB.WindowDB.AllWindowTabsMap);
        if (!wtmap) return;
        const sourceSet = wtmap.get(+windowId);

        for await (const tabId of tabIds) {
            isActive && (await chrome.tabs.remove(tabId));
            sourceSet.delete(tabId);
        }

        if (!sourceSet.size) {
            await RemoveMap(WindowDB, DB.WindowDB.AllWindowTabsMap, windowId);
            await RemoveSet(WindowDB, DB.WindowDB.ActiveWindowsSet, windowId);
        } else {
            await UpdateMap(WindowDB, DB.WindowDB.AllWindowTabsMap, windowId, sourceSet);
        }
    }
}

/**
 * 移除标签页
 */
export async function removeTab({ windowId, tab, active }) {
    // 删除 tab
    if (active) {
        return await chrome.tabs.remove(tab.id);
    }
    await UpdateMap(WindowDB, DB.WindowDB.AllWindowTabsMap, windowId, (tabs = new Set()) => {
        tabs.delete(tab.id);
        return tabs;
    });
}

/**
 * 固定标签页
 */
export async function pinnedTab({ tab, active }) {
    console.log('pinnedTab', tab, active);
    return active
        ? await chrome.tabs.update(tab.id, { pinned: !tab.pinned })
        : await chrome.tabs.create({ url: tab.url, pinned: !tab.pinned, windowId: chrome.windows.WINDOW_ID_CURRENT });
}

/**
 * 打开app.html
 */

/**
 * 异步打开应用程序的特定页面。
 * 该函数首先尝试在当前窗口查找已打开的应用页面，如果不存在，则创建一个新标签页。
 * 如果页面已打开但在不同窗口中，则将其移动到当前窗口并激活。
 *
 * @returns {Promise<void>} 不返回任何内容。
 */
export async function openApp() {
    // 获取应用的URL
    const url = getAppUrl();
    // 尝试在当前窗口查找已打开的对应应用页面
    const [tab] = await chrome.tabs.query({ url });

    // 如果应用页面未打开，则创建一个新标签页
    if (!tab) {
        return await chrome.tabs.create({ url, windowId: chrome.windows.WINDOW_ID_CURRENT, index: 0, active: true, pinned: true });
    }

    // 获取当前窗口信息
    const window = await chrome.windows.getCurrent();

    // 如果应用页面不在当前窗口，则将其移动到当前窗口
    if (window.id !== tab.windowId) {
        await chrome.tabs.move(tab.id, { windowId: window.id, index: 0 });
    }

    // 激活并高亮已打开的应用页面
    await chrome.tabs.update(tab.id, { active: true, highlighted: true, pinned: true });
}

// 打开搜索引擎
export async function openSearchEngines() {}

const funcMap = {
    /**
     * 打开网页
     */
    openTab: async ({ windowId, tab, active, incognito = false }) => {
        // 新建窗口打开
        if (!windowId) {
            return await chrome.windows.create({ url: tab.url, incognito });
        }

        // 原窗口打开
        if (active && windowId === tab.windowId) {
            await chrome.windows.update(windowId, { focused: true });
            return await chrome.tabs.update(tab.id, { active: true, highlighted: true });
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

    // 固定标签
    pinnedTab,

    /**
     * 删除特定视窗下的标签页
     */
    removeTab,

    /**
     * 删除任意来源的标签页
     */
    removeVariousTabs,

    /**
     * 打开窗口
     * - 活跃的窗口，直接打开
     * - 历史窗户，新建窗户，恢复URLs
     */
    openWindow: async ({ windowId: sourceWindowId, active, tabs: oldTabs = [], type = 'deleteSource' }) => {
        if (active && sourceWindowId) {
            return await chrome.windows.update(sourceWindowId, { focused: true });
        }

        // 根据windowId 获取 tabs
        const urls = oldTabs.map((tab) => tab?.url).filter(Boolean);

        // 将urls创建改为
        await chrome.windows.create({ url: urls, incognito: false });

        // 删除历史记录
        sourceWindowId && (await RemoveMap(WindowDB, DB.WindowDB.AllWindowTabsMap, sourceWindowId));

        // 不能使用 isEmptyTab 判断，这个时候，tab 为padding 状态， url 等信息尚未完全填充
        const { tabs } = await chrome.windows.getCurrent({ populate: true });

        const oldMap = toMap(oldTabs, 'url');

        // 因移动的标签，新建标签库
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

        /**
         * 同步更新视窗信息
         */
        if (type === 'deleteSource') {
            await removeVariousTabs({ tabs: oldTabs });
        }
    },

    /**
     * 关闭窗口 或 删除窗口
     */
    removeWindow: async ({ windowId, active }) => {
        if (active) {
            // @todo 验证 windowId 是否为活跃状态
            return await chrome.windows.remove(windowId);
        }
        await RemoveMap(WindowDB, DB.WindowDB.AllWindowTabsMap, windowId);
    },

    openApp
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
