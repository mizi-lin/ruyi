import { MsgKey, StorageKey } from '@root/src/constants';
import styles from './styles.module.less';

const RyLoading = () => {
    const [text, setText] = useState('');
    const [done, setDone] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        chrome.storage.local.onChanged.addListener((changes) => {
            const state = changes[StorageKey.LoadingText];
            setText(state.newValue);
            if (state.newValue === 'Done..') {
                setDone(true);
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            }
        });
    }, []);
    return (
        <article className={styles.loading}>
            <div className={styles.logo}></div>
            {!done && <div style={{ color: '#777' }}>{text}</div>}
            {done && <div style={{ color: '#333' }}>加载结束，正在进入系统</div>}
        </article>
    );
};

export default RyLoading;
