import { MsgKey } from '@root/src/constants';
import styles from './styles.module.less';
import { groupBy, set } from 'lodash-es';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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
        <section className={styles.windows}>
            <DragDropContext onDragEnd={onDragEnd}>
                {windows.map(([windowId, tabs]) => {
                    const title = tabs.map(({ title }) => title).join(' & ');
                    return (
                        <Droppable key={windowId} droppableId={`s_${windowId}`}>
                            {(provided, snapshot) => {
                                return (
                                    <section key={windowId} ref={provided.innerRef} {...provided.droppableProps}>
                                        {tabs.map((tab, inx) => {
                                            return (
                                                <Draggable key={tab.id} draggableId={`s_${tab.id}`} index={inx}>
                                                    {(provided, snapshot) => {
                                                        return (
                                                            <div
                                                                key={tab.id}
                                                                ref={provided.innerRef}
                                                                style={{ cursor: 'pointer', ...provided.draggableProps.style }}
                                                                onClick={() => oepnTab(tab)}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                            >
                                                                <Avatar src={tab?.favIconUrl || nonFavicon} icon={nonFavicon} size={24} />
                                                                {/* <Tooltip
                                                                    title={
                                                                        <>
                                                                            <div>{tab.title}</div>
                                                                            <div>{tab.url}</div>
                                                                        </>
                                                                    }
                                                                >
                                                                    <Badge dot={tab.active}>
                                                                        <Avatar
                                                                            src={tab?.favIconUrl || nonFavicon}
                                                                            icon={nonFavicon}
                                                                            size={24}
                                                                        />
                                                                    </Badge>
                                                                </Tooltip> */}
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
        </section>
    );
};
