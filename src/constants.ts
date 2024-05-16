export const Constants = {
    PRIAMRY_COLOR: '#1890ff'
};

export enum MsgKey {
    GetWindows = 'ruyi.msg.GetWindows',
    GetCurrentWindowId = 'ruyi.msg.GetCurrentWindowId',
    Loading = 'ruyi.msg.Loading',
    LoadedToApp = 'ruyi.msg.LoadedToApp',
    // 通知页面数据重新加载
    DataReload = 'ruyi.msg.DataReload'
}

export enum StorageKey {
    Windows = 'ruyi.storage.windows',
    LoadingText = 'ruyi.storage.LoadingText'
}

export enum LocalforageKey {
    Windows = 'ruyi.localforgot.windows',
    TabsMap = 'ruyi.localforgot.tabs.map',
    HistoryMap = 'ruyi.localforgot.history.map'
}

export enum WindowState {
    NORMAL = 'normal',
    MINIMIZED = 'minimized',
    MAXIMIZED = 'maximized',
    FULLSCREEN = 'fullscreen',
    LOCKED_FULLSCREEN = 'locked-fullscreen'
}

export enum SearchTemp {
    history = 'search.history'
}

export enum WindowSetting {
    showHistoryWindow = 'window.setting.showHistoryWindow',
    showCurrentWindow = 'window.setting.showCurrentWindow',
    showTopHistory = 'window.setting.showTopHistory',
    onlyShowMatched = 'window.setting.onlyShowMatched'
}
