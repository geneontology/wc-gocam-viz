# Contributing

## Development

### Getting started

1. Ensure you have a recent version of Node.js installed. Using [nvm](https://github.com/nvm-sh/nvm) makes this easy.
2. These components are built with Stencil. If you're not already familiar with Stencil, review its [docs](https://stenciljs.com/docs/introduction) to learn about the core concepts.

### Making changes

1. Install dependencies with `npm install` if you're starting from scratch or if the `package-lock.json` file has changed since the last time it was run.
2. Start the development server with `npm start`. As you make changes to components the changes will automatically reload in the browser. The main host page for development is `src/index.html`. Pages for testing individual components can be added to the respective component directory (e.g. `src/components/gocam-legend/index.html`)
3. Use `npm run build` to build the project. This will also update auto-generated files if necessary. These changes should be reviewed and committed with the rest of your changes.

### Publishing releases

1. Use `npm version` to increment the version number followed by `git push && git push --tags` to push the version change to GitHub.
2. Create a new GitHub [release](https://github.com/geneontology/wc-gocam-viz/releases) using the new version tag. Once the new release is created, a GitHub Action will automatically publish it to NPM.