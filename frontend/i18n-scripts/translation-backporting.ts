/* Copyright Contributors to the Open Cluster Management project */
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import inquirer from 'inquirer'
import { simpleGit, type SimpleGit } from 'simple-git'

/** Resolved from repo `frontend/` (see `npm run i18n-backporting`). */
const LOCALES_DIR = path.resolve(process.cwd(), 'public', 'locales')

const UPSTREAM_NAME = 'upstream'

/** Max release refs shown in the interactive picker (list is newest-first). */
const INTERACTIVE_RELEASE_PICK_LIMIT = 8

/** Language code → `translation.json` key/value pairs from the given release ref. */
type TranslationMap = Record<string, Record<string, string>>

/** Per-language, per-lookup-key: string values keyed by git ref (e.g. `upstream/release-2.16`); optional numeric `similarity` for EN diffs. */
type LangRefPairMap = Record<string, Record<string, Record<string, string | number>>>

const SIMILARITY_KEY = 'similarity' as const

/** `similarity` line: green when score is strictly greater than this. */
const SIMILARITY_COLOR_GREEN_ABOVE = 0.8
/** `similarity` line: yellow when score is strictly greater than this and not green; else red. */
const SIMILARITY_COLOR_YELLOW_ABOVE = 0.5

const DISPLAY_LINE_MAX = 100

/** One output indent level for `printBackportMapFormatted` (2 characters). Key = 1×, ref lines = 2×. */
const INDENT = '  '

/** Max line length when clipping backport output for ja / ko / zh*. */
const BACKPORT_CLIP_MAX_CJK = 80

/** Max line length when clipping backport output for other locales. */
const BACKPORT_CLIP_MAX_OTHER = 132

const PROMPT_LINES = [
  'This utility will backport translations from the main branch to the selected release branch.',
  'The new branch will be named "backport-translations-to-<release>-<date-time>"',
  'Note: You can also use a command line argument to specify the release branch.',
  '   Example: npm run i18n-backporting release-2.17\n',
].join('\n')

/** Shown once before interactive English backports when any diff is below the auto-accept similarity threshold. */
const EN_LOW_SIMILARITY_EXPLAINER = (releaseRef: string): string =>
  [
    `English string changes have been detected. Answer yes or no to each question`,
    `whether to backport each of these new English strings to the target release ${releaseRef}`,
  ].join('\n')

void run().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

