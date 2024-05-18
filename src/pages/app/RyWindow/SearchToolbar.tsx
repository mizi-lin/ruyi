import { WindowSetting, WindowState } from '@root/src/constants';
import styles from './styles.module.less';
import { useOpenMatchedTabToNewWindow, useOpenWindow, useRemoveVariousTabs, windowSettingAtom } from './store';
import { windowSearchAtom, windowsMatchedStore } from './store';
import { DB, SettingDBKeys } from '@root/src/db';

const SearchToolbar = () => {
    const [search, setSearch] = useRecoilState(windowSearchAtom);
    const [showHistory, setShowHistory] = useRecoilStateLoadable(windowSettingAtom(SettingDBKeys.TabsShowHistoryWindows));
    const [showActiveWindows, setActiveWindows] = useRecoilStateLoadable(windowSettingAtom(SettingDBKeys.TabsShowActiveWindows));
    const [showTopHistory, setTopHistory] = useRecoilStateLoadable(windowSettingAtom(SettingDBKeys.TabsShowTopViewer));
    const [onlyShowMatched, setOnlyShowMatched] = useRecoilStateLoadable(windowSettingAtom(SettingDBKeys.TabsOnlyMatched));
    const { contents: matched } = useRecoilValueLoadable(windowsMatchedStore);

    const openMatchedTabs = useOpenMatchedTabToNewWindow();
    const openWindow = useOpenWindow();
    const removeTabs = useRemoveVariousTabs();

    return (
        <section className={styles.searchToolbar}>
            <div>
                <Space>
                    <Tooltip title={'新建窗口'}>
                        <Button type="primary" shape={'circle'} icon={<PlusOutlined />} onClick={() => openWindow({})} />
                    </Tooltip>
                    <Input
                        allowClear
                        placeholder="web URL / title"
                        value={search}
                        size="large"
                        style={{ width: 500, borderRadius: 32 }}
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                    />

                    {!!matched?.length && (
                        <Space>
                            <span>{matched?.length} Matched</span>
                            <Tooltip title={'将匹配到的结果在新窗口打开'}>
                                <SelectOutlined onClick={() => openMatchedTabs('keepSource')} />
                            </Tooltip>
                            <Tooltip title={'将匹配到的结果在移动到新窗口打开(删除原窗口Tab)'}>
                                <ExportOutlined onClick={() => openMatchedTabs('deleteSource')} />
                            </Tooltip>
                            <Tooltip title={'删除匹配到的结果'}>
                                <DeleteOutlined onClick={() => removeTabs()} />
                            </Tooltip>
                        </Space>
                    )}
                </Space>
            </div>
            <div>
                <Space>
                    <span>Only Matched</span>
                    <Switch value={onlyShowMatched?.contents} onChange={setOnlyShowMatched} />
                    <span>Top History</span>
                    <Switch value={showTopHistory?.contents} onChange={setTopHistory} />
                    <span>活跃窗口</span>
                    <Switch value={showActiveWindows?.contents} onChange={setActiveWindows} />
                    <span>历史窗口</span>
                    <Switch value={showHistory?.contents} onChange={setShowHistory} />
                </Space>
            </div>
        </section>
    );
};

export default SearchToolbar;
