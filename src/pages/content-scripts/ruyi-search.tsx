import { debounce } from 'lodash-es';
import {
    ruyiSearchKeywordAtom,
    resultByEngineStore,
    ruyiSearchCurrentEngineAtom,
    ruyiSearchEnginesStore,
    ruyiSearchEngineStatusAtom,
    useSwitchSearchEngine
} from './store';
import { useHotkeys } from 'react-hotkeys-hook';

export const RuyiSearchBox = () => {
    const setRuyiSearchStatus = useSetRecoilState(ruyiSearchEngineStatusAtom);
    const switchSearchEngine = useSwitchSearchEngine();
    const [currentEngine, setCurrentEngine] = useRecoilState(ruyiSearchCurrentEngineAtom);
    const options = useRecoilValue(ruyiSearchEnginesStore);
    const result = useRecoilValueLoadable(resultByEngineStore);
    const setKeyword = useSetRecoilState(ruyiSearchKeywordAtom);
    const searchMaskRef = useRef(null);
    const isSearchEngine = ['google', 'baidu'].includes(currentEngine.value);
    const inputRef = useRef(null);

    const switchEngine = (value) => {
        const item = options.find((item) => item.value === value);
        setCurrentEngine(item);
    };

    const optionRender = (option) => {
        const { label, value } = option;
        return (
            <section>
                <div>{label}</div>
                <div style={{ fontSize: 12, color: '#777' }}>{value}</div>
            </section>
        );
    };

    const onSelect = (value, option) => {
        // @todo 打开方式 target = _blank
        if (isSearchEngine) {
            const { search, key } = currentEngine;
            const uri = new URL(search);
            uri.searchParams.set(key, value);
            window.location.href = uri.toString();
            return;
        }
        window.location.href = value;
    };

    useEffect(() => {
        if (searchMaskRef?.current) {
            const mask = searchMaskRef.current;
            const input = mask.querySelector('input');
            const tabListener = async (event) => {
                if (event.keyCode === 9) {
                    await switchSearchEngine();
                    event.preventDefault();
                }
            };
            const maskListener = (event) => {
                const target = event.target;
                if (target.dataset.close === 'true') {
                    setRuyiSearchStatus(false);
                }
            };

            mask.addEventListener('click', maskListener);
            input.addEventListener('keydown', tabListener);

            return () => {
                input.removeEventListener('click', maskListener);
                input.removeEventListener('keydown', tabListener);
            };
        }
    }, [searchMaskRef?.current]);

    useEffect(() => {
        if (inputRef?.current) {
            setTimeout(() => {
                inputRef.current.focus();
            }, 300);
        }
    }, [inputRef?.current]);

    return (
        <article className="ruyi-search" ref={searchMaskRef} data-close={true}>
            <main data-close={false}>
                <div style={{ textAlign: 'right', padding: '0 16px 8px 0' }}>
                    <Dropdown
                        overlayStyle={{ zIndex: 10010 }}
                        menu={{
                            items: options.map(({ label, value: key }) => {
                                return { key, label };
                            }),
                            onClick: (item) => {
                                switchEngine(item.key);
                            }
                        }}
                    >
                        <Space size={8} style={{ cursor: 'pointer' }}>
                            <span style={{ color: '#fff' }}>{currentEngine?.label}</span>
                            <DownOutlined style={{ color: '#fff' }} />
                        </Space>
                    </Dropdown>
                </div>
                <div className={'gradient-border'}>
                    <Select
                        showSearch
                        ref={inputRef}
                        filterOption={false}
                        placeholder={`${currentEngine?.label} - 按Tab切换搜索引擎`}
                        dropdownStyle={{ zIndex: 10000, borderRadius: 20 }}
                        notFoundContent={null}
                        optionRender={isSearchEngine ? null : optionRender}
                        style={{ height: '100%', width: '100%', outline: 'none', borderRadius: 32 }}
                        options={result?.contents?.data ?? []}
                        onSearch={debounce(setKeyword, 200)}
                        onSelect={onSelect}
                    />
                </div>
            </main>
        </article>
    );
};

export const RuyiSearch = () => {
    const [ruyiSearchStatus, setRuyiSearchStatus] = useRecoilState(ruyiSearchEngineStatusAtom);

    useHotkeys(['g'], () => setRuyiSearchStatus(!ruyiSearchStatus), [ruyiSearchStatus]);
    useHotkeys(['esc'], () => setRuyiSearchStatus(false), []);

    return ruyiSearchStatus && <RuyiSearchBox />;
};