async function run(): Promise<void> {
  console.log(chalk.bgBlue.white.bold('\n       Translation Backporting v1.0.0      \n'))
  console.log(chalk.cyan(PROMPT_LINES))
  const git = simpleGit(process.cwd())

  // --- FETCH FROM GIT ---
  try {
    console.log(chalk.dim('Fetching from upstream...'))
    await git.fetch([UPSTREAM_NAME])
  } catch (e: unknown) {
    console.log(e instanceof Error ? e.message : String(e))
    return
  }

  // --- GET RELEASES ---
  const rawList = await git.raw(['branch', '-r', '--list', `${UPSTREAM_NAME}/release-*`])
  let releaseList = sortReleaseBranches(
    rawList
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean)
  ).reverse()

  // --- CHECKING TRANSLATIONS ---
  if (releaseList.length === 0) {
    console.log(chalk.yellow('No release branches found.'))
    return
  }

  /** Newest `upstream/release-*` whose tip has no commits outside `upstream/main` (`rev-list main..release` === 0). */
  let mainRef: string | undefined
  for (const rel of releaseList) {
    const out = (await git.raw(['rev-list', '--count', `${UPSTREAM_NAME}/main..${rel}`])).trim()
    const ahead = Number.parseInt(out, 10)
    if (!Number.isFinite(ahead)) {
      throw new Error(`Unexpected rev-list --count for ${UPSTREAM_NAME}/main..${rel}: ${JSON.stringify(out)}`)
    }
    if (ahead > 0) {
      break
    }
    mainRef = rel
  }
  if (mainRef) {
    console.log(chalk.magenta.bold(`${mainRef} is the main branch`))
    const idx = releaseList.indexOf(mainRef)
    releaseList = releaseList.slice(idx + 1)
    if (releaseList.length === 0) {
      console.log(chalk.yellow('No older release branches left after excluding the main release and newer lines.'))
      return
    }
  } else {
    console.log(
      chalk.yellow(
        `No release in releaseList is at or behind ${UPSTREAM_NAME}/main (every tip has commits not in main).`
      )
    )
  }

  // --- GET RELEASE FROM CLI ARGUMENT ---
  const cliReleaseArg = takeReleaseCliArg()
  let releaseRef: string | undefined
  if (cliReleaseArg) {
    releaseRef = resolveReleaseSpecifier(cliReleaseArg, releaseList)
    if (!releaseRef) {
      console.log(
        chalk.yellow(`Release argument does not match any remote release branch: ${cliReleaseArg}. Pick from the list.`)
      )
    }
  }
  let usedInteractivePick = false
  if (!releaseRef) {
    usedInteractivePick = true
    releaseRef = await pickReleaseBranch(releaseList)
    if (!releaseRef) {
      return
    }
  }
  if (usedInteractivePick && !(await confirmReleaseBranch(releaseRef))) {
    console.log(chalk.yellow('Aborted.'))
    return
  }
  console.log(chalk.magenta.bold(`${releaseRef} is the backport branch.`))

  // --- GET LOCALE LANGUAGES ---
  const localeLangs = fs
    .readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  const backportEnMap: LangRefPairMap = {}
  const backportMap: LangRefPairMap = {}

  const selectedIdx = releaseList.indexOf(releaseRef)
  if (selectedIdx === -1) {
    throw new Error(`Selected release not in release list: ${releaseRef}`)
  }
  releaseList = releaseList.slice(0, selectedIdx + 1)

  const orderedReleases = [...releaseList].reverse()
  if (mainRef) {
    orderedReleases.push(mainRef)
  }

  let payloadMap: TranslationMap | undefined
  let payloadChanged = false
  let printedLowSimilarityEnExplainer = false

  // --- BACKPORTING ---
  for (let i = 0; i < orderedReleases.length - 1; i++) {
    if (i === 0) {
      console.log(chalk.yellow('\nSTEP 1: Searching for changes to backport\n'))
    }
    const currentRef = orderedReleases[i]
    const nextRef = orderedReleases[i + 1]
    console.log(chalk.yellow(`Backporting from ${nextRef} into ${releaseRef}...`))
    const currentTranslationMap = await retrieveTranslations(git, currentRef, localeLangs)
    const nextTranslationMap = await retrieveTranslations(git, nextRef, localeLangs)
    if (currentRef === releaseRef) {
      payloadMap = cloneTranslationMap(currentTranslationMap)
    }
    const nextMap = nextTranslationMap['en']
    const currentEn = currentTranslationMap['en']
    if (!nextMap || !currentEn) {
      continue
    }

    if (
      !printedLowSimilarityEnExplainer &&
      process.stdin.isTTY &&
      enDiffHasAnyBelowGreenSimilarity(currentEn, nextMap)
    ) {
      console.log(`\n\n${chalk.magentaBright(EN_LOW_SIMILARITY_EXPLAINER(releaseRef))}`)
      printedLowSimilarityEnExplainer = true
    }

    for (const key of Object.keys(nextMap)) {
      if (!Object.prototype.hasOwnProperty.call(currentEn, key)) {
        continue
      }
      const nextEnVal = nextMap[key]
      const currentEnVal = currentEn[key]
      if (currentEnVal !== nextEnVal) {
        if (!backportEnMap['en']) {
          backportEnMap['en'] = {}
        }
        const similarity = getStringSimilarity(currentEnVal, nextEnVal)
        backportEnMap['en'][key] = {
          [releaseRef]: currentEnVal,
          [nextRef]: nextEnVal,
          [SIMILARITY_KEY]: similarity,
        }

        let acceptNewerEn = similarity >= SIMILARITY_COLOR_GREEN_ABOVE
        if (!acceptNewerEn) {
          if (!process.stdin.isTTY) {
            console.log(chalk.dim(`English differs for "${key}"; no TTY — skipping newer EN backport.`))
            continue
          }
          const choice = await promptBackportNewerEnToRelease({
            key,
            releaseRef,
            nextRef,
            currentEnVal,
            nextEnVal,
            similarity,
          })
          if (choice === 'q') {
            process.exit(0)
          }
          if (choice === 'n') {
            continue
          }
          acceptNewerEn = true
        }

        if (acceptNewerEn && payloadMap && currentRef === releaseRef) {
          if (!payloadMap['en']) {
            payloadMap['en'] = {}
          }
          if (payloadMap['en'][key] !== nextEnVal) {
            payloadChanged = true
            payloadMap['en'][key] = nextEnVal
          }
        }
      }

      for (const lang of localeLangs) {
        if (lang === 'en' || (isJapaneseChineseKoreanLocale(lang) && key.endsWith('_plural'))) {
          continue
        }
        const curLangMap = currentTranslationMap[lang]
        const nxtLangMap = nextTranslationMap[lang]
        let lookupKey = key
        let curLoc = curLangMap?.[lookupKey]
        let nxtLoc = nxtLangMap?.[lookupKey]
        if (!curLoc && isJapaneseChineseKoreanLocale(lang)) {
          lookupKey = `${key}_0`
          curLoc = curLangMap?.[lookupKey]
          nxtLoc = nxtLangMap?.[lookupKey]
        }
        if (curLoc && nxtLoc && curLoc !== nxtLoc) {
          if (!backportMap[lang]) {
            backportMap[lang] = {}
          }
          backportMap[lang][lookupKey] = { [releaseRef]: curLoc ?? '', [nextRef]: nxtLoc ?? '' }
          if (payloadMap && currentRef === releaseRef) {
            if (!payloadMap[lang]) {
              payloadMap[lang] = {}
            }
            const nextVal = nxtLoc ?? ''
            if (payloadMap[lang][lookupKey] !== nextVal) {
              payloadChanged = true
              payloadMap[lang][lookupKey] = nextVal
            }
          }
        }
      }
    }
  }

  // --- PRINT BACKPORT SUMMARY / OPTIONAL DETAIL ---
  printBackportKeyCountsTable(backportMap, backportEnMap, releaseRef)
  const detailChoice = await promptBackportDetailsChoice()
  if (detailChoice === 'q') {
    process.exit(0)
  }
  if (detailChoice === 'y') {
    printBackportMapFormatted(backportEnMap, releaseRef)
    printBackportMapFormatted(backportMap, releaseRef)
  }
  // --- COMMIT AND PUSH ---

  if (!payloadChanged) {
    console.log('No changes to backport...')
    process.exit(0)
  }

  const gitRoot = (await git.revparse(['--show-toplevel'])).trim()
  const worktreeRelPath = 'frontend/i18n-scripts/temp'
  const worktreeAbsPath = path.join(gitRoot, ...worktreeRelPath.split('/'))
  const branchName = backportTranslationsBranchName(releaseRef)

  const runCmd = (cmd: string, cwd: string): string => {
    return execSync(cmd, { cwd, stdio: 'inherit', encoding: 'utf8' })
  }

  // STEP 2: create a new worktree
  console.log(chalk.yellow('\nSTEP 2: Create a new worktree.\n'))
  // git worktree add frontend/i18n-scripts/temp (remove first if this path is already in use)
  const worktreeListOut = execSync('git worktree list', { cwd: gitRoot, encoding: 'utf8' })
  const resolvedWorktreePath = path.resolve(worktreeAbsPath)
  const worktreeAlreadyExists = worktreeListOut.split('\n').some((line) => {
    const trimmed = line.trim()
    if (!trimmed) return false
    const listedPath = trimmed.split(/\s+/)[0]
    return listedPath ? path.resolve(listedPath) === resolvedWorktreePath : false
  })
  if (worktreeAlreadyExists) {
    console.log(chalk.dim('Worktree already exists; removing it before add.'))
    // git worktree remove --force frontend/i18n-scripts/temp
    runCmd(`git worktree remove --force ${worktreeRelPath}`, gitRoot)
  } else if (fs.existsSync(worktreeAbsPath)) {
    // Leftover path on disk (not registered) would make `git worktree add` fail
    fs.rmSync(worktreeAbsPath, { recursive: true, force: true })
  }
  runCmd(`git worktree add ${worktreeRelPath}`, gitRoot)

  // STEP 3: change cwd to the new worktree and show pwd
  console.log(chalk.yellow('\nSTEP 3: Change cwd to the new worktree.\n'))
  // pushd frontend/i18n-scripts/temp
  // pwd
  const originalCwd = process.cwd()
  process.chdir(worktreeAbsPath)
  runCmd(`pwd`, process.cwd())

  try {
    // STEP 4: create a new branch
    console.log(chalk.yellow('\nSTEP 4: Create a new branch.\n'))
    // git checkout -q -b ${branchName} --no-track upstream/${releaseRef}
    runCmd(`git checkout -q -b ${branchName} --no-track ${releaseRef}`, process.cwd())

    // STEP 5: save payload to LOCALES_DIR in worktree
    console.log(chalk.yellow('\nSTEP 5: Save backported locale files.\n'))
    // Save payload to LOCALES_DIR in worktree.
    const worktreeLocalesDir = path.join(process.cwd(), 'frontend', 'public', 'locales')
    if (payloadMap) {
      console.log(chalk.yellow('\nSaving backported changes...\n'))
      for (const lang of Object.keys(payloadMap)) {
        const entry = payloadMap[lang]
        const outDir = path.join(worktreeLocalesDir, lang)
        fs.mkdirSync(outDir, { recursive: true })
        const outPath = path.join(outDir, 'translation.json')
        fs.writeFileSync(outPath, `${JSON.stringify(entry, null, 2)}\n`, 'utf8')
      }
      console.log(chalk.dim(`Saved ${Object.keys(payloadMap).length} locale file(s) under ${worktreeLocalesDir}.`))
    }

    // STEP 6: stage changes and list staged files
    console.log(chalk.yellow('\nSTEP 6: Stage changes.\n'))
    // git add frontend/public/locales/*
    // git diff --staged --name-only
    runCmd(`git add frontend/public/locales/*`, process.cwd())
    runCmd(`git diff --staged --name-only`, process.cwd())

    // STEP 7: commit staged changes
    console.log(chalk.yellow('\nSTEP 7: Commit staged changes.\n'))
    // git commit --signoff --no-verify -m "chore(i18n): backport translations to ${releaseRef}"
    runCmd(`git commit --signoff --no-verify -m "chore(i18n): backport translations to ${releaseRef}"`, process.cwd())

    // STEP 8: push changes
    console.log(chalk.yellow('\nSTEP 8: Push branch.\n'))
    // git push --set-upstream origin ${branchName}
    runCmd(`git push --set-upstream origin ${branchName}`, process.cwd())

    // STEP 9: if gh exists, create a PR
    console.log(chalk.yellow('\nSTEP 9: Create PR (if gh is available).\n'))
    // gh pr create --base release-2.15 --title "chore(i18n): backport translations to ${releaseRef}" --body-file .github/pull_request_template.md
    let hasGh = false
    try {
      execSync('command -v gh', { stdio: 'ignore' })
      hasGh = true
    } catch {
      hasGh = false
    }
    if (hasGh) {
      const base = releaseRef.startsWith(`${UPSTREAM_NAME}/`)
        ? releaseRef.slice(UPSTREAM_NAME.length + 1)
        : releaseRef.replace(/\//g, '-')
      runCmd(
        `gh pr create --base ${base} --title "chore(i18n): backport translations to ${releaseRef}" --body-file .github/pull_request_template.md`,
        process.cwd()
      )
    } else {
      console.log(chalk.dim('gh not found; skipping PR creation step.'))
    }
  } finally {
    // STEP 10: remove the worktree
    console.log(chalk.yellow('\nSTEP 10: Remove the worktree.\n'))
    // git worktree remove frontend/i18n-scripts/temp
    runCmd(`git worktree remove ${worktreeRelPath}`, gitRoot)

    // STEP 11: return to the original cwd and show pwd
    console.log(chalk.yellow('\nSTEP 11: Return to original cwd.\n'))
    // popd
    // pwd
    process.chdir(originalCwd)
    runCmd(`pwd`, process.cwd())
  }

  process.exit(0)
}

