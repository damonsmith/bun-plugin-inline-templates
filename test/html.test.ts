import fs from 'node:fs';
import inlineTemplates from "../src/index";
import { describe } from "bun:test";
import { emptyDir, testIfFileExists } from './utils';

describe("Testing Generation of HTML", async () => {
	const generationDirectory = './test/generation';
	const expectedDirectory = './test/expected';

	if (fs.existsSync(generationDirectory)) emptyDir(generationDirectory);

	await Bun.build({
		entrypoints: ['./test/starting/index.html'],
		outdir: generationDirectory,
		plugins: [inlineTemplates()],
	})

	testIfFileExists(generationDirectory, expectedDirectory, 'index.html');
});
