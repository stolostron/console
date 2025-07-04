#!/usr/bin/env node

import { buildDocumentation, documentationToMarkdown } from 'tsdoc-markdown'
import { writeFileSync, readFileSync } from 'fs'

const result = buildDocumentation({
  inputFiles: ['./src/index.ts'],
  options: {
    types: true,
    explore: true,
    repo: {
      url: 'https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/',
      branch: '..',
    },
  },
})

const sortedResult = result.sort((a, b) => a.name.localeCompare(b.name))

const markdown = documentationToMarkdown({entries: sortedResult });

const regex = /(<!-- TSDOC_START -->)[\s\S]*?(<!-- TSDOC_END -->)$/gm;
const replace = `<!-- TSDOC_START -->\n\n${markdown}\n<!-- TSDOC_END -->`;

const outputFile = './README.md';
const fileContent = readFileSync(outputFile, 'utf-8');
writeFileSync(outputFile, fileContent.replace(regex, replace), 'utf-8');