/** Per-language summary: full name; **Backports** is locale diff count, or English EN-diff count on the English row only. */
function printBackportKeyCountsTable(
  backportMap: LangRefPairMap,
  backportEnMap: LangRefPairMap,
  releaseRef: string
): void {
  console.log()
  console.log()
  console.log(chalk.magenta.bold(`\nNumber of strings to be`))
  console.log(chalk.magenta.bold(`backported to ${releaseRef}\n`))
  const langs = new Set([...Object.keys(backportMap), ...Object.keys(backportEnMap)])
  const rowsWithCount = [...langs].map((code) => {
    const nMap = backportMap[code] ? Object.keys(backportMap[code]).length : 0
    const nEn = backportEnMap[code] ? Object.keys(backportEnMap[code]).length : 0
    const count = code === 'en' ? nEn : nMap
    const language = localeCodeToFullLanguageName(code)
    return { language, count }
  })
  rowsWithCount.sort((a, b) => b.count - a.count || a.language.localeCompare(b.language))
  const rows = rowsWithCount.map(({ language, count }) => ({
    language,
    backports: String(count),
  }))
  const col0Header = 'Language'
  const col1Header = 'Backports'
  const w0 = Math.max(col0Header.length, ...rows.map((r) => r.language.length), 1)
  const w1 = Math.max(col1Header.length, ...rows.map((r) => r.backports.length), 1)
  console.log(`${col0Header.padEnd(w0)}  ${col1Header}`)
  console.log(`${''.padEnd(w0, '-')}  ${''.padEnd(w1, '-')}`)
  for (const r of rows) {
    console.log(`${r.language.padEnd(w0)}  ${chalk.magenta(r.backports.padEnd(w1))}`)
  }
}

