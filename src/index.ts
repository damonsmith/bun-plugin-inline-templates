/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import fs from 'fs'
import path from 'path';
import { BunFile, BunPlugin } from 'bun';

import { parseHTML } from 'linkedom';
import { cleanupEmptyFolders, findElementFromAttibute, findLastCommonPath, getColumnNumber, getLines, isURL, removeCommonPath, returnLineNumberOfOccurance } from './utils';

export type BunPluginHTMLOptions = {
}

export type File = {
	path: string,
	file: BunFile,
	attribute: {
		value: string
	}
};

async function getAllFiles(document: Document, entrypoint: string): Promise<File[]> {
	const files: File[] = [];
	const selector = `link[rel=import]`;
	for (const element of document.querySelectorAll(selector)) {
		let attributeValue;

		if (!element.hasAttribute('href')) {
			console.error(`HTMLParseError: ${element.outerHTML} needs an href attribute`);
			continue;
		}
		attributeValue = element.getAttribute('href');

		if (!attributeValue || isURL(attributeValue)) continue;
		const resolvedPath = path.resolve(path.dirname(entrypoint), attributeValue);
		const file = Bun.file(resolvedPath);

		if (!(await file.exists())) {
			const fileText = (document.toString()).replace(/\t/g, '	');
			const search = `href="${attributeValue}"`;
			const line = returnLineNumberOfOccurance(fileText, search);
			const columnNumber = getColumnNumber(fileText, fileText.indexOf(search) + search.length / 2) + `${line}`.length + 1;
			console.log(getLines(fileText, 4, line + 1));
			console.log('^'.padStart(columnNumber))
			console.error(`HTMLParseError: Specified <${element.tagName}> href '${attributeValue}' does not exist!`)
			console.log(`	  at ${entrypoint}:${line}:${columnNumber}`)
			continue;
		}

		files.push({
			path: resolvedPath,
			file,
			attribute: {
				value: attributeValue
			}
		})
	}

	return files;
}

const inlineTemplates = (): BunPlugin => {
	return {
		name: 'bun-plugin-inline-templates',
		async setup(build) {
			for (const entrypoint of build.config.entrypoints) {
				if (!(path.extname(entrypoint) === '.html' || path.extname(entrypoint) === '.htm')) continue;

				let entrypointFile = Bun.file(entrypoint);
				let entrypointDestFile = path.join(build.config.outdir || 'dist', path.basename(entrypoint));
				
				// Determine if another plugin has already put the entrypoint into the outdir
				// folder, and if so use that as the source instead of the original entrypoint.
				// This allows the plugin to run after bun-plugin-html:
				const finalDestFile = Bun.file(entrypointDestFile);
				const finalDestContent = await finalDestFile.exists() ? await finalDestFile.text() : '';
				const useDestFile = finalDestContent.indexOf('link rel="import"') !== -1;
				const textContent = useDestFile ? await finalDestFile.text() : await entrypointFile.text();

				const { document } = parseHTML(textContent);

				const files = await getAllFiles(document, entrypoint);

				files.push({
					path: path.resolve(entrypoint),
					file: entrypointFile,
					attribute: {
						value: entrypoint
					}
				})

				const paths = files.map(file => file.path);
				const commonPath = findLastCommonPath(paths);

				for (const file of files) {
					const isEntryPoint = path.relative(file.path, entrypoint).length === 0;
					
					const content = await file.file.text();

					if (!isEntryPoint) {
						const element = findElementFromAttibute(document, file.attribute);
						const htmlContentHolder = document.createElement('span');
						htmlContentHolder.innerHTML = content;
						element?.insertAdjacentElement('afterend', htmlContentHolder);
						element?.remove();
					} else {
						const finalDest = path.resolve(process.cwd(), build.config.outdir!, removeCommonPath(file.path, commonPath));
						fs.mkdirSync(path.dirname(finalDest), { recursive: true });
						const fileContents = document.toString();
						Bun.write(finalDest, fileContents);
					}
				}

				cleanupEmptyFolders(path.resolve(process.cwd(), build.config.outdir!))
			}

			build.onLoad({ filter: /\.(html|htm)$/ }, async (args) => {
				throw new Error('bun-plugin-inline-templates does not support output information at this time.');
			});
		}
	}
};

export default inlineTemplates;
