import { ruyi } from '@root/src/shared/utils';
import { engineMap } from './utils/engine';

const funcMap = new Map();

funcMap.set('engineSearch', async (options, sendResponse) => {
    const { keyword, engine } = options;
    const { api, params, key, responseType = 'json' } = engine;
    const response = api ? await ruyi(api, { method: 'get', responseType, params: { ...params, [key]: keyword } }) : engine;
    const data = await engineMap.get(engine.value)?.(response, options);
    console.log(':::--->>o', data);
    sendResponse({ data });
});

chrome.runtime.onMessage.addListener(async (request, render, sendResponse) => {
    const { type, options } = request;
    if (!funcMap.has(type)) return;
    try {
        console.log('from-content-message', request);
        await funcMap.get(type)?.(options, sendResponse);
        return true;
    } catch (e) {
        console.trace(e);
    }
});
