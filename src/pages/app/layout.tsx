import styles from './styles.module.less';

const items = [
    { label: 'Windows 视窗', key: '/windows', icon: <BlockOutlined /> },
    { label: 'Group 组', key: '/groups', icon: <GroupOutlined /> },
    { label: 'History 访问记录', key: '/history', icon: <UnorderedListOutlined /> }
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
