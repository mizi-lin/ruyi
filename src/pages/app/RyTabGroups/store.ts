import { tabGroups$db, tabs$db } from '@root/src/DBs';
import { orderBy } from 'lodash-es';
import { reloadStore } from '../store';
import { asyncMap } from '@root/src/shared/utils';

export const tabGroupsStore = selector({
    key: 'tabGroupsStore',
    get: async ({ get }) => {
        get(reloadStore);
        const tabGroups$ = await tabGroups$db.getAll();

        const tabGroups = await asyncMap(tabGroups$, async (item) => {
            const { tabs: tabIds, ...rest } = item;
            const tabs = await tabs$db.byIds(tabIds, (item, key) => {
                return item ?? { id: key };
            });
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

export const useOpenTabGroup = (record: Row) => {
    return useRecoilCallback(() => () => {
        chrome.runtime.sendMessage({
            type: 'openTabGroup',
            options: { record }
        });
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

export const useOpenTabGroupInCurrentWindow = (record: Row) => {
    return useRecoilCallback(({ refresh }) => async () => {
        await chrome.runtime.sendMessage({
            type: 'openTabGroupInCurrentWindow',
            options: { tabGroupId: record.id, record }
        });
        refresh(tabGroupsStore);
    });
};
