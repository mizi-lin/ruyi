import { tabGroups$db } from '@root/src/DBStore';
import { DB, GetMap, TabDB } from '@root/src/db';

export const updateTabGroups = async (tabGroups?: chrome.tabGroups.TabGroup) => {
    const tabGroups$ = tabGroups ?? (await chrome.tabGroups.query({}));

    await tabGroups$db.updateAll((item) => {
        return { ...item, active: false };
    });

    await tabGroups$db.updateRows(tabGroups$, 'id', async (item) => {
        const tabs$ = await chrome.tabs.query({ groupId: item.id, windowId: item.windowId });
        const tabs = tabs$.map((tab) => tab.id);
        return { ...item, active: true, tabs, lastAccessed: Date.now() };
    });
};

/**
 * 清理重复的标签组
 */
export const cleanupDuplicateTabGroups = async () => {
    const tabGroups = await tabGroups$db.getAll();
    const groupsMap = new Map();

    for await (const group of tabGroups) {
        const tabsMap = await GetMap(TabDB, DB.TabDB.TabsMap);
        const { tabs, active } = group;
        const urlkeys = tabs
            .map((tabId) => tabsMap.get(tabId)?.url)
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
