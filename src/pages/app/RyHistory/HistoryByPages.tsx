import { historyPagesStore, searchTemp } from '../store';
import { dateRender, highlight } from '@root/src/shared/bus';
import { SearchTemp } from '@root/src/constants';
import { HistoryBy, OpenAction, baseColumns } from './HistoryBy';
import { MultipleDeleteAction } from './HistoryBy';
import { pagesStore } from './store';

export const HistoryByPages = () => {
    const { contents, state } = useRecoilValueLoadable(pagesStore);
    const [search, setSearch] = useRecoilState(searchTemp(SearchTemp.history));

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const columns = [
        {
            dataIndex: 'children',
            title: '子页面数',
            sorter: (a, b) => a?.children?.length - b?.children?.length,
            width: 120,
            render: (children) => children?.length
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
            <HistoryBy dataSource={contents?.data} loading={state === 'loading'} columns={baseColumns(search, columns)} />
        </>
    );
};
