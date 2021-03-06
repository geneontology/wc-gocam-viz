# wc-gocam-viz



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute              | Description                                                                                                                                                                 | Type      | Default     |
| ------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| `autoHideModal`     | `auto-hide-modal`      | Deprecated for the moment                                                                                                                                                   | `boolean` | `false`     |
| `gocamId`           | `gocam-id`             |                                                                                                                                                                             | `string`  | `undefined` |
| `graphFold`         | `graph-fold`           |                                                                                                                                                                             | `string`  | `"editor"`  |
| `repository`        | `repository`           | Used to connect to a barista instance. By default, always access production (prod) server prod = http://barista.berkeleybop.org/ dev  = http://barista-dev.berkeleybop.org/ | `string`  | `"prod"`    |
| `showActivity`      | `show-activity`        | Show/hide the activity in the activity node                                                                                                                                 | `boolean` | `false`     |
| `showGeneProduct`   | `show-gene-product`    | Show/hide the gene product in the activity node                                                                                                                             | `boolean` | `false`     |
| `showGoCamSelector` | `show-go-cam-selector` | If true, this will show the list of available GO-CAM in GO For more information, please refer to http://geneontology.org/docs/gocam-overview/                               | `boolean` | `false`     |
| `showHasInput`      | `show-has-input`       | Show/hide the input of an activity                                                                                                                                          | `boolean` | `false`     |
| `showHasOutput`     | `show-has-output`      | Show/hide the output of an activity                                                                                                                                         | `boolean` | `false`     |


## Events

| Event          | Description | Type               |
| -------------- | ----------- | ------------------ |
| `layoutChange` |             | `CustomEvent<any>` |
| `nodeClick`    |             | `CustomEvent<any>` |
| `nodeOut`      |             | `CustomEvent<any>` |
| `nodeOver`     |             | `CustomEvent<any>` |


## Methods

### `resetView() => Promise<void>`

Center the cytoscape graph to fit the whole graph

#### Returns

Type: `Promise<void>`




## Dependencies

### Depends on

- [wc-gocam-selector](../gocam-selector)
- [wc-genes-panel](../genes-panel)

### Graph
```mermaid
graph TD;
  wc-gocam-viz --> wc-gocam-selector
  wc-gocam-viz --> wc-genes-panel
  style wc-gocam-viz fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
