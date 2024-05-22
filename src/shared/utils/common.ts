export function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, ms);
    });
}

export async function asyncMap<T, K>(list: T[], fn: (val: T, index: number) => Promise<K>): Promise<K[]> {
    // 使用 Promise.all 等待所有的异步操作完成
    return await Promise.all(
        list.map(async (item, index) => {
            // 对每个元素调用异步函数，并返回结果
            return await fn(item, index);
        })
    );
}

/**
 * 创建一个异步防抖函数，确保在给定的时间间隔内只执行最后一次调用。
 * @param {Function} func - 要防抖的函数。
 * @param {number} wait - 延迟毫秒数，在此期间内连续调用函数会被忽略，除非再次调用 debounce 函数以重新开始计时。
 * @returns {Function} 返回一个新的防抖函数，当调用时，将在 wait 毫秒后执行原函数，如果在此期间再次调用，则会重置计时。
 */
export function asyncDebounce(func: (...args: any[]) => Promise<any>, wait: number): (...args: any[]) => Promise<any> {
    let timeoutId: NodeJS.Timeout | null = null;

    async function debounced(...args: any[]) {
        if (timeoutId) clearTimeout(timeoutId);

        timeoutId = setTimeout(async () => {
            timeoutId = null;
            await func(...args);
        }, wait);
    }

    return debounced;
}
