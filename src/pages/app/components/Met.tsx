const Met: FC<{ tag: string; style?: CSSProperties }> = ({ tag: Tag, style }) => {
    return <Tag style={{ display: 'block', ...(style ?? {}) }} />;
};

export default Met;
