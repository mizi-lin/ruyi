import { SettingDBKeys } from '@root/src/db';
import { orderBy, rest, values } from 'lodash-es';
import { selectorFamily } from 'recoil';

const { sendMessage } = chrome.runtime;

/**
 * 站点浏览记录搜索
 */
export const viewerHistoriesSearchAtom = atom({
    key: 'ruyi/viewerHistoriesSearchAtom',
    default: ''
});

export const siteViewHistoriesStore = selectorFamily({
    key: 'ruyi/siteViewHistoriesStore',
    get:
        (url: string) =>
        async ({ get }) => {
            if (!url) return [];
            const { data } = await sendMessage({ type: 'urls$db.getAll' });
            const { host, hostname = host } = new URL(url);
            return data.filter(({ url }) => {
                if (!url) return false;
                const { host, hostname: hostname$ = host } = new URL(url);
                return hostname$ === hostname;
            });
        }
});

export const viewerHistoriesStore = selectorFamily({
    key: 'ruyi/viewerHistoriesStore',
    get:
        (url: string) =>
        ({ get }) => {
            const data = get(siteViewHistoriesStore(url));
            const search = get(viewerHistoriesSearchAtom);
            const data$ = data.filter(({ url, title, summary = '' }) => {
                return [url, title, summary].join('.').includes(search);
            });
            return orderBy(data$, 'visitCount', 'desc');
        }
});

/**
 * 是否显示搜索引擎
 */
export const ruyiSearchEngineStatusAtom = atom({
    key: 'ruyi/ruyiSearchStatusAtom',
    default: false
});

/**
 * 引擎store
 */
export const ruyiSearchEnginesStore = selector({
    key: 'ruyi/ruyiSearchEnginesStore',
    get: async () => {
        const { data } = await sendMessage({ type: 'setting$db.getValue', args: [SettingDBKeys.RuyiSearchEngines] });
        return Object.values(data).map((item: Row, inx: number) => {
            item.inx = inx;
            return item;
        });
    }
});

/**
 * 当前引擎
 */
export const ruyiSearchCurrentEngineAtom = atom({
    key: 'ruyi/ruyiSearchEngineAtom',
    default: selector({
        key: 'ruyi/ruyiSearchEngineAtom/default',
        get: async ({ get }) => {
            const { data: current } = await sendMessage({ type: 'setting$db.getValue', args: [SettingDBKeys.RuyiSearchCurrentEngine] });
            const data = get(ruyiSearchEnginesStore);
            return current ?? data?.at?.(0);
        }
    }),
    effects: [
        ({ onSet }) => {
            onSet(async (value) => {
                await sendMessage({ type: 'setting$db.setValue', args: [SettingDBKeys.RuyiSearchCurrentEngine, value] });
            });
        }
    ]
});

/**
 * 切换搜索引擎
 */
export const useSwitchSearchEngine = () => {
    return useRecoilCallback(({ snapshot, set }) => async () => {
        const current = await snapshot.getPromise(ruyiSearchCurrentEngineAtom);
        const engines = await snapshot.getPromise(ruyiSearchEnginesStore);

        const inx = (current.inx + 1) % engines.length;
        const switcher = engines[inx];
        set(ruyiSearchCurrentEngineAtom, switcher);
    });
};

/**
 * 搜索引擎搜索词
 */
export const ruyiSearchKeywordAtom = atom({
    key: 'ruyi/ruyiSearchKeywordAtom.keyword',
    default: ''
});

export const aa = atom({
    key: 'ruyi/ruyiSearchKeywordAtom.aa',
    default: ''
});

/**
 * 获取搜索引擎下拉列表
 */
export const resultByEngineStore = selector({
    key: 'ruyi/resultByEngineStore',
    get: async ({ get }) => {
        const keyword = get(ruyiSearchKeywordAtom);
        if (!keyword) return [];
        const engine = get(ruyiSearchCurrentEngineAtom);
        const { data } = await sendMessage({ type: 'engineSearch', options: { keyword, engine, href: window.location.href } });
        return { data };
    }
});
