# Bun Plugin for HTML

The `bun-plugin-inline-templates` is a plugin for the Bun build tool that replaces any `<link rel="import" href="something.html">` with the contents of the path in the href.

## Installation

You can install `bun-plugin-inline-templates` using the following command:

```bash
bun add -d bun-plugin-inline-templates
```

## Usage

To use this plugin, import it into your code and add it to the list of plugins when building your project with Bun. Here's an example:

```typescript
import inlineTemplates from 'bun-plugin-inline-templates';

await Bun.build({
  entrypoints: ['./src/index.html', './src/other.html'],
  outdir: './dist',  // Specify the output directory
  plugins: [
    inlineTemplates()
  ],
});
```

## Acknowledgements

This plugin was created by mostly copying the bun-plugin-html plugin from Bjorn at https://github.com/BjornTheProgrammer/bun-plugin-html

Massive thanks to that project, this plugin is designed to be inserted before it so that they can be used together.

## License

This plugin is licensed under MIT.
