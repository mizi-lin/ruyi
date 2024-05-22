const MetTitle: FC<PropsWithChildren & { style: CSSProperties }> = ({ style, children }) => {
    return <title style={{ ...style }}>{children}</title>;
};

export default MetTitle;
