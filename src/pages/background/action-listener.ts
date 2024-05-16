import { DB, UpdateMap, WindowDB } from '@root/src/db';
import { getAppUrl } from './utils/bus';

const { create, move, update } = chrome.tabs;
chrome.action.onClicked.addListener(async (tab) => {
    const { windowId } = tab;
    const appURL = getAppUrl();

    // 查询 app 是否打开
    let [appTab] = await chrome.tabs.query({ url: appURL });

    // app不曾打开, 创建reeval app
    if (!appTab) {
        appTab = await create({ url: appURL, windowId, index: 0, active: true, pinned: true });
    }

    // app已打开
    if (appTab) {
        // 从其他window移动到当前的window
        appTab.windowId !== windowId && (await move(appTab.id, { windowId, index: 0 }));

        // 激活
        await update(appTab.id, { highlighted: true, active: true, pinned: true });
    }

    await WindowDB.setItem(DB.WindowDB.CurrentId, windowId);
});
