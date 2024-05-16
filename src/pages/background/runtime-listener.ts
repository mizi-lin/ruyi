import { DB, GetMap, TabDB } from '@root/src/db';
import { updateURLWithHistory, updateURLWithTab } from '@root/src/shared/bus/urls';
import { cleanupDuplicateHistoryWindows, updateWindow } from '@root/src/shared/bus/windows';
import { getTabsWithoutEmpty } from '@root/src/shared/bus';

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

    // 清除重复的窗口记录
    await cleanupDuplicateHistoryWindows();

    // 读取未标记记录的URL信息
    // @todo
    // handlerNoStoreURL();
});

/**
 * 当浏览器重启或遇到以外的时候
 * 会关闭所有的窗口然后重启
 * 这样会额外的造就许多重复的历史窗口
 * 所以这里需要清理这种情况
 */
chrome.runtime.onRestartRequired.addListener(async () => {
    await cleanupDuplicateHistoryWindows();
});
