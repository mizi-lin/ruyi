import { WindowSetting } from '@root/src/constants';
import { windowSettingAtom } from './store';

const ShowHistoryWindowTip = () => {
    const showHistoryWindow = useRecoilValue(windowSettingAtom(WindowSetting.showHistoryWindow));
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
