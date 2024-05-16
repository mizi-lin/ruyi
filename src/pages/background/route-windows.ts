import { groupBy } from 'lodash-es';
import { sendMsgToApp } from './utils/bus';
import { MsgKey } from '@root/src/constants';

// chrome.tabs.onActivated.addListener(async (tab) => {
//     // 获取当前打开的tabs所有信息
//     const tabs = await chrome.tabs.query({});
//     console.log(tabs);
//     const group = groupBy(tabs, 'windowId');
//     console.log(group);

//     await sendMsgToApp(MsgKey.GetWindows, { options: Object.entries(group) });
//     await sendMsgToApp(MsgKey.GetCurrentWindowId, { options: tab.windowId });
// });

// chrome.windows.onCreated.addListener(async (window) => {
//     await sendMsgToApp(MsgKey.GetCurrentWindowId, { options: window.id });
// });

// chrome.action.onClicked.addListener(async (tab) => {
//     await sendMsgToApp(MsgKey.GetCurrentWindowId, { options: tab.windowId });
// });
