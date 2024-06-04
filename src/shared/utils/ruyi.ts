interface RuyiOptions extends Partial<Request> {
    params?: Record<string, any>;
    payload?: Record<string, any>;
    base?: string;
    responseType?: string;
}

function isAbsolute(api) {
    return /http[s]?:/.test(api);
}

export async function ruyi(api, options?: RuyiOptions) {
    if (!api) return;

    const { base, params = {}, payload = {}, method = 'get', responseType = 'json', headers = {}, ...extra } = options;

    // 处理 url 和 params(search)
    const url = isAbsolute(api) ? api : `${base}${api}`;
    const uri = new URL(url);
    const { searchParams } = uri;
    Object.entries(params).forEach(([key, value]) => {
        searchParams.set(key, value);
    });
    const url$ = uri.toString();

    const header$ = { Accept: 'application/json, text/plain, */*', ...headers };
    const config = { headers: header$, ...extra };

    // 处理 body (payload)
    if (['post', 'patch', 'put'].includes(method)) {
        const body = JSON.stringify(payload);
        // @ts-ignore
        config.body = body;
    }

    const response = await fetch(url$, config);

    // 检查响应状态
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // 根据responseType处理响应体
    let data;
    switch (responseType) {
        case 'json':
            data = await response.json();
            break;
        case 'text':
            data = await response.text();
            break;
        case 'blob':
            data = await response.blob();
            break;
        case 'arrayBuffer':
            data = await response.arrayBuffer();
            break;
        default:
            throw new Error(`Unsupported responseType: ${responseType}`);
    }

    return data;
}
