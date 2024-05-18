import { ValueIteratee, List, mapKeys } from 'lodash';
import { groupBy as gb } from 'lodash-es';
import { likeDecimal } from './numbers';

/**
 * 重写lodash groupBy
 * 主要是要将groupBy的结果对象的key，看过去像数字的，还原为数字
 */
export function groupBy<T>(collection: List<T>, iteratee?: ValueIteratee<T>) {
    const result = gb(collection, iteratee);
    return mapKeys(result, (value, key) => {
        return likeDecimal(key);
    });
}
