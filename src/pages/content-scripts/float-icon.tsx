import ruyicon from './assets/ruyi-34.png';
import styles from './styles.module.less?raw';
import UrlsSvg from './assets/urls.svg?react';
import AppSvg from './assets/app.svg?react';
import SearchSvg from './assets/search.svg?react';
import { SiteViewHistories } from './site-view-histories';
import { ruyiSearchEngineStatusAtom } from './store';
import { useHotkeys } from 'react-hotkeys-hook';

export const FloatIcon: FC = () => {
    const [openToolbar, setOpenToolbar] = useState(true);
    const [openSiteViewHistories, setOpenSiteViewHistories] = useState(false);
    const setRuyiSearchStatus = useSetRecoilState(ruyiSearchEngineStatusAtom);

    const openRuyiApp = async () => {
        await chrome.runtime.sendMessage({ type: 'openApp' });
    };

    useHotkeys(['y'], () => setOpenToolbar(!openToolbar), [openToolbar]);
    useHotkeys(['r'], async () => await chrome.runtime.sendMessage({ type: 'openApp' }));

    return (
        <>
            <style>{styles}</style>
            <div className={clx('ruyi-float-icon', { active: openToolbar, inactive: !openToolbar })}>
                <span className="ruyi-logo">
                    <img src={ruyicon} style={{ width: 28, height: 28 }} />
                </span>
                <span className="ruyi-name">如意</span>
                <div className="ruyi-float-icon-tools">
                    <nav>
                        <Tooltip title={'该站访问记录'} placement="left" trigger={['hover', 'click']}>
                            <menu onClick={() => setOpenSiteViewHistories(true)}>
                                <UrlsSvg width={20} height={20} />
                            </menu>
                        </Tooltip>

                        <Tooltip title={'全局搜索, 快捷键 g'} placement="left" trigger={['hover', 'click']}>
                            <menu onClick={() => setRuyiSearchStatus(true)}>
                                <SearchSvg width={20} height={20} />
                            </menu>
                        </Tooltip>

                        <Tooltip title={'查看如意App, 快捷键: ^r | r'} placement="left" trigger={['hover', 'click']}>
                            <menu onClick={openRuyiApp}>
                                <AppSvg width={20} height={20} />
                            </menu>
                        </Tooltip>
                    </nav>
                </div>
            </div>

            {openSiteViewHistories && (
                <Suspense fallback={<></>}>
                    <SiteViewHistories title={'浏览历史'} open={openSiteViewHistories} onClose={() => setOpenSiteViewHistories(false)} />
                </Suspense>
            )}
        </>
    );
};
