import { setting$db } from '@root/src/DBs';
import { SettingDBKeys } from '@root/src/db';
import { toMap } from '../utils';

// JSON
// https://www.google.com/complete/search?client=firefox&q=江湖&channel=fen
// https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext-ansg&q=江湖
// https://suggestqueries.google.com/complete/search?json&client=firefox&q=江湖&hl=en

// 第三方代理
// https://kagi.com/api/autosuggest?q=江湖

// xml
// http://google.com/complete/search?output=toolbar&q=江湖

// JSONP
// https://www.google.com/complete/search?q=江湖&client=gws-wiz

// todo search types
export const ruyiSearchTypes = [
    {
        label: '百度',
        value: 'baidu',
        api: 'https://www.baidu.com/sugrec',
        search: 'https://www.baidu.com/s',
        key: 'wd',
        params: { ie: 'utf-8', json: 1, prod: 'pc', from: 'pc_web' }
    },
    {
        label: 'Google',
        value: 'google',
        api: 'https://www.google.com/complete/search',
        search: 'https://www.google.com/search',
        key: 'q',
        responseType: 'text',
        params: { cp: 2, client: 'gws-wiz', xssi: 't', dpr: 't' }
    },
    { label: '本站历史 (在本站中浏览过的网页进行搜索)', value: 'site' },
    { label: '浏览历史 (在浏览历史中的网页进行搜索)', value: 'history' }
    // { label: 'NPM', value: 'npm', api: 'https://www.npmjs.com/search/suggestions', search: 'https://www.npmjs.com/search', key: 'q' },
    // { label: 'Github', value: 'github' }
];

/**
 * 配置值初始化
 */
export async function updateSetting() {
    await setting$db.initValue(SettingDBKeys.TabsShowHistoryWindows, true);
    await setting$db.initValue(SettingDBKeys.TabsShowActiveWindows, true);
    await setting$db.initValue(SettingDBKeys.TabsShowTopViewer, true);
    await setting$db.initValue(SettingDBKeys.TabsOnlyMatched, false);
    await setting$db.initValue(SettingDBKeys.RuyiSearchEngines, toMap(ruyiSearchTypes, 'value'));

    // await setting$db.updateValue(SettingDBKeys.RuyiSearchEngines, toMap(ruyiSearchTypes, 'value'));
}