type BackportDetailsChoice = 'y' | 'n' | 'q'

/** Ask whether to print full backport diff; non-TTY returns `n`. */
async function promptBackportDetailsChoice(): Promise<BackportDetailsChoice> {
  if (!process.stdin.isTTY) {
    return 'n'
  }
  const { choice } = await inquirer.prompt<{ choice: string }>([
    {
      type: 'input',
      name: 'choice',
      message: 'Show details? (y/n/q)',
      validate: (input: string) => {
        const c = input.trim().toLowerCase()
        if (c.length !== 1) {
          return 'Enter a single character: y, n, or q'
        }
        if (c === 'y' || c === 'n' || c === 'q') {
          return true
        }
        return 'Enter y, n, or q'
      },
    },
  ])
  return choice.trim().toLowerCase() as BackportDetailsChoice
}

// --- PRINT BACKPORT MAP ---
/** Prints each locale section: blue banner for the language name; keys and ref/value lines in dim white (releaseRef first). */
function printBackportMapFormatted(backportMap: LangRefPairMap, releaseRef: string): void {
  for (const lang of Object.keys(backportMap).sort()) {
    const lineMax = isJapaneseChineseKoreanLocale(lang) ? BACKPORT_CLIP_MAX_CJK : BACKPORT_CLIP_MAX_OTHER
    const byKey = backportMap[lang]
    if (!byKey) {
      continue
    }
    const totalKeys = Object.keys(byKey).length
    const fullName = localeCodeToFullLanguageName(lang)
    console.log(chalk.bgBlue.white.bold(`\n       ${fullName} (${totalKeys})      \n`))
    const keysSorted = Object.keys(byKey).sort()
    for (let ki = 0; ki < keysSorted.length; ki++) {
      const lookupKey = keysSorted[ki]
      console.log(chalk.white(clipDisplayLine(`${INDENT}${formatLookupKeyLineIndex(ki + 1)}${lookupKey}`, lineMax)))
      const pair = byKey[lookupKey]!
      const refOrder: string[] = []
      if (Object.prototype.hasOwnProperty.call(pair, releaseRef)) {
        refOrder.push(releaseRef)
      }
      for (const ref of Object.keys(pair).sort()) {
        if (ref !== releaseRef && ref !== SIMILARITY_KEY) {
          refOrder.push(ref)
        }
      }
      for (const ref of refOrder) {
        const raw = pair[ref]
        if (typeof raw !== 'string') {
          continue
        }
        const valThis = raw.replace(/\s+/g, ' ').trim()
        const linePrefix = `${INDENT}${INDENT}${ref}: `
        console.log(chalk.dim.white(clipDisplayLine(linePrefix + valThis, lineMax)))
      }
      const sim = pair[SIMILARITY_KEY]
      if (typeof sim === 'number') {
        const simLine = `${INDENT}${INDENT}${SIMILARITY_KEY}: ${sim.toFixed(4)}`
        const simColor =
          sim > SIMILARITY_COLOR_GREEN_ABOVE
            ? chalk.green
            : sim > SIMILARITY_COLOR_YELLOW_ABOVE
              ? chalk.yellow
              : chalk.red
        console.log(simColor(simLine))
      }
      if (ki < keysSorted.length - 1) {
        console.log()
      }
    }
  }
}

