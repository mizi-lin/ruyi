import { tabGroupsStore, useModifyTabGroup, useRemoveTabGroup } from './store';
import { TabItem } from '../RyWindow/RyWindows';
import styles from './styles.module.less';
import Masonry from 'react-masonry-component';
import { currentWindowIdStore } from '../RyWindow/store';

const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];

const RyTabGroupsHeader = ({ item }) => {
    const [edit, setEdit] = useState(false);
    const [title, setTitle] = useState(item.title);

    const modify = useModifyTabGroup(item.id);

    const remove = useRemoveTabGroup(item);

    const onChangeTitle = (e) => {
        const value = e.target.value;
        setTitle(value);
    };

    const modifyTitle = async () => {
        await modify({ title });
    };

    return (
        <>
            <header>
                <title onMouseOver={() => setEdit(true)}>{item.title}</title>
                <nav>
                    {item.active ? (
                        <Tooltip title={'关闭标签组'}>
                            <CloseOutlined onClick={remove} />
                        </Tooltip>
                    ) : (
                        <Tooltip title={'删除标签组'}>
                            <DeleteOutlined onClick={remove} />
                        </Tooltip>
                    )}
                </nav>
            </header>
            {edit && (
                <div
                    className={styles.edit}
                    onMouseLeave={async () => {
                        await modify({ title });
                        setEdit(false);
                    }}
                >
                    <section>
                        <Input value={title} onChange={onChangeTitle} onPressEnter={modifyTitle} onBlur={modifyTitle} />
                    </section>
                    <section className={styles.colors}>
                        {colors.map((color) => {
                            return (
                                <span
                                    key={color}
                                    style={{ background: color }}
                                    onClick={() => {
                                        modify({ color });
                                    }}
                                ></span>
                            );
                        })}
                    </section>
                </div>
            )}
        </>
    );
};

const RyTabGroups = () => {
    const { contents: tabGroups } = useRecoilValueLoadable(tabGroupsStore);
    const currentWindowId = useRecoilValueLoadable(currentWindowIdStore);

    return (
        <>
            {/* @ts-ignore */}
            <Masonry className={styles.tabGroups} options={{ gutter: 16, percentPosition: true }}>
                {tabGroups?.data?.map?.((item) => {
                    const { id: groupId, windowId } = item;
                    const current = windowId === currentWindowId?.contents && item.active;
                    return (
                        <section
                            key={groupId}
                            style={{ border: `1px solid ${item.color}` }}
                            className={clx(styles.columns, {
                                [styles.active]: item.active,
                                [styles.current]: current
                            })}
                        >
                            <RyTabGroupsHeader item={item} />
                            <main style={{ display: 'blokc' }}>
                                {item?.tabs?.map?.((tab) => {
                                    return (
                                        <TabItem
                                            tab={tab}
                                            windowId={tab.windowId}
                                            current={current}
                                            active={item.active}
                                            topHistory={false}
                                        />
                                    );
                                })}
                            </main>
                        </section>
                    );
                })}
            </Masonry>
            <Divider>
                <span style={{ fontSize: 14, fontWeight: 200, color: '#999' }}>Chrome tabGroups API 接口有bug, 部分功能不稳定</span>
            </Divider>
        </>
    );
};

export default RyTabGroups;
