import styles from './styles.module.less';
import TabGroupSvg from './assets/tabs.svg?react';
import BookmarksSvg from './assets/bookmarks.svg?react';
import HistorySvg from './assets/history.svg?react';

const items = [
    { label: 'Windows 视窗', key: '/windows', icon: <BlockOutlined /> },
    { label: 'Tab Groups 标签组', key: '/tabgroups', icon: <TabGroupSvg width={'1em'} height={'1em'} /> },
    { label: 'Bookmarks 书签', key: '/bookmarks', icon: <BookmarksSvg width={'1em'} height={'1em'} /> },
    { label: 'History 访问记录', key: '/history', icon: <HistorySvg width={'1.3em'} height={'1.3em'} /> }
];

const Layout: FC = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    return (
        <article className={styles.layout}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    <Space>
                        <span style={{ fontSize: 14 }}>Ruyi</span>
                        <span>如意</span>
                    </Space>
                </div>
                <div></div>
            </header>
            <main className={styles.main}>
                <section className={styles.aside}>
                    <Menu selectedKeys={[pathname]} inlineCollapsed={true} mode="inline" items={items} onClick={(e) => navigate(e.key)} />
                </section>
                <section className={styles.contents}>
                    <Outlet />
                </section>
            </main>
        </article>
    );
};

export const Component = memo(Layout, () => true);