/** 1-based key index prefix, e.g. `【57】 `. */
function formatLookupKeyLineIndex(oneBased: number): string {
  return `【${oneBased}】 `
}

function clipDisplayLine(s: string, maxLen: number = DISPLAY_LINE_MAX): string {
  if (s.length <= maxLen) {
    return s
  }
  return `${s.slice(0, maxLen - 1)}…`
}

function localeCodeToFullLanguageName(code: string): string {
  const tag = code.replace(/_/g, '-')
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(tag)
    return name && name !== tag ? name : code
  } catch {
    return code
  }
}

function cloneTranslationMap(map: TranslationMap): TranslationMap {
  const out: TranslationMap = {}
  for (const [lang, entries] of Object.entries(map)) {
    out[lang] = { ...entries }
  }
  return out
}

/** True if some shared EN key differs across refs and similarity is below the auto-accept threshold. */
function enDiffHasAnyBelowGreenSimilarity(currentEn: Record<string, string>, nextMap: Record<string, string>): boolean {
  for (const key of Object.keys(nextMap)) {
    if (!Object.prototype.hasOwnProperty.call(currentEn, key)) {
      continue
    }
    const nextEnVal = nextMap[key]
    const currentEnVal = currentEn[key]
    if (currentEnVal === nextEnVal) {
      continue
    }
    if (getStringSimilarity(currentEnVal, nextEnVal) < SIMILARITY_COLOR_GREEN_ABOVE) {
      return true
    }
  }
  return false
}

