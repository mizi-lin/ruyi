import { historyURLStore, searchTemp } from '../store';
import { dateRender, highlight } from '@root/src/shared/bus';
import { SearchTemp } from '@root/src/constants';
import { HistoryBy, OpenAction, baseColumns } from './HistoryBy';
import { DeleteAction } from './HistoryBy';
import { urlsStore } from './store';

export const HistoryByURLs = () => {
    const { contents, state } = useRecoilValueLoadable(urlsStore);
    const [search, setSearch] = useRecoilState(searchTemp(SearchTemp.history));

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const columns = [
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
            <HistoryBy dataSource={contents?.data} loading={state === 'loading'} columns={baseColumns(search, columns)} />
        </>
    );
};
