import { windowSettingAtom } from './store';
import { SettingDBKeys } from '@root/src/db';

const ShowHistoryWindowTip = () => {
    const showHistoryWindow = useRecoilValueLoadable(windowSettingAtom(SettingDBKeys.TabsShowHistoryWindows));
    return (
        <>
            {showHistoryWindow?.contents && (
                <Divider>
                    <span style={{ fontSize: 14, fontWeight: 200, color: '#999' }}>只保存三个月内或近30个历史窗口</span>
                </Divider>
            )}
        </>
    );
};

export default ShowHistoryWindowTip;
