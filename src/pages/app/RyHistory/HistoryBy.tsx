import { TableProps } from 'antd';
import { toThousands } from '@root/src/shared/utils';
import { dateRender, getFaviconUrl, highlight } from '@root/src/shared/bus';
import { faviconStore, useDeleteHistory } from '../store';
import { nonFavicon } from '../RyWindow/RyWindows';

export const MultipleDeleteAction = ({ text, record }) => {
    const remove = useDeleteHistory();
    const columns = [
        { dataIndex: 'title', title: 'Title', ellipsis: true },
        { dataIndex: 'url', title: 'URL', ellipsis: true },
        { dataIndex: 'visitCount', title: '访问次数', width: 100 },
        { dataIndex: 'lastAccessed', title: '最后访问时间', width: 180, render: dateRender() }
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
export const DeleteAction = ({ text, record }) => {
    const remove = useDeleteHistory();
    return (
        <Popconfirm title={'? 确认删除'} description={'同时会删除浏览器的历史记录'} onConfirm={() => remove([record])}>
            <DeleteOutlined />
        </Popconfirm>
    );
};
export const OpenAction = ({ text, record }) => {
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

export const Favicon = ({ url }) => {
    const { contents } = useRecoilValueLoadable(faviconStore(url));
    return <Avatar src={contents} icon={nonFavicon} size={20} />;
};

export const baseColumns = (search, columns = []) => {
    return [
        {
            dataIndex: 'url',
            title: '',
            render: async (text) => <Favicon url={text} />
        },
        { dataIndex: 'title', title: 'Title', ellipsis: true, render: highlight(search) },
        { dataIndex: 'url', title: 'URL', ellipsis: true, render: highlight(search) },
        { dataIndex: 'visitCount', title: '访问次数', sorter: (a, b) => a.visitCount - b.visitCount, width: 110 },
        {
            dataIndex: 'lastAccessed',
            title: '最后访问时间',
            width: 180,
            sorter: (a, b) => a.lastAccessed - b.lastAccessed,
            render: dateRender()
        },
        ...columns
    ];
};

export const HistoryBy: FC<TableProps> = ({ columns = [], ...rest }) => {
    return (
        <Table
            columns={columns}
            expandable={{ childrenColumnName: 'null' }}
            pagination={{ pageSize: 100, showSizeChanger: false, showTotal: (total) => `Total ${toThousands(total, false)} Items` }}
            {...rest}
        />
    );
};
