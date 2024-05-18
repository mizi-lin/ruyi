import { isNil } from 'lodash-es';
import numeral from 'numeral';
/**
 * 数字格式化
 */
export const toThousands = (num: number, isUnit = true) => {
    if (isNil(num)) return '-';
    if (num === 0) return 0;
    if (num < 1000 && Math.ceil(num) === num) return num;
    return numeral(num)
        .format(isUnit ? '0,0.0a' : '0,0')
        .toUpperCase();
};

/**
 * 小数转百分数
 */
export const toPercent = (num: number, decimal: number = 0) => {
    const pad = decimal ? '0.'.padEnd(decimal + 2, '0') : '0';
    return numeral(num).format(`${pad}%`);
};

/**
 * 字符串看过去像数字，则就是数字
 * @returns number | string
 */
export function likeDecimal(num: number | string) {
    if (typeof num === 'number') return num;
    return isNaN(Number(num)) ? num : Number(num);
}

export function likeEntities(obj: Record<string | number, any>) {
    return Object.entries(obj).map(([a, b]) => {
        return [likeDecimal(a), b];
    });
}
