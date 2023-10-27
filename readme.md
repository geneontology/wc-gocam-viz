![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)

# GO-CAM visualization Web Component

This web component allows to visualize GO-CAM from any website and create entity/activity views to highlight the flow of causal relationships.

## Usage

### Script tags

For a simple, static website using `<script>` tags is a quick way to get started. For example:

```html
<html>
  <head>
    <script type="module" src="https://unpkg.com/@geneontology/wc-gocam-viz/dist/wc-gocam-viz/wc-gocam-viz.esm.js"></script>
    <script nomodule="" src="https://unpkg.com/@geneontology/wc-gocam-viz/dist/wc-gocam-viz/wc-gocam-viz.js"></script> 
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  </head>
  <body>
    <wc-gocam-viz 
      id="gocam-1"
      gocam-id="568b0f9600000284"
    ></wc-gocam-viz>
  </body>
</html>
```

This will render a GO-CAM model highlighting the flow of regulations between
genes/activities.

### NPM package

#### Installation

To use the web component as part of a larger front-end application that has its
own bundling process, first install the dependency:

```shell
npm install @geneontology/wc-gocam-viz
```

#### Registering custom elements

Somewhere near the top level of your application you must define the custom
components from this package:

```js
import { defineCustomElements } from '@geneontology/wc-gocam-viz/loader'

defineCustomElements()
```

Now the `<wc-gocam-viz>` element can be used in your application's markup. 

#### Configuration for image assets

The legend feature of the component requires image assets to be served by your
application. These assets are distributed in the
`node_modules/@geneontology/wc-gocam-viz/dist/wc-gocam-viz/assets` directory. If
your applications uses a bundler you should configure it to automatically copy
the files in that directory to an `assets` directory in the build ouput.

A webpack configuration that uses the
[CopyWebpackPlugin](https://webpack.js.org/plugins/copy-webpack-plugin/) to do
this might look like:

```js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'node_modules/@geneontology/wc-gocam-viz/dist/wc-gocam-viz/assets'),
          to: path.resolve(__dirname, 'dist/assets'),
        },
      ],
    }),
  ],
};
```

For other bundlers, consider a similar configuration using one of the following plugins:

* [rollup-plugin-copy](https://github.com/vladshcherbin/rollup-plugin-copy)
* [vite-plugin-static-copy](https://github.com/sapphi-red/vite-plugin-static-copy)
* [esbuild-plugin-copy](https://github.com/LinbuduLab/esbuild-plugins/tree/main/packages/esbuild-plugin-copy)
