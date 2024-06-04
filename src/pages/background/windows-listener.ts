import { MsgKey } from '@root/src/constants';
import { WindowDB, DB } from '@root/src/db';
import { sendMsgToApp } from './utils/bus';
import { windows$db } from '@root/src/DBs';
import { pickWindow } from '@root/src/shared/bus';

/**
 * Windows Create
 */
chrome.windows.onCreated.addListener(async (window: chrome.windows.Window) => {
    // add to activeWindows

    await windows$db.updateValue(window.id, () => {
        return { ...pickWindow(window), active: true, lastAccessed: Date.now() };
    });

    await sendMsgToApp(MsgKey.DataReload);
    console.log('window onCreate --->>', window);
});

/**
 * Windows Remove
 */
chrome.windows.onRemoved.addListener(async (windowId) => {
    await windows$db.updateValue(windowId, { active: false, lastAccessed: Date.now() });
    await sendMsgToApp(MsgKey.DataReload);

    /**
     * @todo 清除只有默认窗口的window
     */
    // await dbRemoveOnlyEmptyTabOfWindow(windowId);

    console.log('window onRemoved --->>', windowId);
});

/**
 * 聚焦窗口，更新当前窗口ID
 */
chrome.windows.onFocusChanged.addListener(
    async (windowId) => {
        if (windowId > 0) {
            await WindowDB.setItem(DB.WindowDB.CurrentId, windowId);
            await windows$db.updateValue(windowId, { lastAccessed: Date.now() });
            await sendMsgToApp(MsgKey.DataReload);
        }
    },
    { windowTypes: ['normal'] }
);
