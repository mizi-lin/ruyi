import { Constants, LocalforageKey, MsgKey, SettingTemp, WindowState } from '@root/src/constants';
import styles from './styles.module.less';
import { groupBy } from 'lodash-es';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Masonry from 'react-masonry-component';
import { settingTemp, topHistoryStore, useStoreReload, windowSearchTemp, windowsTemp } from '../store';
import { use } from 'react/ts5.0';
import { useRemoveTab, useMoveTab, useOpenTab, useOpenWindow, useRemoveWindow, windowsStore } from './store';

const SearchToolbar = lazy(() => import('./SearchToolbar'));
const ShowHistoryWindowTip = lazy(() => import('./ShowHistoryWindowTip'));

export const Toolbar = ({ windowId, tabs, active, current }) => {
    const removeWindow = useRemoveWindow();
    const openWindow = useOpenWindow();

    return (
        <div className={styles.toolbar}>
            <span />
            <div>
                <Space>
                    <Badge color={Constants.PRIAMRY_COLOR} count={tabs?.length} />
                    {!current && (
                        <Tooltip title={active ? '打开窗口' : '重新激活窗口'}>
                            <ExportOutlined onClick={async () => await openWindow({ windowId, active, tabs })} />
                        </Tooltip>
                    )}
                    {active ? (
                        <Tooltip title={'关闭窗口'}>
                            <PoweroffOutlined onClick={async () => await removeWindow({ windowId, active })} />
                        </Tooltip>
                    ) : (
                        <Tooltip title={'从历史记录中删除'}>
                            <DeleteOutlined onClick={async () => await removeWindow({ windowId, active })} />
                        </Tooltip>
                    )}
                </Space>
            </div>
        </div>
    );
};

export const TabItem = ({ tab, windowId, active, current }) => {
    const search = useRecoilValue(windowSearchTemp);
    const isSearch = search && [tab?.title, tab?.url].join('').toLowerCase().indexOf(search) > -1;
    const nonFavicon = <Button icon={<FileOutlined />} shape={'circle'} />;
    const openTab = useOpenTab();
    const closeTab = useRemoveTab();

    return (
        <Popover
            title={<div>{tab?.title}</div>}
            content={
                <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ paddingBottom: 8, borderBottom: '1px solid #f5f5f5' }}>
                        <Space>
                            {!current && (
                                <Tooltip title="在当前窗口打开该标签页（复制标签页）">
                                    <ExportOutlined onClick={() => openTab({ windowId: chrome.windows.WINDOW_ID_CURRENT, tab })} />
                                </Tooltip>
                            )}
                            <Tooltip title={`新建窗口，打开该标签页（复制标签页）`}>
                                <BlockOutlined onClick={() => openTab({ tab })} />
                            </Tooltip>
                            <Tooltip title={`在隐私模式下，打开该标签页（复制标签页）`}>
                                <SwitcherOutlined onClick={() => openTab({ tab, incognito: true })} />
                            </Tooltip>
                            <Tooltip title={`${active ? '关闭' : '删除'}该标签页`}>
                                <CloseOutlined onClick={() => closeTab({ tab, windowId, active })} />
                            </Tooltip>
                        </Space>
                    </div>
                    <div>{tab?.url}</div>
                </section>
            }
            placement="right"
            overlayStyle={{ maxWidth: 400, wordBreak: 'break-word' }}
        >
            <div className={clx(styles.item, { [styles.search]: isSearch })} onClick={() => openTab({ windowId, tab })}>
                <HolderOutlined />
                <Avatar src={tab?.favIconUrl || nonFavicon} icon={nonFavicon} size={24} />
                <span style={{ flex: 1 }}>{tab?.title?.substring?.(0, 30)}</span>
            </div>
        </Popover>
    );
};

// export const RyWindows = () => {
//     const [windows, setWindows] = useRecoilState(windowsTemp);
//     const showHistoryWindow = useRecoilValue(settingTemp(SettingTemp.showHistoryWindow));
//     const showTopHistory = useRecoilValue(settingTemp(SettingTemp.showTopHistory));
//     const showCurrentWindow = useRecoilValue(settingTemp(SettingTemp.showCurrentWindow));
//     const [activeWindowIds, setActiveWindowIds] = useState([]);
//     const [reload, setReload] = useState(Math.random());
//     const [currentWindowId, setCurrentWindowId] = useState<number>();
//     const { contents } = useRecoilValueLoadable(topHistoryStore);

//     /**
//      * new
//      */
//     const { contents: windows$ } = useRecoilValueLoadable(windowsStore);

//     const listener = (request) => {
//         const { type, options } = request;
//         if (type === MsgKey.GetWindows) {
//             setWindows(options);
//         }

