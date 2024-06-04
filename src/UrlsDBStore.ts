import { groupBy, maxBy, orderBy, sumBy } from 'lodash-es';
import { DBStore } from './DBStore';

export class UrlsDBStore extends DBStore {
    async getUrls() {
        const urls = await this.getAll();
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
            .filter(Boolean);

        return orderBy(urls$, ['lastAccessed', 'visitCount'], ['desc', 'desc']);
    }

    async getPages() {
        const urls = await this.getUrls();
        return Object.entries(groupBy(urls, 'page')).map(([page, children]) => {
            const { lastAccessed } = maxBy(children, 'lastAccessed');
            const visitCount = sumBy(children, 'visitCount');
            const { title, host } = children.find((item) => item.url === page) ?? children[0];
            return { url: page, page, host, title, children, lastAccessed, visitCount };
        });
    }

    async getHosts() {
        const urls = await this.getUrls();
        return Object.entries(groupBy(urls, 'host')).map(([host, children]) => {
            const { lastAccessed } = maxBy(children, 'lastAccessed');
            const visitCount = sumBy(children, 'visitCount');
            const { origin } = new URL(children[0].url);
            return { url: origin, title: host, children, lastAccessed, visitCount };
        });
    }

    async getViewHistories(href: string) {
        const { host, hostname = host } = new URL(href);
        const hosts = await this.getHosts();
        const { children = [] } = hosts.find((item) => item.url === hostname) ?? {};
        return children;
    }
}
