import { MsgKey } from '@root/src/constants';
import { UpdateMap, TabDB, DB, GetMap, WindowDB } from '@root/src/db';
import { getTabsWithoutEmpty, isEmptyTab } from '@root/src/shared/bus/tabs';
import { updateCurrentWindowId, updateURLWithTab, updateTab } from '@root/src/shared/bus';
import { toSet } from '@root/src/shared/utils';
import { sendMsgToApp } from './utils/bus';

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

    await UpdateMap(TabDB, DB.TabDB.TabsMap, tabId, (item) => {
        return { ...item, ...tab };
    });

    await sendMsgToApp(MsgKey.DataReload);

    console.log('tabs onActived --->>', activeInfo);
});

/**
 * Tab Move
 */
chrome.tabs.onMoved.addListener(async (tabId, moveInfo) => {
    console.log('....', tabId, moveInfo);
    const tabstore = await GetMap(TabDB, DB.TabDB.TabsMap);
    const { windowId: target } = moveInfo;
    const { windowId: soruce } = tabstore.get(tabId);

    // 更新 tab 信息
    const tab = await chrome.tabs.get(tabId);
    await UpdateMap(TabDB, DB.TabDB.TabsMap, tabId, (item) => {
        return { ...item, ...tab };
    });

    // 更新 tab windows 信息
    const soureTabs = await chrome.tabs.query({ windowId: soruce });
    const targetTabs = await chrome.tabs.query({ windowId: target });

    await UpdateMap(WindowDB, DB.WindowDB.AllWindowTabsMap, soruce, () => {
        return new Set(soureTabs.map((tab) => tab.id));
    });

    await UpdateMap(WindowDB, DB.WindowDB.AllWindowTabsMap, target, () => {
        return new Set(targetTabs.map((tab) => tab.id));
    });

    // 新的 window 添加浏览记录
    await UpdateMap(WindowDB, DB.WindowDB.WindowURLsHistoryMap, target, (urls = new Set()) => {
        urls.add(tab.url);
        return urls;
    });

    // 当前窗口信息
    await updateCurrentWindowId();

    await sendMsgToApp(MsgKey.DataReload);

    console.log('tabs onMoved --->>', tabId, moveInfo);
});

/**
 * tab 离开视窗时，触发
 * 如标签页在窗口之间移动
 */
chrome.tabs.onDetached.addListener(async (tabId, detachInfo) => {
    const { oldWindowId, oldPosition } = detachInfo;
    const tabs = await chrome.tabs.query({ windowId: oldWindowId });
    await UpdateMap(WindowDB, DB.WindowDB.AllWindowTabsMap, oldWindowId, toSet(tabs, 'id'));

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
    const tabs = await chrome.tabs.query({ windowId: newWindowId });
    await UpdateMap(WindowDB, DB.WindowDB.AllWindowTabsMap, newWindowId, toSet(tabs, 'id'));
    const tab = await chrome.tabs.get(tabId);
    await UpdateMap(TabDB, DB.TabDB.TabsMap, tabId, tab);
    await sendMsgToApp(MsgKey.DataReload);
    console.log('tabs onAttached --->>', tabId, attachInfo);
});

/**
 * Tab Remove
 */
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    const { windowId, isWindowClosing } = removeInfo;
    if (!isWindowClosing) {
        const tabs = await getTabsWithoutEmpty({ windowId });
        await UpdateMap(WindowDB, DB.WindowDB.AllWindowTabsMap, windowId, () => {
            return new Set(tabs.map((tab) => tab.id));
        });
    }
    await sendMsgToApp(MsgKey.DataReload);
    console.log('tabs onRemoved --->>', tabId, removeInfo);
});

/**
 * Tab Url 产生变化
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // 视为favIconUrl获取到了, 才会认为更新成功
    if (changeInfo?.status === 'complete') {
        await updateURLWithTab(tab);
        await updateTab(tabId, tab);
        await UpdateMap(WindowDB, DB.WindowDB.AllWindowTabsMap, tab.windowId, (set = new Set()) => {
            set.delete(tabId);
            set.add(tabId);
            return set;
        });
        await sendMsgToApp(MsgKey.DataReload);
        console.log('tabs onUpdated --->>', tabId, changeInfo, tab);
    }
});
