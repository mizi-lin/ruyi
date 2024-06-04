import type { DrawerProps } from 'antd';
import { viewerHistoriesSearchAtom, viewerHistoriesStore } from './store';
import ViewerSvg from './assets/viewer.svg?react';

export const SiteViewHistories: FC<DrawerProps> = (props) => {
    const { ...extra } = props;
    const hosts = useRecoilValue(viewerHistoriesStore(window.location.href));
    const [search, setSearch] = useRecoilState(viewerHistoriesSearchAtom);

    const onChange = (e) => {
        setSearch(e.target.value);
    };

    return (
        <Drawer placement={'right'} closable={false} className="ruyi-wrapper" width={500} zIndex={100000} {...extra}>
            <main className="site-view-histories" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <Input value={search} size={'large'} style={{ width: '100%', borderRadius: 28 }} onChange={onChange} />
                </div>
                {hosts.map(({ title, url, lastAccessed, visitCount }) => {
                    return (
                        <section key={url}>
                            <title>{title}</title>
                            <a href={url} target={'_blank'}>
                                {url}
                            </a>
                            <div style={{ paddingTop: 8, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ViewerSvg width={16} height={16} fill="#777" />
                                <cite>{visitCount}</cite>
                                <Divider type={'vertical'} />
                                <time>{dayjs(lastAccessed).format('YYYY-MM-DD HH:mm:ss')}</time>
                            </div>
                        </section>
                    );
                })}
            </main>
        </Drawer>
    );
};
