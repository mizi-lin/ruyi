import { indexOf } from 'lodash-es';

export const windowSearchTemp = atom({
    key: 'ruyi/windows/search',
    default: ''
});

export const showWindowHistoryTemp = atom({
    key: 'ruyi/windows/show/history',
    default: true
});

export const windowsTemp = atom<any[]>({
    key: 'ruyi/windows/temp',
    default: []
});

export const windowsMatchedTemp = selector({
    key: 'ruyi/windows/matched',
    get: ({ get }) => {
        const search = get(windowSearchTemp)?.toLowerCase();
        const windows = get(windowsTemp);
        const tabs = windows.map(([windowId, tabs]) => tabs).flat(Infinity);
        const matched = search
            ? tabs.filter(({ url, title }) => {
                  return [title, url].join('').toLowerCase().indexOf(search) > -1;
              })
            : [];

        return matched;
    }
});
