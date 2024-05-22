/**
 * 将输入的项转换为数组。如果输入项已经是数组，则直接返回该数组；如果输入项不是数组，则将其封装在一个数组中返回。
 * @param item 输入的项，可以是任意类型。
 * @returns {any[]} 返回一个数组，包含输入的项。
 */
export function upArray(item: any) {
    // 判断item是否为数组，是则直接返回，否则将其放入数组中返回
    return Array.isArray(item) ? item : [item];
}