function isJapaneseChineseKoreanLocale(lang: string): boolean {
  return lang === 'ja' || lang === 'ko' || lang.startsWith('zh')
}

/**
 * For each `localeLangs` entry, reads `LOCALES_DIR/<lang>/translation.json` at `releaseRef` via `git show`.
 */
async function retrieveTranslations(
  git: SimpleGit,
  releaseRef: string,
  localeLangs: string[]
): Promise<TranslationMap> {
  const gitRoot = (await git.revparse(['--show-toplevel'])).trim()
  const translationMap: TranslationMap = {}

  for (const lang of localeLangs) {
    const translationPath = path.join(LOCALES_DIR, lang, 'translation.json')
    const gitPath = path.relative(gitRoot, translationPath).split(path.sep).join('/')
    if (gitPath.startsWith('..')) {
      throw new Error(`Locale file ${translationPath} is outside git root ${gitRoot}`)
    }
    const spec = `${releaseRef}:${gitPath}`
    const raw = await git.show(spec)
    translationMap[lang] = JSON.parse(raw) as Record<string, string>
  }

  return translationMap
}

/**
 * Parses `…/release-M.m…` and sorts ascending so e.g. release-2.1 … release-2.16 … release-2.17.
 */
function parseReleaseVersion(ref: string): [number, number] | null {
  const m = ref.match(/release-(\d+)\.(\d+)/)
  if (!m) return null
  return [Number.parseInt(m[1], 10), Number.parseInt(m[2], 10)]
}

