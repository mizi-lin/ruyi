import { Constants, MsgKey, WindowSetting } from '@root/src/constants';
import styles from './styles.module.less';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Masonry from 'react-masonry-component';
import { topHistoryStore, useStoreReload } from '../store';
import { searchByWindowsStore, tabMatcher, windowSettingAtom } from './store';
import { useRemoveTab, useMoveTab, useOpenTab, useOpenWindow, useRemoveWindow, windowsStore, windowSearchAtom } from './store';
import IncognitoSvg from './assets/incognito.svg?react';
import SearchToolbar from './SearchToolbar';

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
    const search = useRecoilValue(windowSearchAtom);
    const isSearch = search && tabMatcher(tab, search);
    const nonFavicon = <Button icon={<FileOutlined />} shape={'circle'} />;
    const openTab = useOpenTab();
    const closeTab = useRemoveTab();

    return (
        <Popover
            title={<div>{tab?.title}</div>}
            content={
                <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* <div style={{ fontSize: 12, color: '#999' }}>#{tab.id}</div> */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 32,
                            paddingBottom: 8,
                            borderBottom: '1px solid #f5f5f5'
                        }}
                    >
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {!current && (
                                <Tooltip title="在当前窗口打开该标签页（复制标签页）">
                                    <ExportOutlined onClick={() => openTab({ windowId: chrome.windows.WINDOW_ID_CURRENT, tab })} />
                                </Tooltip>
                            )}
                            <Tooltip title={`新建窗口，打开该标签页（复制标签页）`}>
                                <BlockOutlined onClick={() => openTab({ tab })} />
                            </Tooltip>
                            <Tooltip title={`在无痕隐私模式下，打开该标签页（复制标签页）`}>
                                <IncognitoSvg
                                    width={14}
                                    height={14}
                                    fontSize={14}
                                    onClick={() => openTab({ tab, incognito: true })}
                                    style={{ cursor: 'pointer' }}
                                />
                            </Tooltip>
                            <Tooltip title={`${active ? '关闭' : '删除'}该标签页`}>
                                <CloseOutlined onClick={() => closeTab({ tab, windowId, active })} />
                            </Tooltip>
                        </div>
                        <div>
                            {tab?.lastAccessed && (
                                <span style={{ fontSize: 12, color: '#999' }}>
                                    {dayjs(tab?.lastAccessed).format('YYYY-MM-DD HH:mm:ss')}
                                </span>
                            )}
                        </div>
                    </div>
                    <div>{tab?.url || tab?.pendingUrl}</div>
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

export const DraggableItem = ({ tab, inx, window }) => {
    const search = useRecoilValue(windowSearchAtom);
    const onlyMatched = useRecoilValue(windowSettingAtom(WindowSetting.onlyShowMatched));
    console.log('onlyMatched', onlyMatched, search, !tabMatcher(tab, search));
    if (onlyMatched && search && !tabMatcher(tab, search)) return <></>;
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
};

export const WindowPanels = () => {
    const { contents: windows } = useRecoilValueLoadable(windowsStore);
    const { contents: matched } = useRecoilValueLoadable(searchByWindowsStore);
    // const windows = useRecoilValue(searchByWindowsStore);
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

    return (
        // @ts-ignore
        <Masonry className={styles.windows} options={{ gutter: 16, percentPosition: true }}>
            <DragDropContext onDragEnd={onDragEnd}>
                {windows?.data?.map?.((window) => {
                    const { windowId, tabs, active, current, topHistory } = window;
                    const has = matched?.has?.(String(windowId)) ?? true;
                    if (!has) return <></>;
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
                                        <Toolbar {...window} />
                                        {tabs.map((tab, inx) => {
                                            // console.log(windowId, '--->', tab?.id, inx, tab);
                                            return <DraggableItem key={tab.id} tab={tab} inx={inx} window={window} />;
                                        })}
                                    </section>
                                );
                            }}
                        </Droppable>
                    );
                })}
            </DragDropContext>
        </Masonry>
    );
};

export const RyWindows = () => {
    /**
     * new
     */
    const storeReload = useStoreReload();

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
            <SearchToolbar />
            {/* @ts-ignore */}
            <WindowPanels />
            <Suspense fallback={<></>}>
                <ShowHistoryWindowTip />
            </Suspense>
        </section>
    );
};

export default memo(RyWindows, () => true);
