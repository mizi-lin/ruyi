import { MsgKey } from '@root/src/constants';
import { getTabById, getTabIdsByQuery, isEmptyTab } from '@root/src/shared/bus/tabs';
import { updateURLWithTab, updateTab } from '@root/src/shared/bus';
import { sendMsgToApp } from './utils/bus';
import { isNil } from 'lodash-es';
import { tabGroups$db, tabs$db, windows$db } from '@root/src/DBStore';

/**
 * Tab Create
 */
chrome.tabs.onCreated.addListener(async (tab) => {
    // const { id } = tab;
    // await UpdateMap(TabDB, DB.TabDB.TabsMap, id, (item) => {
    //     return { ...item, ...tab };
    // });

    // await updateURLWithTab(tab);
    // await sendMsgToApp(MsgKey.DataReload);

    /**
     * update 包括 create
     * 所以不需要再 create 做数据变化
     */
    console.log('tabs onCreated --->>', tab);
});

/**
 * Tab OnActived
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const { tabId } = activeInfo;

    // 更新 tabs
    const tab = await chrome.tabs.get(tabId);

    // 空页面不记录
    if (isEmptyTab(tab)) return;

    await tabs$db.updateValue(tabId, (item) => {
        return { ...item, ...tab };
    });

    await sendMsgToApp(MsgKey.DataReload);

    console.log('tabs onActived --->>', activeInfo);
});

/**
 * Tab Move
 * onMove 只在同一个窗口移动才会触发
 */
chrome.tabs.onMoved.addListener(async (tabId, moveInfo) => {
    const { windowId } = moveInfo;

    // 更新 tab 信息
    const tab = await chrome.tabs.get(tabId);

    await tabs$db.updateValue(tabId, (item) => {
        return { ...item, ...tab };
    });

    // 更新 tab windows 信息
    const tabIdsSet = await getTabIdsByQuery({ windowId });
    await windows$db.updateValue(windowId, { tabs: tabIdsSet });

    // 新的 window 添加浏览记录
    // await UpdateMap(WindowDB, DB.WindowDB.WindowURLsHistoryMap, target, (urls = new Set()) => {
    //     urls.add(tab.url);
    //     return urls;
    // });

    await sendMsgToApp(MsgKey.DataReload);

    /**
     * @todo 如果移动的tab属于组，需要同步更新组信息
     */

    console.log('tabs onMoved --->>', tabId, moveInfo);
});

/**
 * tab 离开视窗时，触发
 * 如标签页在窗口之间移动
 */
chrome.tabs.onDetached.addListener(async (tabId, detachInfo) => {
    const { oldWindowId } = detachInfo;
    const tabIdsSet = await getTabIdsByQuery({ windowId: oldWindowId });
    await windows$db.updateValue(oldWindowId, { tabs: tabIdsSet });

    // 数据重载交给 onAttached
    // await sendMsgToApp(MsgKey.DataReload);
    console.log('tabs onDetached --->>', tabId, detachInfo);
});

/**
 * tab 进入视窗时，触发
 * 如标签页在窗口之间移动
 */
chrome.tabs.onAttached.addListener(async (tabId, attachInfo) => {
    const { newWindowId, newPosition } = attachInfo;

    // 更新window信息
    const tabIdsSet = await getTabIdsByQuery({ windowId: newWindowId });
    await windows$db.updateValue(newWindowId, { tabs: tabIdsSet });

    // 更新 tab 信息
    const tab = await chrome.tabs.get(tabId);
    await tabs$db.updateValue(tabId, tab);
    await sendMsgToApp(MsgKey.DataReload);

    console.log('tabs onAttached --->>', tabId, attachInfo);
});

/**
 * Tab Remove
 */
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    const { windowId, isWindowClosing } = removeInfo;
    if (!isWindowClosing) {
        // @todo 只剩下空窗口的情况处理
        const tabIdsSet = await getTabIdsByQuery({ windowId });
        await windows$db.updateValue(windowId, { tabs: tabIdsSet });

        // 更新 group 信息
        const { groupId } = await getTabById(tabId);
        await tabGroups$db.updateValue(groupId, ({ tabs, ...rest }) => {
            const set = new Set(tabs);
            set.delete(tabId);
            return { ...rest, lastAccessed: Date.now(), tabs: Array.from(set) };
        });

        await sendMsgToApp(MsgKey.DataReload);
    }
    console.log('tabs onRemoved --->>', tabId, removeInfo);
});

/**
 * Tab Url 产生变化
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // 视为favIconUrl获取到了, 才会认为更新成功
    if (changeInfo?.status === 'complete') {
        const { pinned, index, groupId, windowId } = tab;
        await updateURLWithTab(tab);
        await updateTab(tabId, tab);

        // 更新 windows 信息
        const tabIdsSet = await getTabIdsByQuery({ windowId });
        await windows$db.updateValue(windowId, { tabs: tabIdsSet, lastAccessed: Date.now() });

        if (groupId > -1) {
            await tabGroups$db.updateValue(groupId, (item) => {
                const { tabs, ...rest } = item;
                const set = new Set(tabs);
                set.add(tabId);
                return { ...rest, lastAccessed: Date.now(), tabs: Array.from(set) };
            });
        }
        await sendMsgToApp(MsgKey.DataReload);
    }

    if (!isNil(tab.pinned)) {
        await updateTab(tabId, tab);
        await sendMsgToApp(MsgKey.DataReload);
    }

    console.log('tabs onUpdated --->>', changeInfo?.status, tabId, changeInfo, tab);
});
