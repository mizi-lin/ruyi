import { favicon } from './../../DBStore';
import { favicons$db } from '@root/src/DBStore';
import { SearchTemp } from '@root/src/constants';
import { DB, GetMap, UrlDB } from '@root/src/db';
import { countHistory, faviconURL, historyMockWindow } from '@root/src/shared/bus';
import { orderBy } from 'lodash-es';
import { atomFamily, selectorFamily } from 'recoil';
import { SendTask } from './business';

/**
 * 全局
 * Global
 */
export const searchTemp = atomFamily({
    key: 'ruyi/search',
    default: ''
});

// -----> end global

export const windowSearchTemp = atom({
    key: 'ruyi/windows/search',
    default: ''
});

export const windowsTemp = atom<any[]>({
    key: 'ruyi/windows/temp',
    default: []
});

export const windowsMatchedTemp = selector({
    key: 'ruyi/windows/matched',
    get: ({ get }) => {
        const search = get(windowSearchTemp)?.toLowerCase();
        const windows = get(windowsTemp);
        const tabs = windows.map(([windowId, tabs]) => tabs).flat(Infinity);
        const matched = search
            ? tabs.filter(({ url, title }) => {
                  return [title, url].join('').toLowerCase().indexOf(search) > -1;
              })
            : [];

        return matched;
    }
});

export const historyStore = selector({
    key: 'ruyi/history',
    get: async ({ get }) => {
        const historiesMap = await GetMap(UrlDB, DB.UrlDB.HistoriesMap);

        const pages = countHistory(
            historiesMap,
            (item) => {
                const url = new URL(item.url);
                url.search = '';
                url.hash = '';
                return url.toString();
            },
            (item) => {
                return { ...item, url: item.key };
            }
        );
        const origins = countHistory(
            historiesMap,
            (item) => {
                const url = new URL(item.url);
                return url.origin;
            },
            (item) => {
                return { ...item, url: item.key, title: item.key };
            }
        );
        return {
            data: orderBy([...historiesMap.values()], 'lastVisitTime', 'desc'),
            pages: orderBy([...pages.values()], 'lastVisitTime', 'desc'),
            origins: orderBy([...origins.values()], 'lastVisitTime', 'desc')
        };
    }
});

/**
 * 完整的URL
 */
export const historyURLStore = selector({
    key: 'ruyi/history/url',
    get: ({ get }) => {
        const { data } = get(historyStore);
        const search = get(searchTemp(SearchTemp.history));
        const result = search ? data.filter(({ title, url }) => `${title},${url}`.toLowerCase().indexOf(search?.toLowerCase()) > -1) : data;
        return { data: result };
    }
});

/**
 * Page 即去除了 search & hash 的信息
 */
export const historyPagesStore = selector({
    key: 'ruyi/history/pages',
    get: ({ get }) => {
        const search = get(searchTemp(SearchTemp.history));
        const { pages: data } = get(historyStore);
        const result = search ? data.filter(({ title, url }) => `${title},${url}`.toLowerCase().indexOf(search?.toLowerCase()) > -1) : data;
        return { data: result };
    }
});

/**
 * Origin
 */
export const historyOriginsStore = selector({
    key: 'ruyi/history/origins',
    get: ({ get }) => {
        const search = get(searchTemp(SearchTemp.history));
        const { origins: data } = get(historyStore);
        const result = search ? data.filter(({ title, url }) => `${title},${url}`.toLowerCase().indexOf(search?.toLowerCase()) > -1) : data;
        return { data: result };
    }
});

/**
 * -----------
 * -----------
 * -----------
 */
export const reloadStore = atom({
    key: 'ruyi/reload',
    default: 0
});

export const useStoreReload = () => {
    return useRecoilCallback(({ set }) => () => {
        set(reloadStore, Math.random());
    });
};

export const faviconStore = selectorFamily({
    key: 'reeval/favicon',
    get:
        (url: string) =>
        async ({ get }) => {
            const { hostname, host = hostname } = new URL(url);
            const favicon = await favicons$db.getValue(host);
            return favicon ? favicon : faviconURL(url);
        }
});
