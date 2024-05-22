import { tabGroups$db } from '@root/src/DBStore';
import { sendMsgToApp } from './utils/bus';
import { MsgKey } from '@root/src/constants';
import { cleanupDuplicateTabGroups } from '@root/src/shared/bus';
import { sleep } from '@root/src/shared/utils';

chrome.tabGroups.onCreated.addListener((group: chrome.tabGroups.TabGroup) => {
    console.log('tabGroups onCreated --->>', group);
});

/**
 * 由用户直接关闭或因群组没有包含任何标签页而自动关闭时触发
 */
chrome.tabGroups.onRemoved.addListener(async (group: chrome.tabGroups.TabGroup) => {
    const { windowId, id: groupId } = group;

    // 隐藏
    await tabGroups$db.updateValue(groupId, { active: false });
    await sendMsgToApp(MsgKey.DataReload);
    console.log('tabGroups onRemoved --->>', group);
});

chrome.tabGroups.onUpdated.addListener(async (group: chrome.tabGroups.TabGroup) => {
    const { id: groupId, windowId } = group;

    const tabs = await chrome.tabs.query({ groupId, windowId });

    // 添加或更新
    await tabGroups$db.updateValue(groupId, { ...group, tabs: tabs.map((tab) => tab.id), active: true, lastAccessed: Date.now() });

    // TabGroupAPI 暂时没有移动都新窗口的API, 所以需要做次 clean 检查
    await cleanupDuplicateTabGroups();

    await sendMsgToApp(MsgKey.DataReload);
    console.log('tabGroups onUpdated --->>', group);
});

/**
 * 在窗口内移动组时触发。
 * 系统仍会针对组内的单个标签页以及该组本身触发移动事件。
 * 在窗口之间移动组时，不会触发此事件，而是从一个窗口移除并在另一个窗口中创建该事件。
 */
chrome.tabGroups.onMoved.addListener((group: chrome.tabGroups.TabGroup) => {
    console.log('tabGroups onMoved --->>', group);
});
