import { Constants, LocalforageKey, MsgKey, StorageKey, WindowState } from '@root/src/constants';
import styles from './styles.module.less';
import { groupBy, toLower } from 'lodash-es';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Masonry from 'react-masonry-component';
import { showWindowHistoryTemp, windowSearchTemp, windowsMatchedTemp, windowsTemp } from './store';

export const Toolbar = ({ windowId, tabs, activeWindowIds, setReload }) => {
    const isActive = activeWindowIds.includes(windowId);

    const deleteWindow = async (windowId) => {
        const windows = await localforage.getItem(LocalforageKey.Windows);
        console.log('windows', windowId, windows);
        delete windows[windowId];
        await localforage.setItem(LocalforageKey.Windows, windows);
        setReload(Math.random());
    };

    const closeWindow = async (windowId) => {
        await chrome.windows.remove(windowId);
        setReload(Math.random());
    };

    const openWindow = async (windowId, isActive) => {
        if (isActive) {
            await chrome.windows.update(windowId, { focused: true });
            setReload(Math.random());
            return;
        }

        const windows = await localforage.getItem(LocalforageKey.Windows);
        const { id } = await chrome.windows.create({});
        const tabs = windows[windowId];
        for await (const tab of tabs) {
            await chrome.tabs.create({ url: tab.url, windowId: id });
        }
        await chrome.windows.update(id, { focused: true, state: WindowState.MAXIMIZED });
    };

    const openFullscreenWindow = async (windowId, isActive) => {
        if (isActive) {
            await chrome.windows.update(windowId, { focused: true, state: WindowState.FULLSCREEN });
            setReload(Math.random());
            return;
        }

        const windows = await localforage.getItem(LocalforageKey.Windows);
        const { id } = await chrome.windows.create({});
        const tabs = windows[windowId];
        for await (const tab of tabs) {
            await chrome.tabs.create({ url: tab.url, windowId: id });
        }
        await chrome.windows.update(id, { focused: true, state: WindowState.FULLSCREEN });
    };

    return (
        <div className={styles.toolbar}>
            <span />
            <div>
                <Space>
                    <Badge color={Constants.PRIAMRY_COLOR} count={tabs?.length} />
                    <Tooltip title={isActive ? '打开窗口' : '重新激活窗口'}>
                        <ExportOutlined onClick={async () => await openWindow(+windowId, isActive)} />
                    </Tooltip>
                    <Tooltip title={isActive ? '全屏窗口' : '重新激活窗口，并全屏化'}>
                        <FullscreenOutlined onClick={async () => await openFullscreenWindow(+windowId, isActive)} />
                    </Tooltip>
                    {isActive ? (
                        <Tooltip title={'关闭视窗'}>
                            <PoweroffOutlined onClick={async () => await closeWindow(+windowId)} />
                        </Tooltip>
                    ) : (
                        <Tooltip title={'从历史记录中删除'}>
                            <DeleteOutlined onClick={async () => await deleteWindow(+windowId)} />
                        </Tooltip>
                    )}
                </Space>
            </div>
        </div>
    );
};

export const TabItem = ({ tab }) => {
    const search = useRecoilValue(windowSearchTemp);
    const isSearch = search && [tab.title, tab.url].join('').toLowerCase().indexOf(search) > -1;
    const nonFavicon = <Button icon={<FileOutlined />} shape={'circle'} />;
    return (
        <Popover
            title={<div>{tab.title}</div>}
            content={<div>{tab.url}</div>}
            placement="right"
            overlayStyle={{ maxWidth: 400, wordBreak: 'break-word' }}
        >
            <div className={clx(styles.item, { [styles.search]: isSearch })}>
                <HolderOutlined />
                <Avatar src={tab?.favIconUrl || nonFavicon} icon={nonFavicon} size={24} />
                <span>{tab.title?.substring(0, 30)}</span>
            </div>
        </Popover>
    );
};

export const SearchToolbar = ({ setReload }) => {
    const [search, setSearch] = useRecoilState(windowSearchTemp);
    const [showHistory, setShowHistory] = useRecoilState(showWindowHistoryTemp);
    const matched = useRecoilValue(windowsMatchedTemp);

    /**
     * 新建窗口
     */
    const createWindow = async (reload = true) => {
        const { id } = await chrome.windows.create({});
        setTimeout(async () => {
            await chrome.windows.update(id, { state: WindowState.MAXIMIZED });
        }, 100);
        reload && setReload(Math.random());
        return id;
    };

    /**
     * 匹配
     */
    const matchedToWindow = async () => {
        const windowId = await createWindow(false);
        for await (const tab of matched) {
            await chrome.tabs.create({ windowId, url: tab.url });
        }
    };

    /**
     * 移动匹配到的tab到新窗口
     */
    const moveMatchedToWindow = async () => {
        const windowId = await createWindow(false);
        for await (const tab of matched) {
            try {
                await chrome.tabs.move(tab.id, { windowId, index: -1 });
            } catch (e) {
                await chrome.tabs.create({ windowId, url: tab.url });
            }
        }
    };

    return (
        <section className={styles.searchToolbar}>
            <div>
                <Space>
                    <Input
                        allowClear
                        placeholder="web URL / title"
                        value={search}
                        size="large"
                        style={{ width: 500, borderRadius: 32 }}
                        onChange={(e) => {
                            setSearch(toLower(e.target.value));
                        }}
                    />

                    {!!matched?.length && (
                        <>
                            <span>{matched?.length} Matched</span>
                            <Tooltip title={'将匹配到的结果在移动到新窗口打开(删除原窗口Tab)'}>
                                <Button type="primary" shape="circle" icon={<ExportOutlined />} onClick={moveMatchedToWindow} />
                            </Tooltip>
                            <Tooltip title={'将匹配到的结果在新窗口打开'}>
                                <Button shape="circle" icon={<SelectOutlined />} onClick={matchedToWindow} />
                            </Tooltip>
                        </>
                    )}
                </Space>
            </div>
            <div>
                <Space>
                    <span>历史窗口</span>
                    <Switch value={showHistory} onChange={setShowHistory} />
                    <Button type="primary" shape={'circle'} icon={<PlusOutlined />} onClick={() => createWindow()} />
                </Space>
            </div>
        </section>
    );
};

