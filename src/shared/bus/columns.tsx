import { get } from 'lodash-es';
import { HighlightText } from 'react-highlight-element';

export function dateRender(formatter = 'YYYY-MM-DD HH:mm:ss', key?: string) {
    return (text, record) => {
        return dayjs(key ? get(record, key) : text).format(formatter);
    };
}

export function highlight(highlightText: string) {
    return (text, record) => {
        return <HighlightText text={text} highlight={highlightText} color={'#333'} backgroundColor="#ffffb8" />;
    };
}
