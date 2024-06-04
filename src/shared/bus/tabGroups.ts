import { tabGroups$db, tabs$db } from '@root/src/DBs';
import { toMap } from '../utils';

export const isTabGroup = async (tabGroupId) => {
    const tabGroupMap = await tabGroups$db.getAllMap();
    return tabGroupMap.has(tabGroupId);
};

export const isTabGroupByChrome = async (tabGroupId) => {
    const tabGroups = await chrome.tabGroups.query({});
    return toMap(tabGroups, 'id').has(tabGroupId);
};

export const updateTabGroups = async (tabGroups?: chrome.tabGroups.TabGroup) => {
    const tabGroups$ = tabGroups ?? (await chrome.tabGroups.query({}));

    await tabGroups$db.updateAll((item) => {
        return { ...item, active: false };
    });

    await tabGroups$db.updateRows(tabGroups$, 'id', async (item) => {
        const tabs$ = await chrome.tabs.query({ groupId: item.id, windowId: item.windowId });
        const tabIds = tabs$.map((tab) => tab.id);
        return { ...item, active: true, tabs: tabIds, lastAccessed: Date.now() };
    });
};

/**
 * 清理重复的标签组
 */
export const cleanupDuplicateTabGroups = async () => {
    const tabGroups = await tabGroups$db.getAll();
    const groupsMap = new Map();

    for await (const group of tabGroups) {
        const { tabs: tabIds, active } = group;
        const tabs = await tabs$db.byIds(tabIds);
        const urlkeys = tabs
            .map((tab) => tab.url)
            .sort()
            .join(',');

        if (groupsMap.has(urlkeys)) {
            if (active) {
                const preGroup = groupsMap.get(urlkeys);
                await tabGroups$db.remove(preGroup.id);
                groupsMap.set(urlkeys, tabs);
                continue;
            }

            await tabGroups$db.remove(group.id);
            continue;
        }

        groupsMap.set(urlkeys, group);
    }
};
