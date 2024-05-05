import { LocalforageKey } from '@root/src/constants';
import { groupBy } from 'lodash-es';

chrome.tabs.query({}).then(async (tabs) => {
    const key = LocalforageKey.Windows;
    const group = groupBy(tabs, 'windowId');
    const result = await localforage.getItem(key);
    localforage.setItem(key, { ...result, ...group });
});
