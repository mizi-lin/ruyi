import { RyWindows } from './RyWindows';
import { Layout } from './layout';
export const routes = [
    {
        path: '/',
        element: <Layout />,
        children: [
            { path: '/', element: <Navigate to="/windows" replace /> },
            { path: '/windows', element: <RyWindows />, index: true }
        ]
    }
];
