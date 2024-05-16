import { TableProps } from 'antd';
import { toThousands } from '@root/src/shared/utils';

const HistoryBy: FC<TableProps> = ({ columns = [], ...rest }) => {
    return (
        <Table
            columns={columns}
            expandable={{ childrenColumnName: 'null' }}
            pagination={{ pageSize: 100, showSizeChanger: false, showTotal: (total) => `Total ${toThousands(total, false)} Items` }}
            {...rest}
        />
    );
};

export default HistoryBy;
