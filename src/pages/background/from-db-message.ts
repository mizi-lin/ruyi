import { db$map } from '@root/src/DBs';
import { mapToObj } from '@root/src/shared/utils';

/**
 * 双监听器策略
 * 解决 content scripts 不能正常接收 sendResponse
 * 报错 The message port closed before a response was received.
 * 其原因为 chrome.runtime.onMessage 监听器在异步操作完成之前关闭了消息端口，导致无法发送响应
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    return true;
});

chrome.runtime.onMessage.addListener(async (request, render, sendResponse) => {
    const { type, args = [] } = request;
    const [db, func] = type.split('.');
    const db$ = db$map.get(db);
    if (!db$map.has(db)) return;
    console.log('from-db-message', request);
    try {
        const data = await db$?.[func]?.(...args);
        const data$ = data instanceof Map ? mapToObj(data) : data instanceof Set ? [...data] : data;
        sendResponse({ data: data$ });
        return true;
    } catch (e) {
        console.trace(e);
    }
});
