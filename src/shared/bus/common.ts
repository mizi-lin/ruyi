import { get } from 'lodash-es';

/**
 * 根据不同的规则分类
 */
export function toCountMap(arr: Rows, key: string | ((item: Record<string, any>, arr: Record<string, any>) => string), idKey = 'id') {
    const map = new Map();
    if (!arr?.length || !key) return map;
    for (const obj of arr) {
        const mapKey = typeof key === 'function' ? key(obj, arr) : get(obj, key);
        if (map.has(mapKey)) {
            const value = map.get(mapKey);
            value.count += 1;
            value.ids = [...value.ids, obj.id];
            value.urls = [...value.urls, obj.url];
            map.set(mapKey, value);
        } else {
            const value = { ...obj, count: 1, ids: [obj.id], urls: [obj.url] };
            map.set(mapKey, value);
        }
    }
    return map;
}
