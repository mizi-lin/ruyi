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
                <div className={styles.logo}>如意</div>
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
