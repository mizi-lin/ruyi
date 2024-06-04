import { get, orderBy, random } from 'lodash-es';
import { DB, GetMap, GetSet, UpdateMap, UrlDB } from '@root/src/db';
import * as cheerio from 'cheerio';
import { sleep } from '../utils/common';
import { toMap } from '../utils';
import { favicons$db, tabs$db, urls$db } from '@root/src/DBs';
import { faviconURL } from './common';

export type URLInfo = {
    // FavIcon URL
    favIconUrl: string;
    // Web URL
    url: string;
    // 网页文本内容，用于数字查询
    body: string;
    // 网页title
    title: string;
    // 最后更新时间
    lastAccessed: number;
};

export async function urlsByTabUpdater(newValue: Row = {}) {
    return (oldValue: Row = {}) => {
        const { id: tabId, windowId } = newValue;
        const { visitCount, tabIds = new Set(), windowIds = new Set(), ...rest } = oldValue;
        tabIds.add(tabId);
        windowIds.add(windowId);
        return { ...rest, tabIds, windowIds, visitCount: visitCount ?? 0, active: true };
    };
}

export async function updateURLs() {
    /**
     * 从历史记录获得
     */
    const result = await chrome.history.search({
        text: '',
        maxResults: 200000,
        startTime: dayjs('2000-01-01').valueOf()
    });

    const data = result.map((item) => {
        const { lastVisitTime: lastAccessed, title, url, visitCount, typedCount } = item;
        return { lastAccessed, title, url, visitCount, typedCount, active: true };
    });

    await urls$db.updateRows(data, 'url');

    /**
     * 从TabsDB处获得补充
     */
    const tabs = await tabs$db.getAll();
    await urls$db.updateRows(tabs, 'url', urlsByTabUpdater);
}

/**
 * 由Tab提供更新URLs信息
 * @param tab
 */
export async function updateURLWithTab(tab: chrome.tabs.Tab) {
    const { id, url, favIconUrl, title, lastAccessed } = tab;

    // URLs 信息修改
    await UpdateMap(UrlDB, DB.UrlDB.URLsMap, url, (urlInfo: URLInfo) => {
        return { ...urlInfo, url, favIconUrl, title, lastAccessed };
    });

    // URLs 与 tabId 的关系
    await UpdateMap(UrlDB, DB.UrlDB.URLTabsMap, id, (ids = new Set()) => {
        // 更改顺序，所以先删除，再添加
        ids.delete(id);
        ids.add(id);
        return ids;
    });
}

/**
 * 由历史记录更新URLs信息
 */
export async function updateURLWithHistory() {
    const result = await chrome.history.search({
        text: '',
        maxResults: 20000,
        startTime: dayjs('2000-01-01').valueOf()
    });

    /**
     * 存储历史记录
     * --
     * 因为历史记录删除为 deleteUrl, 而 history 的 在每次清除历史记录后，会自动从0开始
     * 所以 ID 为 history 是无作用做的
     */
    const historiesMaps = toMap(result, 'url');
    await UrlDB.setItem(DB.UrlDB.HistoriesMap, historiesMaps);

    const urlsMaps = await GetMap(UrlDB, DB.UrlDB.URLsMap);
    const nostoreURlSet = await GetSet(UrlDB, DB.UrlDB.NoSignURLsSet);
    const originFaviconMap = await GetMap(UrlDB, DB.UrlDB.URLOriginFaviconMap);

    // 更新URL信息
    for await (const item of result) {
        const { url } = item;
        if (!urlsMaps.has(url)) {
            const { host, hostname = host } = new URL(url);
            nostoreURlSet.add(url);
            urlsMaps.set(url, { url, title: hostname });
        }
    }

    await UrlDB.setItem(DB.UrlDB.URLsMap, urlsMaps);
    await UrlDB.setItem(DB.UrlDB.NoSignURLsSet, nostoreURlSet);
}

/**
 * URL Origin favicon map
 * 数据备份，用于读取不到 tab 关联信息
 */
export async function updateFavicons() {
    const tabs = await tabs$db.getAll();
    for await (const tab of tabs) {
        const { pendingUrl, url = pendingUrl, favIconUrl } = tab;
        if (url && favIconUrl) {
            const { host, hostname = host } = new URL(url);
            // 每次读写避免数据读写丢失
            await favicons$db.updateValue(hostname, favIconUrl);
        }
    }
}

/**
 * 解析html source 获取 favIconUrl, body, title
 */
function parseHtmlSource(htmlSource: string) {
    // 删除 style, script 代码，避免返回不正确结果
    const html = htmlSource
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    const $ = cheerio.load(html);
    const bodyText = $('body').text();
    const body = bodyText.replace(/\s{2,}/g, '');
    const title = $('title').text();
    const favIconUrl = $('link[rel*="icon"]').attr('href');
    // todo favicon url 处理
    return { body, title, favIconUrl };
}

/**
 * 验证URL规则
 * // 与 google相关的，
 * // 与 baidu 搜索页相关的
 * // 与 localhost 相关的
 */
export async function ignoreStoreURLRule(url) {
    const pattern = [
        /\/\/localloost.*?\//,
        /\/\/chromewebstore.google.com\//,
        /\/\/www.baidu.com\//,
        /\/\/fanyi.baidu.com\//,
        /\/\/translate.google.com\//,
        /file:\/\//,
        /chrome-extension:\/\//
    ];

    for (const regx of pattern) {
        if (regx.test(url)) {
            return true;
        }
    }
}

/**
 * 后台运行没有处理过的no-store数据
 * handler no-store
 */
export async function handlerNoStoreURL() {
    const nostore = await UrlDB.getItem(DB.UrlDB.NoSignURLsSet);
    if (nostore.size) {
        for await (const url of nostore) {
            if (ignoreStoreURLRule(url)) {
                nostore.delete(url);
                await UrlDB.setItem(DB.UrlDB.NoSignURLsSet, nostore);
                continue;
            }
            try {
                // 获取html源码
                const htmlSource = await fetch(url).then((res) => {
                    if (res.ok) {
                        return res.text();
                    }
                    return Promise.reject(new Error('...'));
                });
                // 解析源码
                const result = parseHtmlSource(htmlSource);
                // 将解析结果写到 URLs 中
                const urls = await UrlDB.getItem(DB.UrlDB.URLsMap);
                const source = urls.get(url) ?? {};
                urls.set(url, { ...source, ...result });
                // 写入IndexedDB 避免中断，数据未写入
                await UrlDB.setItem(DB.UrlDB.URLsMap, urls);
                // 删除 nostore, 避免重复请求
                nostore.delete(url);
                // 更新IndexedDB.nostore
                await UrlDB.setItem(DB.UrlDB.NoSignURLsSet, nostore);
            } catch (e) {
                nostore.delete(url);
                await UrlDB.setItem(DB.UrlDB.NoSignURLsSet, nostore);
            }
            // 随机等待时间，避免被插件认定是频繁的重复请求
            await sleep(random(300, 2000));
        }
    }
}
