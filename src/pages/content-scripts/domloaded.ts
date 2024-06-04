export function domloaded() {
    /**
     * 快捷键监控
     */
    let lastKey = '';
    let lastKeyTime = 0;
    document.body.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        const time = new Date().getTime();

        // 如果用户正在输入，不执行后续的代码
        const activeElement = document.activeElement;
        if (
            activeElement &&
            (activeElement.tagName.toUpperCase() === 'INPUT' ||
                activeElement.tagName.toUpperCase() === 'TEXTAREA' ||
                (activeElement as HTMLTextAreaElement).isContentEditable!)
        ) {
            return;
        }

        // 打开如意 App
        if (key === 'r' && lastKey === 'r' && time - lastKeyTime < 1000) {
            chrome.runtime.sendMessage({ type: 'openApp' });
        }

        // 打开搜索引擎
        if (key === 'y' && lastKey === 'y' && time - lastKeyTime < 1000) {
            chrome.runtime.sendMessage({ type: 'openSearchEngines' });
        }

        lastKey = key;
        lastKeyTime = time;
    });
}
