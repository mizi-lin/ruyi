import styles from './styles.module.less';
const items = [
    { label: 'Windows', key: '/windows', icon: <BlockOutlined /> },
    { label: 'Group', key: '/groups', icon: <GroupOutlined /> }
];
export const Layout: FC = () => {
    const { pathname } = useLocation();
    return (
        <article className={styles.layout}>
            <header className={styles.header}>
                <div className={styles.logo} style={{ background: `url(${chrome.runtime.getURL('ruyi-32.png')}) no-repeat left center` }}>
                    <Space>
                        <span style={{ fontSize: 14 }}>Ruyi</span>
                        <span>如意</span>
                    </Space>
                </div>
                <div></div>
            </header>
            <main className={styles.main}>
                <section className={styles.aside}>
                    <Menu selectedKeys={[pathname]} mode="inline" items={items} />
                </section>
                <section className={styles.contents}>
                    <Outlet />
                </section>
            </main>
        </article>
    );
};
