import fs from 'node:fs';
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const manifest = {
    manifest_version: 3,
    default_locale: 'zh_CN',
    /**
     * if you want to support multiple languages, you can use the following reference
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
     */
    name: '__MSG_extensionName__',
    version: packageJson.version,
    description: '__MSG_extensionDescription__',
    permissions: [
        'identity',
        'activeTab',
        'storage',
        'unlimitedStorage',
        'downloads',
        'tabs',
        'tabCapture',
        'tabGroups',
        'history',
        'scripting',
        'contextMenus'
    ],
    optional_permissions: ['offscreen', 'desktopCapture', 'alarms'],
    /**
     * Options 配置页
     */
    // options_page: 'src/pages/options/index.html',
    background: {
        service_worker: 'src/pages/background/index.js',
        type: 'module'
    },
    /**
     * Popup
     */
    action: {
        // default_popup: 'src/pages/popup/index.html',
        default_icon: 'ruyi-34.png'
    },
    /**
     * 空白页
     */
    // chrome_url_overrides: {
    //     newtab: 'src/pages/newtab/index.html'
    // },
    icons: {
        128: 'ruyi-128.png'
    },
    content_scripts: [
        {
            matches: ['http://*/*', 'https://*/*', '<all_urls>'],
            js: ['src/pages/content-script/index.js']
        }
    ],
    web_accessible_resources: [
        {
            resources: ['assets/js/*.js', 'assets/css/*.css', 'ruyi-128.png', 'ruyi-34.png'],
            matches: ['*://*/*']
        }
    ]
};

export default manifest;
