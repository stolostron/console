#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'fs'
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

const markdown = prettifyObjectTypes(documentationToMarkdown({ entries: sortedResult }))

const regex = /(<!-- TSDOC_START -->)[\s\S]*?(<!-- TSDOC_END -->)$/gm
const replace = `<!-- TSDOC_START -->\n\n${markdown}\n<!-- TSDOC_END -->`

const outputFile = './README.md'
const fileContent = readFileSync(outputFile, 'utf-8')
writeFileSync(outputFile, fileContent.replace(regex, replace), 'utf-8')

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

/**
 * Simplify internal GraphQL scalar and nullable wrapper types to plain TypeScript equivalents.
 * Replacements are ordered most-specific first so nested wrappers collapse correctly.
 *
 * @param {string} typeStr
 * @returns {string}
 */
function simplifyType(typeStr) {
  return typeStr
    .replace(/Scalars\['String'\]\['(?:input|output)'\]/g, 'string')
    .replace(/Scalars\['Int'\]\['(?:input|output)'\]/g, 'number')
    .replace(/Scalars\['Float'\]\['(?:input|output)'\]/g, 'number')
    .replace(/Scalars\['Boolean'\]\['(?:input|output)'\]/g, 'boolean')
    .replace(/Scalars\['ID'\]\['(?:input|output)'\]/g, 'string')
    .replace(/Scalars\['Date'\]\['(?:input|output)'\]/g, 'Date')
    .replace(/Scalars\['Map'\]\['(?:input|output)'\]/g, 'Record<string, unknown>')
    .replace(/InputMaybe<Array<InputMaybe<([^>]+)>>>/g, '$1[]')
    .replace(/Array<InputMaybe<([^>]+)>>/g, '$1[]')
    .replace(/InputMaybe<Array<([^>]+)>>/g, '$1[]')
    .replace(/InputMaybe<([^>]+)>/g, '$1')
}

/**
 * Parse an inline object type string as emitted by tsdoc-markdown — where each property
 * is preceded by a collapsed JSDoc block (/** ... *\/) — and format it as a readable
 * TypeScript type definition block.
 *
 * @param {string} typeName
 * @param {string} typeStr - raw object type, e.g. "{ /** comment *\/ prop?: Type ... }"
 * @returns {string}
 */
function formatObjectType(typeName, typeStr) {
  // Strip surrounding braces
  const inner = typeStr.slice(1, -1).trim()

  // Split on the start of each JSDoc block so each segment = one property
  const segments = inner.split(/(?=\/\*\*)/)

  const lines = [`type ${typeName} = {`]

  for (const segment of segments) {
    const trimmed = segment.trim()
    if (!trimmed) continue

    let comment = ''
    let propDef = trimmed

    const commentMatch = trimmed.match(/^\/\*\*([\s\S]*?)\*\/\s*(.*)$/)
    if (commentMatch) {
      // Collapse multi-line JSDoc continuation markers into a single-line comment.
      // Only strip " * " patterns that act as line-continuation markers (i.e. whitespace
      // on both sides), not inline * characters inside backtick spans or words.
      comment = commentMatch[1]
        .replace(/\s+\*\s+\*\s+/g, ' ') // collapse blank JSDoc paragraph separators " * * "
        .replace(/\s+\*\s+/g, ' ') // collapse regular line-continuation " * " markers
        .replace(/\s+/g, ' ')
        .trim()
      propDef = commentMatch[2].trim()
    }

    if (!propDef) continue

    const colonIdx = propDef.indexOf(':')
    if (colonIdx === -1) continue

    const propName = propDef.slice(0, colonIdx).trim()
    const propType = simplifyType(propDef.slice(colonIdx + 1).trim())

    if (comment) lines.push(`  /** ${comment} */`)
    lines.push(`  ${propName}: ${propType}`)
  }

  lines.push('}')
  return lines.join('\n')
}

/**
 * Post-process generated markdown to replace unreadable inline object type strings
 * (as produced by tsdoc-markdown) with formatted TypeScript code blocks.
 *
 * tsdoc-markdown emits type aliases as a two-column table:
 *
 *   | Type      | Type      |
 *   | --------- | --------- |
 *   | `TypeName` | `{ /** comment *\/ prop?: Type ... }` |
 *
 * When the type cell contains embedded JSDoc markers (/** ... *\/), the type is a
 * multi-property object that is completely unreadable inline. This function replaces
 * those table rows with a formatted TypeScript code block.
 *
 * The second cell is matched greedily to the LAST backtick on the line, which correctly
 * captures type strings that contain backtick characters inside JSDoc comment text.
 *
 * @param {string} markdown
 * @returns {string}
 */
function prettifyObjectTypes(markdown) {
  return markdown.replace(
    // Match the three-line table tsdoc-markdown emits for type aliases:
    //   | Type   | Type   |
    //   | ------ | ------ |
    //   | `Name` | `{ ... }` |
    // Greedy .+ in the type cell matches to the LAST backtick on the line, correctly
    // handling type strings that contain backtick characters inside JSDoc text.
    /\| Type +\| Type +\|\n\| [^\n]+ \|\n\| `([^`]+)` \| `(.+)` \|$/gm,
    (match, typeName, typeStr) => {
      if (!typeStr.startsWith('{') || !typeStr.endsWith('}') || !typeStr.includes('/**')) return match
      return '```typescript\n' + formatObjectType(typeName, typeStr) + '\n```'
    }
  )
}
