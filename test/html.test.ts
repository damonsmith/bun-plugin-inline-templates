import fs from 'node:fs';
import inlineTemplates from "../src/index";
import { describe } from "bun:test";
import { emptyDir, testIfFileExists } from './utils';

describe("Testing Generation of HTML", async () => {
	const generationDirectory = './test/generated';
	const expectedDirectory = './test/expected';

	if (fs.existsSync(generationDirectory)) emptyDir(generationDirectory);

	await Bun.build({
		entrypoints: ['./test/starting/index.html'],
		outdir: generationDirectory,
		plugins: [inlineTemplates()],
	})

	testIfFileExists(generationDirectory, expectedDirectory, 'index.html');
});

describe("Testing Generation of HTML after dest target has already been generated", async () => {
	const generationDirectory = './test/generated_after_other_plugin';
	const expectedDirectory = './test/expected_after_other_plugin';

	if (fs.existsSync(generationDirectory)) emptyDir(generationDirectory);

	// Arbitrarily copy the source file into the destination to simulate another plugin having run first
	// and put the original html into the outdir:
	fs.copyFileSync(`${expectedDirectory}/index.html`, `${generationDirectory}/index.html`);
	
	await Bun.build({
		entrypoints: ['./test/starting_after_other_plugin/index.html'],
		outdir: generationDirectory,
		plugins: [inlineTemplates()],
	})

	testIfFileExists(generationDirectory, expectedDirectory, 'index.html');
});
