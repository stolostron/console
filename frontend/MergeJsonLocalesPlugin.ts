/* Copyright Contributors to the Open Cluster Management project */
import fs from 'fs'
import { merge } from 'lodash'
import type { Compiler } from '@rspack/core'

export interface MergeJsonLocalesSpec {
  /** Absolute paths to the JSON files to deep-merge, in order (later files win on conflict). */
  files: string[]
  /** Output asset path, relative to the compiler output directory. */
  output: string
}

/**
 * Rspack plugin that deep-merges a set of JSON translation files and emits the combined
 * result as a build asset. Replaces the webpack-only `merge-jsons-webpack-plugin`: it reads
 * the inputs from disk at build time, merges them with lodash (later entries override
 * earlier ones), and emits the result via the compilation's asset pipeline so it is written
 * to the output directory (and picked up by compression/clean like any other asset).
 */
export class MergeJsonLocalesPlugin {
  private readonly specs: MergeJsonLocalesSpec[]
  private readonly space: number

  constructor(specs: MergeJsonLocalesSpec[], space = 4) {
    this.specs = specs
    this.space = space
  }

  apply(compiler: Compiler): void {
    const { sources, Compilation } = compiler.webpack
    compiler.hooks.thisCompilation.tap('MergeJsonLocalesPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'MergeJsonLocalesPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          for (const spec of this.specs) {
            const merged: Record<string, unknown> = {}
            for (const file of spec.files) {
              if (!fs.existsSync(file)) {
                // Not present yet: watch the path so creating it later triggers a rebuild.
                compilation.missingDependencies.add(file)
                continue
              }
              // Register the input as a build dependency so watch mode rebuilds on change.
              compilation.fileDependencies.add(file)
              merge(merged, JSON.parse(fs.readFileSync(file, 'utf8')))
            }
            const content = JSON.stringify(merged, null, this.space)
            compilation.emitAsset(spec.output, new sources.RawSource(content))
          }
        }
      )
    })
  }
}

export default MergeJsonLocalesPlugin
