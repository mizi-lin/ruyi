import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import './from-db-message';
import './from-app-message';
import './from-content-message';
import 'webextension-polyfill';
import './runtime-listener';
import './windows-listener';
import './tabs-listener';
import './action-listener';
import './history-listener';
import './tab-groups-listener';
import './route-windows';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

console.log('background loaded');
