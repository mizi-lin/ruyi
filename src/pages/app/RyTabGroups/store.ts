import { useRemoveTab } from './../RyWindow/store';
import { tabGroups } from './../../../DBStore';
import { tabGroups$db } from '@root/src/DBStore';
import { orderBy } from 'lodash-es';
import { reloadStore } from '../store';
import { DB, GetMap, TabDB } from '@root/src/db';

export const tabGroupsStore = selector({
    key: 'tabGroupsStore',
    get: async ({ get }) => {
        get(reloadStore);
        const tabsMap = await GetMap(TabDB, DB.TabDB.TabsMap);
        const tabGroups$ = await tabGroups$db.getAll();

        const tabGroups = tabGroups$.map((item) => {
            const { tabs: tabIds, ...rest } = item;
            const tabs = tabIds.map((tabId) => tabsMap.get(tabId) ?? { id: tabId });
            return { ...rest, tabs };
        });

        return { data: orderBy(tabGroups, ['active', 'lastAccessed'], ['desc', 'desc']) };
    }
});

export const useModifyTabGroup = (tabGroupId) => {
    return useRecoilCallback(({ refresh }) => async (record: Row) => {
        const item = await tabGroups$db.getObjectValue(tabGroupId);
        const result = { ...item, ...record };

        if (JSON.stringify(item) !== JSON.stringify(result)) {
            await chrome.runtime.sendMessage({
                type: 'modifyTabGroup',
                options: { tabGroupId, record }
            });

            await tabGroups$db.setValue(tabGroupId, result);
            refresh(tabGroupsStore);
        }
    });
};

export const useRemoveTabGroup = (record: Row) => {
    return useRecoilCallback(({ refresh }) => async () => {
        await chrome.runtime.sendMessage({
            type: 'removeTabGroup',
            options: { tabGroupId: record.id, record }
        });
        refresh(tabGroupsStore);
    });
};
