import { tabGroups$db } from './DBStore';
import { isEmptyTab } from './shared/bus/tabs';

// 存储URL相关信息
export const UrlDB = localforage.createInstance({ name: 'ruyi-urls' });
// 存储tabs相关信息
export const TabDB = localforage.createInstance({ name: 'ruyi-tabs' });
// 存储windows相关信息
export const WindowDB = localforage.createInstance({ name: 'ruyi-windows' });
// 配置相关
export const SettingDB = localforage.createInstance({ name: 'ruyi-setting' });

// 存储域名域favicon的信息
export const DomainFaviconDB = localforage.createInstance({ name: 'ruyi-domain-favicon' });

/**
 * ------------
 * DBStore
 * ------------
 */

export async function GetMap(db, storeKey, defaultMap?: Map<any, any>): Promise<Map<any, any>> {
    return (await db.getItem(storeKey)) || (defaultMap ?? new Map());
}

/**
 * 新值 Extend 旧值，并保存
 */
export async function ExtendMap(db, sourceKey, targetMap, updater?) {
    const sourceMap = await GetMap(db, sourceKey);
    for await (const [key, target] of [...targetMap.entries()]) {
        const source = sourceMap.get(key) ?? {};
        const target$ = (await updater?.(key, { source, target, sourceMap, targetMap })) ?? target;
        sourceMap.set(key, { ...source, ...target$ });
    }
    await db.setItem(sourceKey, sourceMap);
    return sourceMap;
}

/**
 * 属性覆盖
 */
export async function CoverMap(db, sourceKey, targetMap, updater?) {
    const sourceMap = await GetMap(db, sourceKey);
    for await (const [key, target] of Object.entries(targetMap)) {
        const source = sourceMap.get(key) ?? {};
        const target$ = (await updater?.(key, { source, target, sourceMap, targetMap })) ?? target;
        sourceMap.set(key, { ...target$, ...source });
    }
    await db.setItem(sourceKey, sourceMap);
    return sourceMap;
}

export async function UpdateMap(db, storeKey, mapKey, updater) {
    const map = await GetMap(db, storeKey);
    const item = map.get(mapKey);
    const value = typeof updater === 'function' ? await updater(item) : updater ?? item;
    map.set(mapKey, value);
    await db.setItem(storeKey, map);
    return map;
}

export async function RemoveMap(db, storeKey, mapKey) {
    const map = await GetMap(db, storeKey);
    map.delete(mapKey);
    await db.setItem(storeKey, map);
}

export async function GetSet(db, storeKey): Promise<Set<any>> {
    return (await db.getItem(storeKey)) || new Set();
}

export async function UpdateSet(db, storeKey, value) {
    const set = await GetSet(db, storeKey);
    // 修正set顺序
    set.delete(value);
    set.add(value);
    await db.setItem(storeKey, set);
    return set;
}

export async function RemoveSet(db, storeKey, value) {
    const set = await GetSet(db, storeKey);
    set.delete(value);
    await db.setItem(storeKey, set);
}

export const DB = {
    UrlDB: {
        // 存储浏览器打开网址记录
        URLsMap: 'ruyi.urldb.urls_map',
        // URL 在 Tab 下打开的记录
        URLTabsMap: 'ruyi.urldb.url_tabs_map',
        // 未处理的URL数据
        NoSignURLsSet: 'ruyi.urldb.no_sign_urls_set',
        // 历史记录
        HistoriesMap: 'ruyi.urldb.histories_map',
        // URLFaviconMap
        URLOriginFaviconMap: 'ruyi.urldb.url_origin_favicon_map'
    },
    TabDB: {
        // 浏览器Tab记录，只记录最后一次打开的URL
        TabsMap: 'ruyi.tabdb.tabs_map'
    },
    WindowDB: {
        // 存储打开窗口的记录
        ActiveWindowsSet: 'ruyi.windowdb.actives_windows_set',
        // 窗口与标签页最新映射信息
        AllWindowTabsMap: 'ruyi.windowdb.all_window_tabs_map',
        // 该窗口下所有打开过的历史
        WindowURLsHistoryMap: 'ruyi.windowdb.window_urls_history_map',
        // 当前 windowId
        CurrentId: 'ruyi.windowdb.current_window_id'
    },
    GroupDB: {
        // 组信息
        GroupsMap: 'ruyi.groupdb.groups_map'
    },
    TagDB: {
        // 标签信息
        TagsMap: 'ruyi.tagdb.tags_map'
    }
};

export enum SettingDBKeys {
    // tabs 搜索结果只显示匹配到的结果
    TabsOnlyMatched = 'ruyi.tabs.only.matched',
    // tabs 显示活跃的窗口
    TabsShowActiveWindows = 'ruyi.tabs.show.active.windows',
    // tabs 显示历史窗口
    TabsShowHistoryWindows = 'ruyi.show.inactive.windows',
    // tabs 显示浏览记录
    TabsShowTopViewer = 'ruyi.tabs.show.top.viewer'
}
