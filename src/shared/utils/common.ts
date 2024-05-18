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