//         if (type === MsgKey.GetCurrentWindowId) {
//             setCurrentWindowId(options);
//         }
//     };

//     /**
//      * 激活tabId
//      */
//     const oepnTab = async (tab, isActive) => {
//         if (!isActive) {
//             // const { id: windowId } = await chrome.windows.getCurrent();
//             await chrome.tabs.create({ url: tab.url, windowId: chrome.windows.WINDOW_ID_CURRENT, active: true });
//             return;
//         }
//         const { id, windowId } = tab;
//         await chrome.windows.update(windowId, { focused: true });
//         await chrome.tabs.update(id, { active: true });
//     };

//     const onDragEnd = async (result) => {
//         const { source, destination, draggableId: tabId } = result;
//         if (!destination) return;

//         // 若当前窗口活跃状态，则直接移动tab
//         try {
//             const destWindowId = +destination.droppableId;
//             // 判断目标窗口是否存在
//             await chrome.windows.get(destWindowId);
//             await chrome.tabs
//                 .move(+tabId, {
//                     windowId: destWindowId,
//                     index: destination.index
//                 })
//                 .catch(async (e) => {
//                     const tabsMap = await localforage.getItem(LocalforageKey.TabsMap);
//                     const tab = tabsMap[tabId];
//                     tab &&
//                         (await chrome.tabs.create({
//                             url: tab.url,
//                             windowId: destWindowId,
//                             active: false
//                         }));
//                 });
//         } catch (e) {}

//         setReload(Math.random());
//     };

//     useEffect(() => {
//         chrome.runtime.onMessage.addListener(listener);
//         return () => {
//             chrome.runtime.onMessage.removeListener(listener);
//         };
//     }, []);

//     useEffect(() => {
//         localforage.getItem(LocalforageKey.Windows).then(async (vals = {}) => {
//             const value = vals || {};
//             console.log('windows', value);
//             const tabs = await chrome.tabs.query({});
//             const tabsMap = tabs.reduce((temp, tab) => {
//                 temp[tab.id] = tab;
//                 return temp;
//             }, {});
//             const activeWindows = groupBy(tabs, 'windowId');
//             const activeWindowsEntries = Object.entries(activeWindows).sort((a: any, b: any) => (a[0] - b[0] > 0 ? -1 : 1));
//             const activeWindowIds = Object.keys(activeWindows);
//             const inactiveWindows = Object.entries(value).filter(([windowId]) => {
//                 return !activeWindowIds.includes(windowId);
//             });
//             const windows$current = showCurrentWindow ? activeWindowsEntries : [];
//             const windows$history = showHistoryWindow ? inactiveWindows : [];
//             const windows$top = showTopHistory ? [contents?.topUrls, contents?.topPages, contents?.topOrigins] : [];
//             const windows = [...windows$top, ...windows$current, ...windows$history].filter(Boolean);
//             setWindows(windows);
//             setActiveWindowIds(activeWindowIds);
//             // 过滤只有空白页的视窗window
//             const activeWindowMap = Object.entries(activeWindows).filter(([windowId, tabs]) => {
//                 return tabs.map(({ url }) => url).join('') !== '';
//             });
//             // 本地存储
//             await localforage.setItem(LocalforageKey.Windows, { ...value, ...Object.fromEntries(activeWindowMap) });
//             // 存储tab，历史访问记录
//             await localforage.setItem(LocalforageKey.TabsMap, tabsMap);
//         });
//     }, [reload, showHistoryWindow, showTopHistory, showCurrentWindow, contents?.topUrls]);

//     useEffect(() => {
//         chrome.windows.getCurrent().then((windows) => {
//             setCurrentWindowId(windows.id);
//         });
//     });

