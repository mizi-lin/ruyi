import { MsgKey } from '@root/src/constants';
import styles from './styles.module.less';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import Masonry from 'react-masonry-component';
import { useStoreReload } from '../store';
import { useMoveTab, windowsStore } from './store';
import SearchToolbar from './SearchToolbar';
import { Toolbar, DraggableItem, ShowHistoryWindowTip } from './RyWindows';

export const RyWindows = () => {
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
            <SearchToolbar />
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
                                            <Toolbar {...window} />
                                            {tabs.map((tab, inx) => {
                                                // console.log(windowId, '--->', tab?.id, inx, tab);
                                                return <DraggableItem tab={tab} inx={inx} window={window} />;
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
