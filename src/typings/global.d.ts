/**
 * 使用全局window对象
 */
export {};
declare global {
    interface Window {
        [propKey: string]: any;
    }
}

declare const window: Window;

/**
 * EventTarget抽象程度大于Element, but 我们通常使用 target 为 Element
 */
declare interface DOMEvent<T extends EventTarget> extends Event {
    target: T;
}

/**
 * 多媒体资源文件
 * //-> vite 已自带
 */
// declare module '*.css';
// declare module '*.svg';
// declare module '*.png';
// declare module '*.jpg';
// declare module '*.jpeg';
// declare module '*.gif';
// declare module '*.bmp';
// declare module '*.tiff';
// declare module '*.mp4';
