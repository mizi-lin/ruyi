import { urls$db } from '@root/src/DBs';

export const engineMap = new Map();

engineMap.set('baidu', (data, { keyword }) => {
    const { g } = data;
    return [
        { label: keyword, value: keyword },
        ...g.map(({ q }) => {
            return { label: q, value: q };
        })
    ];
});

engineMap.set('google', (text, { keyword }) => {
    const [, result] = text.split('\n');
    const [data] = JSON.parse(result);
    return [
        { label: keyword, value: keyword },
        ...data.map(([q]) => {
            return { label: q, value: q };
        })
    ];
});

engineMap.set('site', async (data, { keyword, href }) => {
    const urls = await urls$db.getViewHistories(href);
    return urls
        .filter(({ url, title, summary = '' }) => {
            return [url, title, summary].join(',').includes(keyword);
        })
        .map((item) => {
            return { ...item, label: item.title, value: item.url };
        });
});

engineMap.set('history', async (data, { keyword }) => {
    const urls = await urls$db.getAll();
    return urls
        .filter(({ url, title, summary = '' }) => {
            return [url, title, summary].join(',').includes(keyword);
        })
        .map((item) => {
            return { ...item, label: item.title, value: item.url };
        });
});
