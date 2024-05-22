/**
 * 向bg发送任务
 */
type SendTaskOptions = {
    type: string;
    options?: Record<string, any>;
};

export const SendTask = async ({ type, options }: SendTaskOptions) => {
    if (!type) return;
    await chrome.runtime.sendMessage({ type, options });
};

// 重建数据
SendTask.rebuild = 'rebuild';
