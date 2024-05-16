import { historyOriginsStore, historyPagesStore, historyURLStore, searchTemp, useDeleteHistory } from '../store';
import { dateRender, highlight } from '@root/src/shared/bus';
import { SearchTemp } from '@root/src/constants';

const HistoryBy = lazy(() => import('./HistoryBy'));

const MultipleDeleteAction = ({ text, record }) => {
    const remove = useDeleteHistory();
    const columns = [
        { dataIndex: 'title', title: 'Title', ellipsis: true },
        { dataIndex: 'url', title: 'URL', ellipsis: true },
        { dataIndex: 'visitCount', title: '访问次数', width: 100 },
        { dataIndex: 'lastVisitTime', title: '最后访问时间', width: 180, render: dateRender() }
    ];
    return (
        <Popconfirm
            title={'? 确认删除'}
            description={
                <div style={{ maxHeight: 600, maxWidth: 800, overflow: 'scroll' }}>
                    <div style={{ padding: '16px 0' }}>
                        将会删除
                        <span style={{ fontSize: 16, padding: '0 4px', color: 'orange' }}>{record.children.length}</span>条浏览记录
                    </div>
                    <HistoryBy dataSource={record?.children ?? []} columns={columns} />
                </div>
            }
            onConfirm={() => remove(record?.children)}
        >
            <DeleteOutlined />
        </Popconfirm>
    );
};

const DeleteAction = ({ text, record }) => {
    const remove = useDeleteHistory();
    return (
        <Popconfirm title={'? 确认删除'} description={'同时会删除浏览器的历史记录'} onConfirm={() => remove([record])}>
            <DeleteOutlined />
        </Popconfirm>
    );
};

const OpenAction = ({ text, record }) => {
    const open = async (record) => {
        await chrome.tabs.create({
            url: record?.key ?? record?.url,
            windowId: chrome.windows.WINDOW_ID_CURRENT
        });
    };
    return (
        <Tooltip title="当前窗口打开">
            <ExportOutlined onClick={async () => await open(record)} />
        </Tooltip>
    );
};

const HistoryByURL = () => {
    const { contents, state } = useRecoilValueLoadable(historyURLStore);
    const [search, setSearch] = useRecoilState(searchTemp(SearchTemp.history));

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const columns = [
        { dataIndex: 'title', title: 'Title', ellipsis: true, render: highlight(search) },
        { dataIndex: 'url', title: 'URL', ellipsis: true, render: highlight(search) },
        { dataIndex: 'visitCount', title: '访问次数', sorter: (a, b) => a.visitCount - b.visitCount, width: 110 },
        {
            dataIndex: 'lastVisitTime',
            title: '最后访问时间',
            width: 180,
            sorter: (a, b) => a.lastVisitTime - b.lastVisitTime,
            render: dateRender()
        },
        {
            dataIndex: 'id',
            title: '操作',
            width: 80,
            render: (text, record) => {
                return (
                    <Space>
                        <DeleteAction {...{ text, record }} />
                        <OpenAction {...{ text, record }} />
                    </Space>
                );
            }
        }
    ];

    return (
        <>
            <Input
                allowClear
                size="large"
                value={search}
                style={{ width: 600, borderRadius: 16, marginBottom: 16 }}
                onChange={handleSearch}
            />
            <HistoryBy dataSource={contents?.data} loading={state === 'loading'} columns={columns} />
        </>
    );
};

const HistoryByPages = () => {
    const { contents, state } = useRecoilValueLoadable(historyPagesStore);
    const [search, setSearch] = useRecoilState(searchTemp(SearchTemp.history));

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const columns = [
        { dataIndex: 'key', title: 'Page URL', ellipsis: true, render: highlight(search) },
        { dataIndex: 'title', title: 'Title', ellipsis: true, render: highlight(search) },
        { dataIndex: 'visitCount', title: '访问次数', sorter: (a, b) => a.visitCount - b.visitCount, width: 110 },
        { dataIndex: 'children', title: '子页面数', width: 100, render: (children) => children?.length },
        {
            dataIndex: 'lastVisitTime',
            title: '最后访问时间',
            sorter: (a, b) => a.lastVisitTime - b.lastVisitTime,
            width: 180,
            render: dateRender()
        },
        {
            dataIndex: 'id',
            title: '操作',
            width: 80,
            render: (text, record) => {
                return (
                    <Space>
                        <MultipleDeleteAction {...{ text, record }} />
                        <OpenAction {...{ text, record }} />
                    </Space>
                );
            }
        }
    ];

    return (
        <>
            <Input
                allowClear
                size="large"
                value={search}
                style={{ width: 600, borderRadius: 16, marginBottom: 16 }}
                onChange={handleSearch}
            />
            <HistoryBy dataSource={contents?.data} loading={state === 'loading'} columns={columns} />
        </>
    );
};

const HistoryByOrgins = () => {
    const { contents, state } = useRecoilValueLoadable(historyOriginsStore);
    const [search, setSearch] = useRecoilState(searchTemp(SearchTemp.history));

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const columns = [
        { dataIndex: 'key', title: 'Origin', ellipsis: true, render: highlight(search) },
        { dataIndex: 'visitCount', title: '访问次数', sorter: (a, b) => a.visitCount - b.visitCount, width: 110 },
        { dataIndex: 'children', title: '子页面数', width: 100, render: (children) => children?.length },
        {
            dataIndex: 'lastVisitTime',
            title: '最后访问时间',
            sorter: (a, b) => a.lastVisitTime - b.lastVisitTime,
            width: 180,
            render: dateRender()
        },
        {
            dataIndex: 'id',
            title: '操作',
            width: 80,
            render: (text, record) => {
                return (
                    <Space>
                        <MultipleDeleteAction {...{ text, record }} />
                        <OpenAction {...{ text, record }} />
                    </Space>
                );
            }
        }
    ];

    return (
        <>
            <Input
                allowClear
                size="large"
                value={search}
                style={{ width: 600, borderRadius: 16, marginBottom: 16 }}
                onChange={handleSearch}
            />
            <HistoryBy dataSource={contents?.data} loading={state === 'loading'} columns={columns} />
        </>
    );
};

const items = [
    { key: 'url', label: '访问网址记录', children: <HistoryByURL /> },
    { key: 'page', label: '访问页面记录', children: <HistoryByPages /> },
    { key: 'origin', label: '访问网站记录', children: <HistoryByOrgins /> }
];

export const RyHistory = () => {
    const [usp, setUsp] = useSearchParams();
    const onChange = (key) => {
        setUsp({ tab: key });
    };
    return (
        <>
            <header>
                <div className="ruyi-title">访问记录</div>
                <div className="ruyi-description">本页面只记录访问过的页面的次数和时间，并不会随着删除浏览器缓存而删除</div>
            </header>
            <Tabs activeKey={usp.get('tab') || 'url'} items={items} onChange={onChange} />
        </>
    );
};

export default memo(RyHistory, () => true);
