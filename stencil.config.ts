import { Config } from '@stencil/core';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import { sass } from '@stencil/sass';

export const config: Config = {
  namespace: 'wc-gocam-viz',
  plugins: [
    sass({
      injectGlobalPaths: [
        'src/scss/core.scss'
      ]
    })
  ],
  rollupPlugins: {
    after: [
      nodePolyfills(),
    ]
  },
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
      copy: [
        { src: 'components/**/*.html' }
      ]
    },
  ],
};
