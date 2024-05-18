const RyBookmarks = () => {
    return (
        <section>
            <h3>书签管理</h3>
            <ol>
                <li>对历史书签坏链检测和删除</li>
                <li>清理重复的书签或空文件夹</li>
                <li>对书签的访问度进行梳理，可以清理部分从未访问过的书签</li>
                <li>用标签形式对书签进行扁平化管理，避免嵌套多层</li>
                <li>书签可以设置为标签组</li>
                <li>可以搜索书签网页内容，进行聚合（v2 或AI+ 进行内容梳理）</li>
                <li>可以设置快捷键打开书签</li>
                <li>书签市场（共享书签 v3 前置-会员系统)</li>
            </ol>
        </section>
    );
};

export default RyBookmarks;
