import { MsgKey } from '@root/src/constants';
import { DB, UpdateMap, UrlDB } from '@root/src/db';
import { sendMsgToApp } from './utils/bus';

/**
 * 浏览记录
 * 比如在同一个tab下，tabId 不变，但url 产生变化，onVisited 会被触发
 * 此事件在页面加载前触发, 即页面加载后，切换 Tab 不会触发该事件
 */
chrome.history.onVisited.addListener(async (result) => {
    await UpdateMap(UrlDB, DB.UrlDB.HistoriesMap, result.url, result);
    await sendMsgToApp(MsgKey.DataReload);
    console.log('tabs onVisited --->>', result);
});
