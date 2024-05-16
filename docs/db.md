
一个Tab可以有多个URL

```ts
type URLInfo = {
    // FavIcon URL
    favIconUrl: string
    // Web URL
    url: string
    // 网页文本内容，用于数字查询
    body: string
    // 网页title
    title: string
    // 最后更新时间
    lastAccessed: number
}

type URLS: Map<url, URLInfo>

// 暂时不需要
// type URL_TAB_MAP: Map<url, Set<TabID>>
```

```ts
// tabDB
type TABS: Map<tabId, tab> 
```

```ts
// windowDB
type WINDOWS: Map<windowId, window>
type WINDOW_TAB_MAP: Map<windowId, Set<TabID>>
```

```ts
// groupDB
type GROUPS: Map<groupId, group>
type GROUP_TAB_MAP: Map<groupId, tabId[]>
```

