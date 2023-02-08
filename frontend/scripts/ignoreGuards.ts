#!/usr/bin/env ts-node

import * as fs from 'fs'
import ts from 'typescript'
import prettier from 'prettier'

const ignoreCmt: string = ' istanbul ignore next '

export function ignoreGuards(sourceFile: ts.SourceFile) {
  ignoreGuardsNode(sourceFile)

  function ignoreGuardsNode(node: ts.Node) {
    switch (node.kind) {
      // look for 'arg?.param' and 'arg1 ?? arg2'
      case ts.SyntaxKind.QuestionDotToken:
      case ts.SyntaxKind.QuestionQuestionToken:
        // determine where to put istanbul comment
        // start by finding the first valid ancestor to put the comment
        let parent = node.parent
        let ancestor = node
        if (parent.kind === ts.SyntaxKind.BinaryExpression) {
          ancestor = parent.parent
        }
        ancestor = parent.getFirstToken(sourceFile) || parent

        // then find a better common ancestor
        let common: ts.Node | undefined = undefined
        let possible: ts.Node | undefined = undefined
        let walker = ancestor
        let intermediary: boolean
        do {
          intermediary = false
          // getLineAndCharacterOfPosition doesn't work is we remember blank lines below
          // const txt = walker.getFullText()
          // const { line, character } = sourceFile.getLineAndCharacterOfPosition(walker.getStart())
          const kind = walker.kind
          switch (kind) {
            // return/const var=/=> are great common places
            case ts.SyntaxKind.ReturnStatement:
            case ts.SyntaxKind.VariableStatement:
              common = walker
              break

            // these are possible if no better ancestor
            //case ts.SyntaxKind.ArrowFunction:
            case ts.SyntaxKind.ExpressionStatement:
            case ts.SyntaxKind.ParenthesizedExpression:
              possible = walker
              intermediary = true
              break

            // these aren't good but we can keep going
            case ts.SyntaxKind.AsExpression:
            case ts.SyntaxKind.CallExpression:
            case ts.SyntaxKind.ObjectLiteralExpression:
            case ts.SyntaxKind.PropertyAssignment:
            case ts.SyntaxKind.PropertyAccessExpression:
            case ts.SyntaxKind.VariableDeclarationList:
            case ts.SyntaxKind.VariableDeclaration:
            case ts.SyntaxKind.Parameter:
            case ts.SyntaxKind.BinaryExpression:
            case ts.SyntaxKind.Identifier:
            case ts.SyntaxKind.SpreadElement:
            case ts.SyntaxKind.ArrayLiteralExpression:
            case ts.SyntaxKind.ConditionalExpression:
            case ts.SyntaxKind.ElementAccessExpression:
              intermediary = true
              break

            // these aren't good and we should stop
            default:
              break
          }
          walker = walker.parent
        } while (!common && intermediary && walker)
        common = common ?? possible ?? ancestor

        // don't add istanbul comment if there already is one
        if (
          !common.getFullText().includes(ignoreCmt) &&
          !(ts.getSyntheticLeadingComments(common) || []).find(({ text }) => text === ignoreCmt)
        ) {
          ts.addSyntheticLeadingComment(common, ts.SyntaxKind.MultiLineCommentTrivia, ignoreCmt, false)
        }
        break
    }
    ts.forEachChild(node, ignoreGuardsNode)
  }
}

const fileNames = process.argv.slice(2)
const printer = ts.createPrinter({ removeComments: false })
fileNames.forEach((fileName) => {
  // remember blank lines
  const input = fs.readFileSync(fileName).toString().replace(/\n\n/g, '\n/** THIS_IS_A_NEWLINE **/')
  //const input = fs.readFileSync(fileName).toString() // getLineAndCharacterOfPosition doesn't work is we remember blank lines

  // parse file
  const outputName = fileName
  const sourceFile = ts.createSourceFile(outputName, input, ts.ScriptTarget.ES2015, /*setParentNodes */ true)

  // add ignore guard code
  ignoreGuards(sourceFile)

  // stringify and restore blank lines
  let output = printer.printFile(sourceFile).replace(/\/\*\* THIS_IS_A_NEWLINE \*\*\//g, '\n')

  // prettify
  const configFile = prettier.resolveConfigFile.sync(fileName)
  const options = configFile
    ? prettier.resolveConfig.sync(configFile)
    : { printWidth: 120, tabWidth: 2, semi: false, singleQuote: true }
  output = prettier.format(output, {
    parser: 'typescript',
    ...options,
  })

  // write file
  fs.writeFileSync(outputName, output)
})
