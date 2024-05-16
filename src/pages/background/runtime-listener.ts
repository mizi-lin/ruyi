import { DB, GetMap, RemoveMap, RemoveSet, TabDB, UpdateSet, WindowDB } from '@root/src/db';
import { updateURLWithHistory, updateURLWithTab } from '@root/src/shared/bus/urls';
import { updateCurrentWindowId, updateWindow } from '@root/src/shared/bus/windows';
import { getTabsWithoutEmpty, updateTab } from '@root/src/shared/bus';

/**
 * 安装或更新时触发
 * 一般在此做数据初始化
 */
chrome.runtime.onInstalled.addListener(async (...args) => {
    console.log('onInstalled --->>> ', args);

    const tabstore = await GetMap(TabDB, DB.TabDB.TabsMap);
    // tabs 初始化数据或更新数据
    const tabs = await getTabsWithoutEmpty();
    for await (const tab of tabs) {
        tabstore.set(tab.id, tab);
        // URLs 信息更新
        await updateURLWithTab(tab);
    }
    await TabDB.setItem(DB.TabDB.TabsMap, tabstore);
    // 根据history记录URL信息
    await updateURLWithHistory();
    // 更新Windows相关信息
    await updateWindow();

    // 读取未标记记录的URL信息
    // @todo
    // handlerNoStoreURL();
});