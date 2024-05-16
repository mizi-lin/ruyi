import { MsgKey } from '@root/src/constants';
import { UpdateSet, WindowDB, DB, RemoveSet, dbRemoveOnlyEmptyTabOfWindow, UpdateMap } from '@root/src/db';
import { sendMsgToApp } from './utils/bus';

/**
 * Windows Create
 */
chrome.windows.onCreated.addListener(async (window: chrome.windows.Window) => {
    // add to activeWindows
    await UpdateSet(WindowDB, DB.WindowDB.ActiveWindowsSet, window.id);

    await sendMsgToApp(MsgKey.DataReload);
    console.log('window onCreate --->>', window);
});

/**
 * Windows Remove
 */
chrome.windows.onRemoved.addListener(async (windowId) => {
    await RemoveSet(WindowDB, DB.WindowDB.ActiveWindowsSet, windowId);

    /**
     * 清除只有默认窗口的window
     */
    await dbRemoveOnlyEmptyTabOfWindow(windowId);

    // 关闭窗口口，打开最近聚焦的窗口, 重置当前活跃窗口
    const windows = await chrome.windows.getLastFocused();
    windows && (await WindowDB.setItem(DB.WindowDB.CurrentId, windows.id));

    await sendMsgToApp(MsgKey.DataReload);
    console.log('window onRemoved --->>', windowId);
});

chrome.windows.onFocusChanged.addListener(
    async (windowId) => {
        windowId > 0 && (await WindowDB.setItem(DB.WindowDB.CurrentId, windowId));
    },
    { windowTypes: ['normal'] }
);
