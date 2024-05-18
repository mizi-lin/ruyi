/**
 * 跟历史记录相关的业务方法
 */
import { get, orderBy } from 'lodash-es';

/**
 * 根据历史记录统计计数
 */
export function countHistory(
    temp: Map<string, any>,
    key: string | ((item: Record<string, any>, arr: Record<string, any>) => string),
    valuefn?: (item: Record<string, any>) => Record<string, any>
) {
    const map = new Map();
    temp.forEach((item) => {
        const key$ = typeof key === 'function' ? key(item, temp) : get(item, key);
        const item$ = map.get(key$) ?? {};
        const visitCount = (item$?.visitCount || 0) + item?.visitCount;
        const ids = [...(item$?.ids ?? []), item.id];
        const urls = [...(item$?.urls ?? []), item.url];
        const children = [...(item$?.children ?? []), item];
        const [last] = orderBy(children, 'lastVisitTime', 'desc');
        const result = { ...item$, ...last, visitCount, ids, urls, children, key: key$ };
        map.set(key$, valuefn?.(result) ?? result);
    });
    return map;
}

/**
 * 将history的数据伪装成window entries格式
 */
export function historyMockWindow(histories: Rows, mockWindowId, title) {
    const data = histories.map((item) => {
        // @todo 有tab库里匹配
        const { url, visitCount, title } = item;
        return { url, visitCount, title, id: Math.random() };
    });

    return { windowId: mockWindowId, tabs: data, active: false, current: false, topHistory: true, title };
}
