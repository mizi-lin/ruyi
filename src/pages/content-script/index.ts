import { send } from 'vite';

console.log('ruyi content script done');
// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//     if (request.type === 'parseHTML') {
//         console.log('request.type', request, sender);
//         const parser = new DOMParser();
//         const doc = parser.parseFromString(request.options, 'text/html');
//         const title = doc.querySelector('title').textContent;
//         const favIconUrl = doc.querySelector('head link[rel*="icon"]')?.href;
//         const body = doc.querySelector('body').textContent;
//         console.dir(doc.querySelector('body'));
//         sendResponse({ title, body, favIconUrl });
//     }
// });
