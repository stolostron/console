#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { dirname, extname, resolve } from 'path'
import { buildDocumentation, documentationToMarkdown } from 'tsdoc-markdown'
import ts from 'typescript'

const result = buildDocumentation({
  inputFiles: getAllReferencedFiles('src/index.ts'),
  options: {
    types: true,
    repo: {
      url: 'https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/',
      branch: '..',
    },
  },
})

const sortedResult = result.sort((a, b) => a.name.localeCompare(b.name))

const markdown = documentationToMarkdown({ entries: sortedResult });

const regex = /(<!-- TSDOC_START -->)[\s\S]*?(<!-- TSDOC_END -->)$/gm;
const replace = `<!-- TSDOC_START -->\n\n${markdown}\n<!-- TSDOC_END -->`;

const outputFile = './README.md';
const fileContent = readFileSync(outputFile, 'utf-8');
writeFileSync(outputFile, fileContent.replace(regex, replace), 'utf-8');


/**
 * Get all files referenced by a starting file, recursively (following only export chains)
 * This function only follows files that are actually exported, not just imported internally.
 * For example, if index.ts exports { foo } from './module', it will include './module',
 * but if './module' imports './helper' without exporting it, './helper' won't be included.
 * 
 * @param {string} startFile - The starting file path
 * @param {string} baseDir - Base directory for resolving relative paths
 * @returns {string[]} Array of all referenced file paths
 */
export function getAllReferencedFiles(startFile, baseDir = process.cwd()) {
  const visited = new Set()
  const allFiles = []

  function resolveModulePath(modulePath, currentFile) {
    const currentDir = dirname(currentFile)

    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      const possibleExtensions = ['/index.ts', '/index.tsx', '.ts', '.tsx']

      for (const ext of possibleExtensions) {
        const fullPath = resolve(currentDir, modulePath + ext)
        if (existsSync(fullPath)) {
          return fullPath
        }
      }

      // Try without extension if it already has one
      const withoutExt = resolve(currentDir, modulePath)
      if (existsSync(withoutExt)) {
        return withoutExt
      }

      // Try as index file in directory
      const indexPath = resolve(currentDir, modulePath, 'index.ts')
      if (existsSync(indexPath)) {
        return indexPath
      }

      const indexTsxPath = resolve(currentDir, modulePath, 'index.tsx')
      if (existsSync(indexTsxPath)) {
        return indexTsxPath
      }
    }

    // For absolute or node_modules imports, return null (we don't process these)
    return null
  }

  function analyzeFile(filePath) {
    // Convert to absolute path
    const absolutePath = resolve(baseDir, filePath)

    if (visited.has(absolutePath)) {
      return
    }

    visited.add(absolutePath)

    if (!existsSync(absolutePath)) {
      console.warn(`File not found: ${absolutePath}`)
      return
    }

    allFiles.push(absolutePath)

    try {
      const sourceCode = readFileSync(absolutePath, 'utf-8')
      const ext = extname(absolutePath)

      const sourceFile = ts.createSourceFile(
        absolutePath,
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        ext === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      )

      function visit(node) {
        if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
          const modulePath = node.moduleSpecifier.text
          const resolvedPath = resolveModulePath(modulePath, absolutePath)
          if (resolvedPath) {
            analyzeFile(resolvedPath)
          }
        }

        if (ts.isExportAssignment(node) && ts.isCallExpression(node.expression)) {
          if (node.expression.arguments.length > 0 && ts.isStringLiteral(node.expression.arguments[0])) {
            const modulePath = node.expression.arguments[0].text
            const resolvedPath = resolveModulePath(modulePath, absolutePath)
            if (resolvedPath) {
              analyzeFile(resolvedPath)
            }
          }
        }

        ts.forEachChild(node, visit)
      }

      visit(sourceFile)

    } catch (error) {
      console.error(`Error analyzing ${absolutePath}:`, error.message)
    }
  }

  // Start the analysis
  analyzeFile(startFile)

  return allFiles
}
