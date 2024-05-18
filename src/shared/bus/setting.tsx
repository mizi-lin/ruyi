import { SettingDB, SettingDBKeys } from '@root/src/db';
import { isNil } from 'lodash-es';

export async function ifsetting(key, defaultValue) {
    const value = await SettingDB.getItem(key);
    if (isNil(value)) {
        await SettingDB.setItem(key, defaultValue);
    }
}

/**
 * 配置值初始化
 */
export async function initSetting() {
    await ifsetting(SettingDBKeys.TabsShowHistoryWindows, true);
    await ifsetting(SettingDBKeys.TabsShowActiveWindows, true);
    await ifsetting(SettingDBKeys.TabsShowTopViewer, true);
    await ifsetting(SettingDBKeys.TabsOnlyMatched, false);
}
