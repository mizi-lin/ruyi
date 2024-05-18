import { get, isNumber } from 'lodash-es';
import { likeDecimal, likeEntities } from './numbers';

/**
 * 将数组转换为对象。每个数组元素基于指定的键（key）成为对象的属性，
 * 其中属性值为原始数组中对应的元素。
 * @param arr 一个元素类型为Record<string, any>的数组，表示待转换的数组。
 * @param key 一个字符串，表示用于在数组元素中提取属性值的键。
 * @returns 返回一个对象，其中每个属性的键是由数组元素中指定键的值决定的，
 *          属性值为对应的数组元素。
 */
export function toObj(arr: Rows, key: string) {
    // 使用数组的reduce方法来逐步构建目标对象
    return arr.reduce((temp, item) => {
        // 根据key从当前元素中获取属性值，用作对象的键
        const objKey = get(item, key);
        const key$ = likeDecimal(objKey);
        // 将获取到的键值对添加到temp对象中
        temp[key$] = item;
        // 返回更新后的对象
        return temp;
    }, {});
}

/**
 * 将数组转换为Map对象。
 * @param arr 一个包含Record对象的数组，每个对象至少包含一个由key指定的属性。
 * @param key 数组中每个对象用来在Map中作为键的属性名。
 * @returns 返回一个Map对象，其中键是根据key参数从数组对象中提取的值，值是数组中对应对象的引用。
 */
export function toMap(arr: Rows, key: string): Map<any, any> {
    // 将数组转换为对象，每个属性值为数组中对应元素的引用
    const obj = toObj(arr, key);
    // 将对象转换为Map，确保键的类型保持不变
    const map = new Map(likeEntities(obj) as Iterable<[any, any]>);
    return map;
}

/**
 * rows to set
 */
export function toSet(rows: Rows, key: string) {
    const keys = rows.map((item) => get(item, key));
    return new Set(keys);
}

export function insertSet(set: Set<any>, index: number, value: any) {
    const arr = [...set];
    const first = arr.slice(0, index);
    const last = arr.slice(index);
    return new Set([...first, value, ...last]);
}
