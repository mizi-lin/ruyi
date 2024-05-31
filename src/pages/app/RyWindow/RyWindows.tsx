import { Constants } from '@root/src/constants';
import styles from './styles.module.less';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Masonry from 'react-masonry-component';
import {
    useRemoveTab,
    useMoveTab,
    useOpenTab,
    useOpenWindow,
    useRemoveWindow,
    windowsStore,
    windowSearchAtom,
    searchByWindowsStore,
    tabMatcher,
    windowSettingAtom,
    usePinnedTab,
    windowsWithGroupStore
} from './store';
import IncognitoSvg from './assets/incognito.svg?react';
import TabSvg from './assets/tab.svg?react';
import SearchToolbar from './SearchToolbar';
import { SettingDBKeys } from '@root/src/db';
import MetTitle from '../components/MetTitle';
import tinycolor from 'tinycolor2';

const ShowHistoryWindowTip = lazy(() => import('./ShowHistoryWindowTip'));
export const nonFavicon = <Button icon={<TabSvg width={16} height={16} />} shape={'circle'} />;

export const Toolbar = ({ title, windowId, tabs, active, current, topHistory }) => {
    const removeWindow = useRemoveWindow();
    const openWindow = useOpenWindow();

    return (
        <div className={styles.toolbar}>
            <span style={{ fontSize: 16, fontWeight: 100 }}>{title}</span>
            <div>
                <Space>
                    <Badge color={Constants.PRIAMRY_COLOR} count={tabs?.length} />
                    {!current && (
                        <Tooltip title={active ? '打开窗口' : '重新激活窗口'}>
                            <ExportOutlined onClick={async () => await openWindow({ windowId, active, tabs })} />
                        </Tooltip>
                    )}
                    {active && (
                        <Tooltip title={'关闭窗口'}>
                            <PoweroffOutlined onClick={async () => await removeWindow({ windowId, active })} />
                        </Tooltip>
                    )}

                    {!active && !topHistory && (
                        <Tooltip title={'从历史记录中删除'}>
                            <DeleteOutlined onClick={async () => await removeWindow({ windowId, active })} />
                        </Tooltip>
                    )}
                </Space>
            </div>
        </div>
    );
};

export const TabItem = ({ tab, windowId, groupId, active, current, topHistory }) => {
    const search = useRecoilValue(windowSearchAtom);
    const isSearch = search && tabMatcher(tab, search);

    const openTab = useOpenTab();
    const closeTab = useRemoveTab();
    const pinnedTab = usePinnedTab();

    return (
        <Popover
            title={<div>{tab?.title}</div>}
            content={
                <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }} draggable={!topHistory}>
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
                        {/* <div>
                            windowId: {windowId} tab: {tab?.id}
                        </div> */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {!current && !topHistory && (
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
                            <Tooltip title={tab.pinned ? '取消标签固定' : '标签固定在当前窗口'}>
                                <PushpinOutlined
                                    onClick={() => pinnedTab({ tab, active })}
                                    style={active && tab.pinned ? { color: Constants.PRIAMRY_COLOR } : {}}
                                />
                            </Tooltip>
                            {!topHistory && (
                                <Tooltip title={`${active ? '关闭' : '删除'}该标签页`}>
                                    <DeleteOutlined onClick={() => closeTab({ tab, windowId, groupId, active })} />
                                </Tooltip>
                            )}
                        </div>
                        <div>
                            {tab?.lastAccessed && (
                                <span style={{ fontSize: 12, color: '#999' }}>
                                    {dayjs(tab?.lastAccessed).format('YYYY-MM-DD HH:mm:ss')}
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#777' }}>{tab?.url || tab?.pendingUrl}</div>
                </section>
            }
            placement="right"
            overlayStyle={{ maxWidth: 400, wordBreak: 'break-word' }}
        >
            <div className={clx(styles.item, { [styles.search]: isSearch })} onClick={() => openTab({ active, windowId, tab })}>
                {!topHistory && <HolderOutlined />}
                <Badge dot={active && tab.pinned} color={Constants.PRIAMRY_COLOR}>
                    <Avatar src={tab?.favIconUrl} icon={nonFavicon} size={20} />
                </Badge>

                <MetTitle style={{ flex: 1 }}>{tab?.title?.substring?.(0, 30)}</MetTitle>
            </div>
        </Popover>
    );
};

export const DraggableGroupItem = ({ group, window, inx }) => {
    const onlyMatched = useRecoilValueLoadable(windowSettingAtom(SettingDBKeys.TabsOnlyMatched));
    const { contents: matched } = useRecoilValueLoadable(searchByWindowsStore);
    if (!group.children?.length) return <></>;

    const isMatched = onlyMatched ? matched?.get?.(window.id)?.matched?.has?.(group.id) : true;

    if (!isMatched) return <></>;

    return (
        <Draggable key={group?.groupId} draggableId={`${group?.groupId}`} index={inx}>
            {(provided, snapshot) => {
                const color = tinycolor(group.color ?? 'grey');
                const translucentColor = color.setAlpha(0.2); // 设置为50%透明
                const translucentColorString = translucentColor.toRgbString(); // "rgba(255, 0, 0, 0.5)"
                return (
                    <section
                        ref={provided.innerRef}
                        style={{
                            ...provided.draggableProps.style
                        }}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                    >
                        <section className={styles.group} style={{ borderColor: translucentColorString, cursor: 'pointer' }}>
                            {!!group.title && <title>{group.title}</title>}
                            {group.children.map((item) => {
                                return <DraggableItem key={item.id} tab={item} inx={item.inx} window={window} />;
                            })}
                        </section>
                    </section>
                );
            }}
        </Draggable>
    );
};

export const DraggableItem = ({ tab, inx, window }) => {
    const search = useRecoilValue(windowSearchAtom);
    const onlyMatched = useRecoilValueLoadable(windowSettingAtom(SettingDBKeys.TabsOnlyMatched));
    if (onlyMatched?.contents && search && !tabMatcher(tab, search)) return <></>;
    return (
        <Draggable key={tab?.id} draggableId={`${tab?.id}`} index={inx}>
            {(provided, snapshot) => {
                return (
                    <div
                        key={tab?.id}
                        style={{
                            cursor: 'pointer',
                            ...provided.draggableProps.style
                        }}
                        className={clx(styles.tabs)}
                        ref={provided.innerRef}
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
    const { contents: windows } = useRecoilValueLoadable(windowsWithGroupStore);
    const { contents: matched } = useRecoilValueLoadable(searchByWindowsStore);

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
                    const { children, windowId, tabs, active, current, topHistory } = window;
                    const has = matched?.has?.(windowId) ?? true;
                    if (!has) return <></>;
                    return (
                        <Droppable key={windowId} droppableId={`${windowId}`} isDropDisabled={topHistory}>
                            {(provided, snapshot) => {
                                return (
                                    <section
                                        className={clx(styles.columns, {
                                            [styles.active]: active,
                                            [styles.currentWindow]: current,
                                            [styles.topHistory]: topHistory
                                        })}
                                        data-abc="谁占了谁便宜"
                                        key={windowId}
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        <Toolbar {...window} />
                                        {children.map((item, inx) => {
                                            return item.groupId > -1 ? (
                                                <DraggableGroupItem key={item.id} group={item} inx={inx} window={window} />
                                            ) : (
                                                <DraggableItem key={item.id} tab={item} inx={item.inx} window={window} />
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
    );
};

export const RyWindows = () => {
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
