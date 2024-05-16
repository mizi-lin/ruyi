import { SettingTemp, WindowState } from '@root/src/constants';
import styles from './styles.module.less';
import { toLower } from 'lodash-es';
import { settingTemp, windowSearchTemp, windowsMatchedTemp } from '../store';

const SearchToolbar = ({ setReload }) => {
    const [search, setSearch] = useRecoilState(windowSearchTemp);
    const [showHistory, setShowHistory] = useRecoilState(settingTemp(SettingTemp.showHistoryWindow));
    const [showCurrentWindow, setCurrentWindow] = useRecoilState(settingTemp(SettingTemp.showCurrentWindow));
    const [showTopHistory, setTopHistory] = useRecoilState(settingTemp(SettingTemp.showTopHistory));
    const matched = useRecoilValue(windowsMatchedTemp);

    /**
     * 新建窗口
     */
    const createWindow = async (reload = true) => {
        const { id } = await chrome.windows.create({});
        setTimeout(async () => {
            await chrome.windows.update(id, { state: WindowState.MAXIMIZED });
        }, 100);
        reload && setReload(Math.random());
        return id;
    };

    /**
     * 匹配
     */
    const matchedToWindow = async () => {
        const windowId = await createWindow(false);
        for await (const tab of matched) {
            await chrome.tabs.create({ windowId, url: tab.url });
        }
    };

    /**
     * 移动匹配到的tab到新窗口
     */
    const moveMatchedToWindow = async () => {
        const windowId = await createWindow(false);
        for await (const tab of matched) {
            try {
                await chrome.tabs.move(tab.id, { windowId, index: -1 });
            } catch (e) {
                await chrome.tabs.create({ windowId, url: tab.url });
            }
        }
    };

    return (
        <section className={styles.searchToolbar}>
            <div>
                <Space>
                    <Input
                        allowClear
                        placeholder="web URL / title"
                        value={search}
                        size="large"
                        style={{ width: 500, borderRadius: 32 }}
                        onChange={(e) => {
                            setSearch(toLower(e.target.value));
                        }}
                    />

                    {!!matched?.length && (
                        <>
                            <span>{matched?.length} Matched</span>
                            <Tooltip title={'将匹配到的结果在移动到新窗口打开(删除原窗口Tab)'}>
                                <Button type="primary" shape="circle" icon={<ExportOutlined />} onClick={moveMatchedToWindow} />
                            </Tooltip>
                            <Tooltip title={'将匹配到的结果在新窗口打开'}>
                                <Button shape="circle" icon={<SelectOutlined />} onClick={matchedToWindow} />
                            </Tooltip>
                        </>
                    )}
                </Space>
            </div>
            <div>
                <Space>
                    <span>Top History</span>
                    <Switch value={showTopHistory} onChange={setTopHistory} />
                    <span>当前窗口</span>
                    <Switch value={showCurrentWindow} onChange={setCurrentWindow} />
                    <span>历史窗口</span>
                    <Switch value={showHistory} onChange={setShowHistory} />
                    <Tooltip title={'新建窗口'}>
                        <Button type="primary" shape={'circle'} icon={<PlusOutlined />} onClick={() => createWindow()} />
                    </Tooltip>
                </Space>
            </div>
        </section>
    );
};

export default SearchToolbar;
