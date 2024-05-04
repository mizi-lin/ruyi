import { ConfigProvider } from 'antd';
import { RouterProvider } from 'react-router';
import { createHashRouter } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';

import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import { Constants } from '@root/src/constants';
import { routes } from './routes';

dayjs.locale('zh-cn');

export function App() {
    return (
        <Fragment>
            <ConfigProvider
                locale={zhCN}
                theme={{
                    token: {
                        colorPrimary: Constants.PRIAMRY_COLOR
                    }
                }}
            >
                <RouterProvider router={createHashRouter(routes, { basename: '/' })} fallbackElement={<></>} />
            </ConfigProvider>
        </Fragment>
    );
}