/** Local branch name: `backport-translations-to-<release>-<date-time>`; `<release>` omits the `upstream/` prefix. */
function backportTranslationsBranchName(releaseRef: string): string {
  const releaseSegment = releaseRef.startsWith(`${UPSTREAM_NAME}/`)
    ? releaseRef.slice(UPSTREAM_NAME.length + 1)
    : releaseRef.replace(/\//g, '-')
  const d = new Date()
  const z = (n: number) => String(n).padStart(2, '0')
  const dateTime = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`
  return `backport-translations-to-${releaseSegment}-${dateTime}`
}

/** First positional CLI argument (skips tokens starting with `-`, including `--`). */
function takeReleaseCliArg(): string | undefined {
  for (const a of process.argv.slice(2)) {
    if (!a.startsWith('-')) {
      return a.trim()
    }
  }
  return undefined
}

/** Maps user input to an entry in `releaseList` (exact ref or `release-M.m` → `upstream/release-M.m`). */
function resolveReleaseSpecifier(spec: string, releaseList: string[]): string | undefined {
  const trimmed = spec.trim()
  if (!trimmed) {
    return undefined
  }
  const exact = releaseList.find((r) => r === trimmed)
  if (exact) {
    return exact
  }
  const normalized = trimmed.includes('/') ? trimmed : `${UPSTREAM_NAME}/${trimmed}`
  return releaseList.find((r) => r === normalized)
}

function sortReleaseBranches(refs: string[]): string[] {
  return [...refs].sort((a, b) => {
    const va = parseReleaseVersion(a)
    const vb = parseReleaseVersion(b)
    if (va && vb) {
      if (va[0] !== vb[0]) return va[0] - vb[0]
      return va[1] - vb[1]
    }
    if (va && !vb) return -1
    if (!va && vb) return 1
    return a.localeCompare(b)
  })
}

/**
 * Interactive list pick, or non-interactive via `I18N_BACKPORT_RELEASE`
 * (full ref `upstream/release-2.16` or short `release-2.16`).
 */
async function pickReleaseBranch(releaseList: string[]): Promise<string | undefined> {
  const fromEnv = process.env.I18N_BACKPORT_RELEASE?.trim()
  if (fromEnv) {
    const resolved = resolveReleaseSpecifier(fromEnv, releaseList)
    if (resolved) {
      console.log(
        chalk.dim(
          resolved === fromEnv
            ? `Using I18N_BACKPORT_RELEASE=${fromEnv}`
            : `Using I18N_BACKPORT_RELEASE=${fromEnv} → ${resolved}`
        )
      )
      return resolved
    }
    console.log(chalk.red(`I18N_BACKPORT_RELEASE=${fromEnv} does not match any remote release branch.`))
    console.log(chalk.dim(releaseList.join('\n')))
    return undefined
  }

  if (!process.stdin.isTTY) {
    console.log(
      chalk.yellow(
        'No TTY: set I18N_BACKPORT_RELEASE (e.g. upstream/release-2.16 or release-2.16) for a non-interactive run.'
      )
    )
    return undefined
  }

  const pickChoices = releaseList.slice(0, INTERACTIVE_RELEASE_PICK_LIMIT)
  const { releaseRef } = await inquirer.prompt<{ releaseRef: string }>([
    {
      type: 'select',
      name: 'releaseRef',
      message: 'Pick release branch:',
      choices: pickChoices.map((ref) => ({ name: ref, value: ref })),
    },
  ])
  return releaseRef
}

type BackportNewerEnChoice = 'y' | 'n' | 'q'

/** Ask whether to use the newer ref’s English string on the backport branch. */
async function promptBackportNewerEnToRelease(args: {
  key: string
  releaseRef: string
  nextRef: string
  currentEnVal: string
  nextEnVal: string
  similarity: number
}): Promise<BackportNewerEnChoice> {
  const { key, releaseRef, nextRef, currentEnVal, nextEnVal, similarity } = args
  const valueLineColor =
    similarity > SIMILARITY_COLOR_GREEN_ABOVE
      ? chalk.white
      : similarity > SIMILARITY_COLOR_YELLOW_ABOVE
        ? chalk.yellow
        : chalk.red
  console.log()
  console.log(chalk.greenBright.bold(`For key: ${key}`))
  console.log(valueLineColor(clipDisplayLine(`${releaseRef}: ${currentEnVal}`, DISPLAY_LINE_MAX)))
  console.log(valueLineColor(clipDisplayLine(`${nextRef}: ${nextEnVal}`, DISPLAY_LINE_MAX)))
  const { choice } = await inquirer.prompt<{ choice: string }>([
    {
      type: 'input',
      name: 'choice',
      message: 'Backport? (y/n/q)',
      validate: (input: string) => {
        const c = input.trim().toLowerCase()
        if (c.length !== 1) {
          return 'Enter a single character: y, n, or q'
        }
        if (c === 'y' || c === 'n' || c === 'q') {
          return true
        }
        return 'Enter y, n, or q'
      },
    },
  ])
  return choice.trim().toLowerCase() as BackportNewerEnChoice
}

/** Yes/no for the chosen ref; non-TTY runs skip the prompt and proceed. */
async function confirmReleaseBranch(releaseRef: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return true
  }
  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Proceed with ${releaseRef}?`,
      default: true,
    },
  ])
  return confirmed
}

/** Dice-coefficient–style similarity from overlapping character n-grams (default bigrams). */
export const getStringSimilarity = (
  str1: string,
  str2: string,
  substringLength: number = 2,
  caseSensitive: boolean = false
): number => {
  let a = str1
  let b = str2
  if (!caseSensitive) {
    a = a.toLowerCase()
    b = b.toLowerCase()
  }
  if (a.length < substringLength || b.length < substringLength) {
    return 0
  }

  const map = new Map<string, number>()
  for (let i = 0; i < a.length - (substringLength - 1); i++) {
    const substr1 = a.slice(i, i + substringLength)
    map.set(substr1, (map.get(substr1) ?? 0) + 1)
  }

  let match = 0
  for (let j = 0; j < b.length - (substringLength - 1); j++) {
    const substr2 = b.slice(j, j + substringLength)
    const count = map.get(substr2) ?? 0
    if (count > 0) {
      map.set(substr2, count - 1)
      match++
    }
  }

  return (match * 2) / (a.length + b.length - (substringLength - 1) * 2)
}
