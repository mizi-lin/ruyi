import { updateFavicons, updateURLs } from '@root/src/shared/bus/urls';
import { cleanupDuplicateWindows, updateWindows } from '@root/src/shared/bus/windows';
import { cleanupDuplicateTabGroups, getTabsWithoutEmpty, updateTabGroups, updateTabs } from '@root/src/shared/bus';
import { updateSetting } from '@root/src/shared/bus/setting';

/**
 * 安装时触发
 * 一般在此做数据初始化
 */
export async function install() {
    const tabs = await getTabsWithoutEmpty();

    await updateTabs(tabs);

    // 更新Windows相关信息
    await updateWindows();

    // 获取 TabGroups
    await updateTabGroups();

    // URL 操作记录
    await updateURLs();

    // origin favicon
    await updateFavicons();

    // 配置信息初始化
    await updateSetting();

    // 清除重复的窗口记录
    await cleanupDuplicateWindows();

    // 清除重复的标签组
    await cleanupDuplicateTabGroups();

    // 读取未标记记录的URL信息
    // @todo
    // handlerNoStoreURL();
}

/**
 * 安装或更新时触发
 * 一般在此做数据初始化
 */
chrome.runtime.onInstalled.addListener(async (...args) => {
    console.log('onInstalled --->>> ', args);
    await install();
});

/**
 * 当浏览器重启或遇到以外的时候
 * 会关闭所有的窗口然后重启
 * 这样会额外的造就许多重复的历史窗口
 * 所以这里需要清理这种情况
 */
chrome.runtime.onRestartRequired.addListener(async () => {
    await install();
});

chrome.commands.onCommand.addListener((command) => {
    // 奇怪，为什么监测不到 commands
    console.log(`Command --> "${command}" triggered`);
});
