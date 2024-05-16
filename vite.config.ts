/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { analyzer } from 'vite-bundle-analyzer';
import path, { resolve } from 'path';
import { getCacheInvalidationKey, getPlugins } from './utils/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { antdComponents, antdIcons, reactFunctions } from './auto-imports';
import { Constants } from './src/constants';
const rootDir = resolve(__dirname);
const srcDir = resolve(rootDir, 'src');
const pagesDir = resolve(srcDir, 'pages');

const isDev = process.env.__DEV__ === 'true';
const isProduction = !isDev;

export default defineConfig({
    resolve: {
        alias: {
            '@root': rootDir,
            '@src': srcDir,
            '@assets': resolve(srcDir, 'assets'),
            '@pages': pagesDir
        }
    },
    plugins: [
        ...getPlugins(isDev),
        react(),
        svgr(),
        // analyzer(),
        // viteCompression({
        //     threshold: 50000 // 50kb
        // }),
        AutoImport({
            dts: path.resolve(__dirname, '../src/typings/auto-imports.d.ts'),
            imports: [
                'recoil',
                'react-router-dom',
                {
                    '@ant-design/icons': antdIcons,
                    antd: antdComponents,
                    react: reactFunctions,
                    dayjs: [['default', 'dayjs']],
                    classnames: [['default', 'clx']],
                    axios: [['default', 'axios'], 'isCancel', 'AxiosError'],
                    localforage: [['default', 'localforage']]
                }
            ] as any
        })
    ],
    publicDir: resolve(rootDir, 'public'),
    build: {
        outDir: resolve(rootDir, 'dist'),
        /** Can slow down build speed. */
        sourcemap: true,
        minify: isProduction,
        modulePreload: false,
        reportCompressedSize: isProduction,
        // reportCompressedSize: true,
        emptyOutDir: !isDev,
        rollupOptions: {
            input: {
                app: resolve(pagesDir, 'app', 'index.html'),
                background: resolve(pagesDir, 'background', 'index.ts'),
                popup: resolve(pagesDir, 'popup', 'index.html'),
                'content-script': resolve(pagesDir, 'content-script', 'index.ts')
            },
            output: {
                entryFileNames: 'src/pages/[name]/index.js',
                chunkFileNames: isDev ? 'assets/js/[name].js' : 'assets/js/[name].[hash].js',
                assetFileNames: (assetInfo) => {
                    const { name } = path.parse(assetInfo.name);
                    const assetFileName = name === 'contentStyle' ? `${name}${getCacheInvalidationKey()}` : name;
                    return `assets/[ext]/${assetFileName}.chunk.[ext]`;
                }
                // manualChunks: (id) => {
                //     if (id.includes('node_modules')) {
                //         const arr = id.toString().split('node_modules/')[1].split('/');
                //         return arr[0];
                //     }
                // }
            }
        }
    },
    css: {
        // 指定传递给 CSS 预处理器的选项; 文件扩展名用作选项的键
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
                modifyVars: {
                    '@primary-color': Constants.PRIAMRY_COLOR
                }
            }
        }
    }
});
