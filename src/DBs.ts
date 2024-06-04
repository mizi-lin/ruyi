import { SettingDB } from './db';
import { UrlsDBStore } from './UrlsDBStore';
import { DBStore } from './DBStore';

export type DBKey = string | number;
// 存储tab标签相关信息
export const TabsDB = localforage.createInstance({ name: 'ruyi-tabs2' });
// 存储window窗口相关信息
export const WindowsDB = localforage.createInstance({ name: 'ruyi-windows2' });
// 存储group标签组
export const TabGroupsDB = localforage.createInstance({ name: 'ruyi-tab-groups' });
// 存储tab标签相关信息
export const UrlsDB = localforage.createInstance({ name: 'ruyi-urls2' });
// 存储favicon相关信息
export const FaviconsDB = localforage.createInstance({ name: 'ruyi-favicons' });

export const windows$db = new DBStore(WindowsDB, true);
export const tabs$db = new DBStore(TabsDB, true);
export const tabGroups$db = new DBStore(TabGroupsDB, true);
export const urls$db = new UrlsDBStore(UrlsDB, true);
export const favicons$db = new DBStore(FaviconsDB, true);
export const setting$db = new DBStore(SettingDB, true);

export const db$map = new Map();
db$map.set('windows$db', windows$db);
db$map.set('tabs$db', tabs$db);
db$map.set('tabGroups$db', tabGroups$db);
db$map.set('urls$db', urls$db);
db$map.set('favicons$db', favicons$db);
db$map.set('setting$db', setting$db);
