import { HistoryByURLs } from './HistoryByURLs';
import { HistoryByHost } from './HistoryByHost';
import { HistoryByPages } from './HistoryByPages';

const items = [
    { key: 'url', label: '访问网址记录', children: <HistoryByURLs /> },
    { key: 'page', label: '访问页面记录', children: <HistoryByPages /> },
    { key: 'origin', label: '访问网站记录', children: <HistoryByHost /> }
];

export const RyHistory = () => {
    const [usp, setUsp] = useSearchParams();
    const onChange = (key) => {
        setUsp({ tab: key });
    };
    return (
        <>
            <header>
                <div className="ruyi-title">访问记录</div>
                <div className="ruyi-description">本页面只记录访问过的页面的次数和时间，并不会随着删除浏览器缓存而删除</div>
            </header>
            <Tabs activeKey={usp.get('tab') || 'url'} items={items} onChange={onChange} />
        </>
    );
};

export default memo(RyHistory, () => true);
