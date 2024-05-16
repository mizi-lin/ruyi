export const routes = [
    {
        path: '/',
        lazy: () => import('./Layout'),
        children: [
            { path: '/', element: <Navigate to="/windows" replace /> },
            { path: '/windows', lazy: () => import('./RyWindow'), index: true },
            { path: '/history', lazy: () => import('./RyHistory') }
        ]
    }
    // { path: '/loading', element: <RyLoading /> }
];
