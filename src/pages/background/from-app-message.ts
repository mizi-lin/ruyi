import { getAppUrl, sendMsgToApp } from './utils/bus';
import { asyncMap, groupBy, insertSet, toMap } from '@root/src/shared/utils';
import { SendTask } from '../app/business';
import { MsgKey } from '@root/src/constants';
import { tabGroups$db, tabs$db, windows$db } from '@root/src/DBStore';
import { cleanupDuplicateWindows, isActiveWindowByChrome, updateURLs } from '@root/src/shared/bus';

const funcMap = {
    /**
     * 打开网页
     */
    openTab,

    /**
     * 移动 tab
     * - 两个 windowId 都 active, 直接移动
     * - 若 target window inactive, 直接修改db
     * - 若 tab inactive 则在 window 上新建 tab
     */
    moveTab,

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
    openWindow,

    /**
     * 关闭窗口 或 删除窗口
     */
    removeWindow,

    openApp,

    /**
     * 修改标签组信息
     */
    modifyTabGroup,

    removeTabGroup,

    openTabGroup,

    openTabGroupInCurrentWindow,

    [SendTask.rebuild]: rebuild
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

/**
 * ----------- window ------------
 */

/**
 * 异步打开新窗口，并对原窗口进行相应操作（如激活或删除标签页）。
 * @param {Object} options 包含窗口标识符、激活状态、旧标签页和操作类型的对象。
 * @param {number} options.windowId 源窗口的ID。
 * @param {boolean} options.active 是否将源窗口设为活动状态。
 * @param {Array} [options.tabs=[]] 旧标签页的数组，默认为空数组。
 * @param {string} [options.type='deleteSource'] 操作类型，默认为'deleteSource'，表示删除源窗口的标签页。
 * @returns {Promise} 如果源窗口ID有效且active为true，则返回更新源窗口为活动状态的Promise。
 */
async function openWindow({ windowId: sourceWindowId, active, tabs: oldTabs = [], type = 'deleteSource' }) {
    // 如果需要并且源窗口ID存在，则激活源窗口
    if (active && sourceWindowId) {
        return await chrome.windows.update(sourceWindowId, { focused: true });
    }

    // 准备创建新窗口的URL列表
    const urls = oldTabs.map((tab) => tab?.url).filter(Boolean);

    // 创建新窗口
    await chrome.windows.create({ url: urls, incognito: false });

    // 如果源窗口ID存在，删除源窗口的所有标签页
    sourceWindowId && (await windows$db.remove(sourceWindowId));

    // 获取当前窗口的标签页信息，并更新每个标签页
    const { tabs } = await chrome.windows.getCurrent({ populate: true });

    const oldMap = toMap(oldTabs, 'url');

    // 遍历当前窗口的所有标签页，同步更新信息
    for await (const tab of tabs) {
        await tabs$db.updateValue(tab.id, async () => {
            const { url, pendingUrl } = tab;
            const url$ = url || pendingUrl;
            const old = oldMap.get(url$);
            if (old) {
                // 如果标签页在旧标签页中存在，则更新标题和图标URL
                const { title, favIconUrl, id } = old;
                const tab$ = { ...tab, title, favIconUrl };
                return tab$;
            } else {
                // 如果标签页不存在于旧标签页中，则自动生成标题
                const url = new URL(url$);
                const tab$ = { ...tab, title: url.hostname, url: url$ };
                return tab$;
            }
        });
    }

    // 如果操作类型为'deleteSource'，则删除旧标签页
    if (type === 'deleteSource') {
        await removeVariousTabs({ tabs: oldTabs });
    }
}

async function removeWindow({ windowId, active }) {
    if (active) {
        // @todo 验证 windowId 是否为活跃状态
        return await chrome.windows.remove(windowId);
    }

    await windows$db.remove(windowId);
}

async function moveTab({ sourceWindowId, targetWindowId, tabId, index }, sendResponse) {
    const isActiveTargetWindow = await isActiveWindowByChrome(targetWindowId);
    const isActiveSourceWindow = await isActiveWindowByChrome(sourceWindowId);

    // 若从历史窗口移走，删除历史记录
    !isActiveSourceWindow &&
        (await windows$db.updateValue(sourceWindowId, (item) => {
            const { tabs, ...rest } = item;
            tabs.delete(tabId);
            return { ...rest, tabs, lastAccessed: Date.now() };
        }));

    if (!isActiveTargetWindow) {
        // 若标签页从活跃的窗口移向历史窗口, 则关闭Tab;
        if (isActiveSourceWindow) {
            try {
                await chrome.tabs.remove(tabId);
            } catch (e) {}
        }

        await windows$db.updateValue(targetWindowId, (item) => {
            const { tabs, ...rest } = item;
            const tabs$ = insertSet(tabs, index, tabId);
            return { ...rest, tabs: tabs$, lastAccessed: Date.now() };
        });

        return;
    }

    try {
        await chrome.tabs.get(tabId);
        await chrome.tabs.move(tabId, { windowId: targetWindowId, index });
    } catch (e) {
        const { url } = (await tabs$db.getValue(tabId)) ?? {};
        url && (await chrome.tabs.create({ url, windowId: targetWindowId, index }));
    }
}

/**
 * 打开一个标签页
 * @param {Object} param0 打开标签页的参数
 * @param {number} param0.windowId 窗口ID，如果为null或undefined，则在新建窗口中打开标签页
 * @param {Object} param0.tab 标签页对象，包含标签页的详细信息
 * @param {boolean} param0.active 是否使标签页处于活动状态
 * @param {boolean} [param0.incognito=false] 是否以隐身模式打开标签页
 * @returns {Promise<void>} 不返回任何内容
 */
async function openTab({ windowId, tab, active, incognito = false }) {
    // 新建窗口打开逻辑
    if (!windowId) {
        return await chrome.windows.create({ url: tab.url, incognito });
    }

    // 在原窗口激活标签页的逻辑
    if (active && windowId === tab.windowId) {
        await chrome.windows.update(windowId, { focused: true });
        return await chrome.tabs.update(tab.id, { active: true, highlighted: true });
    }

    // 在当前窗口打开标签页的逻辑
    return await chrome.tabs.create({ url: tab.url, windowId: chrome.windows.WINDOW_ID_CURRENT, active: true });
}

/**
 * 检查指定的标签页是否存在。
 * @param tabId - 需要检查的标签页ID。
 * @returns 返回一个Promise，如果标签页存在则解析为true，否则解析为false。
 */
export async function existTab(tabId) {
    try {
        // 尝试通过tabId获取标签页信息，如果成功则表示标签页存在
        await chrome.tabs.get(tabId);
        return true;
    } catch (e) {
        // 如果获取标签页时发生错误，则表示标签页不存在
        return false;
    }
}

/**
 * 删除任意来源的标签页
 * - 搜索结果标签页
 */
export async function removeVariousTabs({ tabs }) {
    const windowTabs = groupBy<chrome.tabs.Tab>(tabs, 'windowId');

    // 先从窗口映射中删除对应的标签页
    for await (const [windowId, tabs] of Object.entries(windowTabs)) {
        // lodash groupBy 返回的key为字符串，需要转回数字
        const isActive = isActiveWindowByChrome(windowId);
        const tabIds = tabs.map((tab) => tab.id);
        const { tabs: sourceSet } = await windows$db.getValue(windowId);

        for await (const tabId of tabIds) {
            isActive && (await chrome.tabs.remove(tabId));
            sourceSet.delete(tabId);
        }

        if (!sourceSet.size) {
            await windows$db.updateValue(windowId, { active: false, lastAccessed: Date.now() });
        } else {
            await windows$db.updateValue(windowId, { tabs: sourceSet, lastAccessed: Date.now() });
        }
    }
}

/**
 * 移除标签页
 */
export async function removeTab({ windowId, groupId, tab, active }) {
    // 删除 tab
    if (active) {
        await chrome.tabs.remove(tab.id);
    }

    if (groupId) {
        const { tabs } = await tabGroups$db.getValue(groupId);
        if (tabs?.length === 1) {
            await removeTabGroup({ tabGroupId: groupId, record: { active: false } });
        } else {
            try {
                await chrome.tabs.remove(tab.id);
            } catch (e) {}
            const tabs$ = tabs.filter((id) => id !== tab.id);
            await tabGroups$db.updateValue(groupId, { tabs: tabs$ });
        }
    }

    await windows$db.updateValue(windowId, ({ tabs, ...rest }) => {
        tabs?.delete(tab.id);
        return { ...rest, tabs };
    });
}

/**
 * 固定标签页
 */
export async function pinnedTab({ tab, active }) {
    return active
        ? await chrome.tabs.update(tab.id, { pinned: !tab.pinned })
        : await chrome.tabs.create({ url: tab.url, pinned: !tab.pinned, windowId: chrome.windows.WINDOW_ID_CURRENT });
}

/**
 * 重建数据
 */
export async function rebuild(options, sendRespnse, sender) {
    // await install();
    // await updateWindows();
    // await cleanupDuplicateWindows();
    await updateURLs();
    await sendMsgToApp(MsgKey.DataReload);
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

/**
 * *****************************
 * Tab Groups
 * *****************************
 */
export async function modifyTabGroup({ tabGroupId, record }) {
    console.log('-------> tabGroup modifyTabGroup', tabGroupId, record);
    await chrome.tabGroups.update(tabGroupId, record);
}

export async function removeTabGroup({ tabGroupId, record }) {
    const { active, tabs } = record;

    // 活跃状态，删除组信息
    if (tabs?.length && active) {
        // tabGroup 没有remove API, 删除组就是删除该组中的标签
        const tabs = await chrome.tabs.query({ groupId: tabGroupId });
        try {
            await chrome.tabs.ungroup(tabs.map((tab) => tab.id));
        } catch (e) {
            for await (const tab of tabs) {
                await chrome.tabs.remove(tab.id);
            }
        }
        return;
    }

    // 非活跃状态，删除组信息
    await tabGroups$db.remove(tabGroupId);
}

/**
 * 若 window && group 都 active, 直接打开
 * 若 window.active, group inactive, 则在当前窗口
 * 若 window.inactive, group.inactive，则在当前窗口打开
 */
export async function openTabGroup({ tabGroupId, record, nofocusedWindow }) {
    try {
        const { active, tabs, windowId, color, title } = record;
        const isActiveWindow = isActiveWindowByChrome(windowId);

        if (active) {
            await openTab({ windowId, active: isActiveWindow, tab: tabs?.[0] });
            return tabGroupId;
        }

        if (!active) {
            const openWindowId = isActiveWindow ? windowId : chrome.windows.WINDOW_ID_CURRENT;
            // 重建标签页
            const tabIds = await asyncMap(tabs, async (tab) => {
                const { id } = await openTab({ windowId: openWindowId, active: false, tab });
                return id;
            });

            // 重建组
            const tabGroupId = await chrome.tabs.group({ createProperties: { windowId: openWindowId }, tabIds });

            // 更新组信息
            await chrome.tabGroups.update(tabGroupId, { color, title });

            // 激活窗口
            if (openWindowId !== chrome.windows.WINDOW_ID_CURRENT && !nofocusedWindow) {
                await chrome.windows.update(openWindowId, { focused: true });
            }

            return tabGroupId;
        }
    } catch (e) {
        console.log('openTabGroup oooo-->>', e);
    }
}

/**
 * 在当前窗口打开标签组
 * 若标签组在其他窗口，则移动到当前窗口
 */
export async function openTabGroupInCurrentWindow({ tabGroupId, record }) {
    const { windowId, active } = record;

    if (!active) {
        tabGroupId = await openTabGroup({ tabGroupId, record, nofocusedWindow: true });
    }

    const { id: currentWindowId } = await chrome.windows.getCurrent();

    if (currentWindowId !== windowId) {
        await chrome.tabGroups.move(tabGroupId, { windowId: currentWindowId, index: -1 });
    }
}