//     return (
//         <section className={styles.windows}>
//             <Suspense fallback={<></>}>
//                 <SearchToolbar setReload={setReload} />
//             </Suspense>
//             {/* @ts-ignore */}
//             <Masonry className={styles.windows} options={{ gutter: 16, percentPosition: true }}>
//                 <DragDropContext onDragEnd={onDragEnd}>
//                     {windows.map(([windowId, tabs]) => {
//                         const isActive = activeWindowIds.includes(windowId);
//                         return (
//                             <Droppable key={windowId} droppableId={`${windowId}`}>
//                                 {(provided, snapshot) => {
//                                     return (
//                                         <section
//                                             className={clx(styles.columns, {
//                                                 [styles.active]: activeWindowIds.includes(windowId),
//                                                 [styles.currentWindow]: windowId === String(currentWindowId),
//                                                 [styles.topHistory]: 100 < +windowId && +windowId < 200
//                                             })}
//                                             key={windowId}
//                                             ref={provided.innerRef}
//                                             {...provided.droppableProps}
//                                         >
//                                             <Toolbar
//                                                 tabs={tabs}
//                                                 windowId={windowId}
//                                                 activeWindowIds={activeWindowIds}
//                                                 setReload={setReload}
//                                             />
//                                             {tabs.map((tab, inx) => {
//                                                 return (
//                                                     <Draggable key={tab.id} draggableId={`${tab.id}`} index={inx}>
//                                                         {(provided, snapshot) => {
//                                                             return (
//                                                                 <div
//                                                                     key={tab.id}
//                                                                     ref={provided.innerRef}
//                                                                     style={{
//                                                                         cursor: 'pointer',
//                                                                         ...provided.draggableProps.style
//                                                                     }}
//                                                                     className={clx(styles.tabs, { [styles.group]: tab.groupId > 0 })}
//                                                                     onClick={() => oepnTab(tab, isActive)}
//                                                                     {...provided.draggableProps}
//                                                                     {...provided.dragHandleProps}
//                                                                 >
//                                                                     <TabItem tab={tab} />
//                                                                 </div>
//                                                             );
//                                                         }}
//                                                     </Draggable>
//                                                 );
//                                             })}
//                                         </section>
//                                     );
//                                 }}
//                             </Droppable>
//                         );
//                     })}
//                 </DragDropContext>
//             </Masonry>
//             <Suspense fallback={<></>}>
//                 <ShowHistoryWindowTip />
//             </Suspense>
//         </section>
//     );
// };

export const RyWindows = () => {
    // const [windows, setWindows] = useRecoilState(windowsTemp);
    const showHistoryWindow = useRecoilValue(settingTemp(SettingTemp.showHistoryWindow));
    const showTopHistory = useRecoilValue(settingTemp(SettingTemp.showTopHistory));
    const showCurrentWindow = useRecoilValue(settingTemp(SettingTemp.showCurrentWindow));
    const [activeWindowIds, setActiveWindowIds] = useState([]);
    const [reload, setReload] = useState(Math.random());
    const [currentWindowId, setCurrentWindowId] = useState<number>();
    const { contents } = useRecoilValueLoadable(topHistoryStore);

    /**
     * new
     */
    const { contents: windows } = useRecoilValueLoadable(windowsStore);
    const storeReload = useStoreReload();
    const move = useMoveTab();

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        const index = destination.index;
        const targetWindowId = +destination.droppableId;
        const sourceWindowId = +source.droppableId;
        const tabId = +draggableId;
        await move({ sourceWindowId, targetWindowId, index, tabId });
    };

    useEffect(() => {
        const listener = (request) => {
            const { type, data } = request;
            console.log('onMessage -->>', request);
            if (type === MsgKey.DataReload) {
                storeReload();
            }
        };
        chrome.runtime.onMessage.addListener(listener);
        return () => {
            chrome.runtime.onMessage.removeListener(listener);
        };
    }, []);

    return (
        <section className={styles.windows}>
            <Suspense fallback={<></>}>
                <SearchToolbar setReload={setReload} />
            </Suspense>
            {/* @ts-ignore */}
            <Masonry className={styles.windows} options={{ gutter: 16, percentPosition: true }}>
                <DragDropContext onDragEnd={onDragEnd}>
                    {windows?.data?.map?.((window) => {
                        const { windowId, tabs, active, current, topHistory } = window;
                        return (
                            <Droppable key={windowId} droppableId={`${windowId}`}>
                                {(provided, snapshot) => {
                                    return (
                                        <section
                                            className={clx(styles.columns, {
                                                [styles.active]: active,
                                                [styles.currentWindow]: current,
                                                [styles.topHistory]: topHistory
                                            })}
                                            key={windowId}
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            <Toolbar {...window} setReload={setReload} />
                                            {tabs.map((tab, inx) => {
                                                // console.log(windowId, '--->', tab?.id, inx, tab);
                                                return (
                                                    <Draggable key={tab?.id} draggableId={`${tab?.id}`} index={inx}>
                                                        {(provided, snapshot) => {
                                                            return (
                                                                <div
                                                                    key={tab?.id}
                                                                    ref={provided.innerRef}
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                        ...provided.draggableProps.style
                                                                    }}
                                                                    className={clx(styles.tabs, { [styles.group]: tab?.groupId > 0 })}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                >
                                                                    <TabItem tab={tab} {...window} />
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
            <Suspense fallback={<></>}>
                <ShowHistoryWindowTip />
            </Suspense>
        </section>
    );
};

export default memo(RyWindows, () => true);
