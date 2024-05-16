import { SettingTemp } from '@root/src/constants';
import { settingTemp } from '../store';

const ShowHistoryWindowTip = () => {
    const showHistoryWindow = useRecoilValue(settingTemp(SettingTemp.showHistoryWindow));
    return (
        <>
            {showHistoryWindow && (
                <Divider>
                    <span style={{ fontSize: 14, fontWeight: 200, color: '#999' }}>只保存三个月内或近30个历史窗口</span>
                </Divider>
            )}
        </>
    );
};

export default ShowHistoryWindowTip;
