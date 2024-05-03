# Ruyi Tab Manager

Chrome Tabs 标签页管理插件

Window, Group, bookmark, history 统一管理

## 功能

记录当前标签，在 popup 面板中
用户可以根据需求，对标签页进行管理

### 标签管理面板

按 window 和 group 进行标签管理

#### window

当前window下所有的标签，按window进行分组，界面显示favicon，hover 显示标题和url
对历史记录进行管理，按访问次数，提供 top 10 访问网址，top 访问网站，并提供所有的历史记录(一个网址一天只记录一次访问次数)
可以随时打开历史url, 可以按时间/访问次数排序
可以激活任意窗口，可以关闭关联的tab，可以让tab穿越到其他window(可以分身穿越窗口)
可以给window配置颜色

#### group

Group 可以直接打开一个 window, 也可以直接在当前的window中打开
Group 所在的window 下打开的tab可以自动登记到该Group中，
在Group管理中可以选择下次打开的时候，是否需要打开该Group, 记录所有的Group, 
可以选择Group 与 Window 自带的Group 部分同步
（Chrome Group 会自动消失）

### Tab 管理

#### 标签

-   用户可以对网址进行打标签
-   可以根据AI 自动生成标签 （需后端支持）
-   可以根据标签打开该标签下所有的网址(或指定 如 top10, 或一周内，一个内)
-   生成summary (需后端支持)

### 固定标签功能扩展

我们通常会将常用的网站固定在window上，比如gmail, github 等

在原 chrome 固定标签，是将标签固定在window的第一tab的位置，

若有多个 window，该 pined tab 不会跟随window移动，

ruyi 将提供该功能，pined tab 永远会在固定在当前活跃的window上

当然也可以配置专属window的pined tab

### 迁移书签功能

书签功能应该与标签功能结合

### 历史记录

历史记录可以定时删除，可以配置删除规则（glob 或 pattern）

### 按快捷键，呼唤出常用的网站

-   搜索引擎 gg: google, bb: baidu
-   翻译网站 tt: 百度翻译 | google翻译
-   可自定义快捷键

### 中文文档

中文技术文档，第一期提供 前端的中文文档

### weekly

生成前端周报 

### 阅读模式

主体内容，阅读模式 

### 数据同步 

-   使用 local.storage.sync 存储数据，可以同步到其他设备
-   构建服务，存储数据到服务器，记录人生的所有历史记录（这点可以所收费项目，或创业）-> v3

```
可以根据网页时光机访问历史记录
https://web.archive.org/web/20060701000000*/http://news.sina.com.cn/c/2003-01-30/1030893251.shtml
```