export const RyWindows = () => {
    const [windows, setWindows] = useRecoilState(windowsTemp);
    const showHistory = useRecoilValue(showWindowHistoryTemp);
    const [activeWindowIds, setActiveWindowIds] = useState([]);
    const [reload, setReload] = useState(Math.random());

    const listener = (request) => {
        const { type, options } = request;
        if (type === MsgKey.GetWindows) {
            setWindows(options);
        }
    };

    /**
     * 激活tabId
     */
    const oepnTab = async (tab, isActive) => {
        if (!isActive) {
            // const { id: windowId } = await chrome.windows.getCurrent();
            await chrome.tabs.create({ url: tab.url, windowId: chrome.windows.WINDOW_ID_CURRENT, active: true });
            return;
        }
        const { id, windowId } = tab;
        await chrome.windows.update(windowId, { focused: true });
        await chrome.tabs.update(id, { active: true });
    };

    const onDragEnd = async (result) => {
        const { source, destination, draggableId: tabId } = result;
        if (!destination) return;
        // 若当前窗口活跃状态，则直接移动tab

        try {
            const destWindowId = +destination.droppableId;
            // 判断目标窗口是否存在
            await chrome.windows.get(destWindowId);
            await chrome.tabs
                .move(+tabId, {
                    windowId: destWindowId,
                    index: destination.index
                })
                .catch(async () => {
                    const tabsMap = await localforage.getItem(LocalforageKey.TabsMap);
                    const tab = tabsMap[tabId];
                    tab &&
                        (await chrome.tabs.create({
                            url: tab.url,
                            windowId: destWindowId,
                            active: false
                        }));
                });
        } catch (e) {
            console.log('', e);
        }

        setReload(Math.random());
    };

    useEffect(() => {
        chrome.runtime.onMessage.addListener(listener);
        return () => {
            chrome.runtime.onMessage.removeListener(listener);
        };
    }, []);

    useEffect(() => {
        localforage.getItem(LocalforageKey.Windows).then(async (value = {}) => {
            const tabs = await chrome.tabs.query({});
            const tabsMap = tabs.reduce((temp, tab) => {
                temp[tab.id] = tab;
                return temp;
            }, {});
            const activeWindows = groupBy(tabs, 'windowId');
            const activeWindowIds = Object.keys(activeWindows);
            const inactiveWindows = Object.entries(value).filter(([windowId]) => {
                return !activeWindowIds.includes(windowId);
            });
            const windows = showHistory ? [...Object.entries(activeWindows), ...inactiveWindows] : Object.entries(activeWindows);
            setWindows(windows);
            setActiveWindowIds(activeWindowIds);
            // 过滤只有空白页的视窗window
            const activeWindowMap = Object.entries(activeWindows).filter(([windowId, tabs]) => {
                return tabs.map(({ url }) => url).join('') !== '';
            });
            // 本地存储
            await localforage.setItem(LocalforageKey.Windows, { ...value, ...Object.fromEntries(activeWindowMap) });
            // 存储tab，历史访问记录
            await localforage.setItem(LocalforageKey.TabsMap, tabsMap);
        });
    }, [reload, showHistory]);

    return (
        <section className={styles.windows}>
            <SearchToolbar setReload={setReload} />
            {/* @ts-ignore */}
            <Masonry className={styles.windows} options={{ gutter: 16, percentPosition: true }}>
                <DragDropContext onDragEnd={onDragEnd}>
                    {windows.map(([windowId, tabs]) => {
                        const isActive = activeWindowIds.includes(windowId);
                        return (
                            <Droppable key={windowId} droppableId={`${windowId}`}>
                                {(provided, snapshot) => {
                                    return (
                                        <section
                                            className={clx(styles.columns, { [styles.active]: activeWindowIds.includes(windowId) })}
                                            key={windowId}
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            <Toolbar
                                                tabs={tabs}
                                                windowId={windowId}
                                                activeWindowIds={activeWindowIds}
                                                setReload={setReload}
                                            />
                                            {tabs.map((tab, inx) => {
                                                return (
                                                    <Draggable key={tab.id} draggableId={`${tab.id}`} index={inx}>
                                                        {(provided, snapshot) => {
                                                            return (
                                                                <div
                                                                    key={tab.id}
                                                                    ref={provided.innerRef}
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                        ...provided.draggableProps.style
                                                                    }}
                                                                    className={clx(styles.tabs, { [styles.group]: tab.groupId > 0 })}
                                                                    onClick={() => oepnTab(tab, isActive)}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                >
                                                                    <TabItem tab={tab} />
                                                                </div>
                                                            );
                                                        }}
                                                    </Draggable>
                                                );
                                            })}
                                        </section>
                                    );
                                }}
                            </Droppable>
                        );
                    })}
                </DragDropContext>
            </Masonry>
            {showHistory && (
                <Divider>
                    <span style={{ fontSize: 14, fontWeight: 200, color: '#999' }}>只保存三个月内或近30个历史窗口</span>
                </Divider>
            )}
        </section>
    );
};
