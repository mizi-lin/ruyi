export const Constants = {
    PRIAMRY_COLOR: '#1890ff'
};

export enum MsgKey {
    GetWindows = 'ruyi.msg.GetWindows'
}

export enum StorageKey {
    Windows = 'ruyi.storage.windows'
}

export enum LocalforageKey {
    Windows = 'ruyi.localforgot.windows',
    TabsMap = 'ruyi.localforgot.tabs.map'
}

export enum WindowState {
    NORMAL = 'normal',
    MINIMIZED = 'minimized',
    MAXIMIZED = 'maximized',
    FULLSCREEN = 'fullscreen',
    LOCKED_FULLSCREEN = 'locked-fullscreen'
}
