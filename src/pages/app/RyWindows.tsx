import { MsgKey } from '@root/src/constants';
import styles from './styles.module.less';
import { groupBy, set } from 'lodash-es';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Masonry from 'react-masonry-component';

export const RyWindows = () => {
    const [windows, setWindows] = useState<any[]>([]);

    const nonFavicon = <Button icon={<FileOutlined />} shape={'circle'} />;

    const listener = (request) => {
        const { type, options } = request;
        if (type === MsgKey.GetWindows) {
            setWindows(options);
        }
    };

    /**
     * 激活tabId
     */
    const oepnTab = async (tab) => {
        // const { id, windowId } = tab;
        // await chrome.windows.update(windowId, { focused: true });
        // await chrome.tabs.update(id, { active: true });
    };

    const onDragEnd = (...args) => {
        console.log(args);
    };

    useEffect(() => {
        chrome.runtime.onMessage.addListener(listener);
        return () => {
            chrome.runtime.onMessage.removeListener(listener);
        };
    }, []);

    useEffect(() => {
        chrome.tabs.query({}).then((tabs) => {
            const group = groupBy(tabs, 'windowId');
            setWindows(Object.entries(group));
        });
    }, []);

    return (
        // @ts-ignore
        <Masonry className={styles.windows} options={{ gutter: 16, percentPosition: true }}>
            <DragDropContext onDragEnd={onDragEnd}>
                {windows.map(([windowId, tabs]) => {
                    const title = tabs.map(({ title }) => title).join(' & ');
                    return (
                        <Droppable key={windowId} droppableId={`s_${windowId}`}>
                            {(provided, snapshot) => {
                                return (
                                    <section className={styles.columns} key={windowId} ref={provided.innerRef} {...provided.droppableProps}>
                                        <div>{tabs?.length}</div>
                                        {tabs.map((tab, inx) => {
                                            return (
                                                <Draggable key={tab.id} draggableId={`s_${tab.id}`} index={inx}>
                                                    {(provided, snapshot) => {
                                                        return (
                                                            <div
                                                                key={tab.id}
                                                                ref={provided.innerRef}
                                                                style={{ cursor: 'pointer', ...provided.draggableProps.style }}
                                                                className={clx({ [styles.group]: tab.groupId > 0 })}
                                                                onClick={() => oepnTab(tab)}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                            >
                                                                <Popover
                                                                    title={<div>{tab.title}</div>}
                                                                    content={<div>{tab.url}</div>}
                                                                    placement="right"
                                                                    overlayStyle={{ maxWidth: 400, wordBreak: 'break-word' }}
                                                                >
                                                                    <div className={styles.item}>
                                                                        <HolderOutlined />
                                                                        <Avatar
                                                                            src={tab?.favIconUrl || nonFavicon}
                                                                            icon={nonFavicon}
                                                                            size={24}
                                                                        />
                                                                        <span>{tab.title?.substring(0, 30)}</span>
                                                                    </div>
                                                                </Popover>
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
    );
};
