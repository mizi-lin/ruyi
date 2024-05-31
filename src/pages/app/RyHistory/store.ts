import { urls$db } from '@root/src/DBStore';
import { groupBy, maxBy, orderBy, sumBy } from 'lodash-es';
import { reloadStore, searchTemp } from '../store';
import { SearchTemp } from '@root/src/constants';
import { SendTask } from '../business';
import { historyMockWindow } from '@root/src/shared/bus';

export const urlsStore = selector({
    key: 'ruyi/urls',
    get: async ({ get }) => {
        get(reloadStore);
        const search = get(searchTemp(SearchTemp.history));

        const urls = await urls$db.getAll();
        const urls$ = urls
            .filter((item) => item.active)
            .map((item) => {
                const { url, ...rest } = item;
                if (!url) return;
                const uri = new URL(url);
                const { hostname, host = hostname } = uri;
                uri.search = '';
                uri.hash = '';
                const page = uri.toString();
                return { ...rest, url, host, page };
            })
            .filter((item = {}) => {
                const { url, title } = item;
                if (!url) return false;
                return [url, title].join(',').toLowerCase().includes(search.toLowerCase());
            });

        const urls$1 = orderBy(urls$, ['lastAccessed', 'visitCount'], ['desc', 'desc']);

        return { data: urls$1 };
    }
});

export const pagesStore = selector({
    key: 'ruyi/pages',
    get: ({ get }) => {
        const { data: urls } = get(urlsStore);
        const pages = Object.entries(groupBy(urls, 'page')).map(([page, children]) => {
            const { lastAccessed } = maxBy(children, 'lastAccessed');
            const visitCount = sumBy(children, 'visitCount');
            const { title, host } = children.find((item) => item.url === page) ?? children[0];
            return { url: page, page, host, title, children, lastAccessed, visitCount };
        });

        const pages$ = orderBy(pages, ['lastAccessed', 'visitCount'], ['desc', 'desc']);
        return { data: pages$ };
    }
});

export const hostStore = selector({
    key: 'ruyi/host',
    get: ({ get }) => {
        const { data: urls } = get(urlsStore);
        const hosts = Object.entries(groupBy(urls, 'host')).map(([host, children]) => {
            const { lastAccessed } = maxBy(children, 'lastAccessed');
            const visitCount = sumBy(children, 'visitCount');
            const { origin } = new URL(children[0].url);
            return { url: origin, title: host, children, lastAccessed, visitCount };
        });

        const hosts$ = orderBy(hosts, ['lastAccessed', 'visitCount'], ['desc', 'desc']);
        return { data: hosts$ };
    }
});

/**
 * Top 10 history by url, page, origin
 */
export const topHistoryStore = selector({
    key: 'ruyi/history/top',
    get: ({ get }) => {
        const { data: urls } = get(urlsStore);
        const { data: pages } = get(pagesStore);
        const { data: origins } = get(hostStore);
        const topUrls = orderBy(urls, 'visitCount', 'desc').slice(0, 10);
        const topPages = orderBy(pages, 'visitCount', 'desc').slice(0, 10);
        const topOrigins = orderBy(origins, 'visitCount', 'desc').slice(0, 10);
        return {
            topUrls: historyMockWindow(topUrls, 101, 'Top URL'),
            topPages: historyMockWindow(topPages, 102, 'Top Pages'),
            topOrigins: historyMockWindow(topOrigins, 103, 'Top Origins')
        };
    }
});

export const useDeleteURLs = () => {
    return useRecoilCallback(({ snapshot, refresh }) => async (record: Rows) => {
        await SendTask({ type: 'removeHistory', options: { record } });
        refresh(urlsStore);
    });
};
