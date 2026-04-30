import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'
import inquirer from 'inquirer'
// import readline from 'node:readline'
// import tty from 'node:tty'
import { simpleGit, type SimpleGit } from 'simple-git'

/** Resolved from repo `frontend/` (see `npm run i18n-backporting`). */
const LOCALES_DIR = path.resolve(process.cwd(), 'public', 'locales')

const UPSTREAM_NAME = 'upstream'

/** Max release refs shown in the interactive picker (list is newest-first). */
const INTERACTIVE_RELEASE_PICK_LIMIT = 8

/** Language code → `translation.json` key/value pairs from the given release ref. */
type TranslationMap = Record<string, Record<string, string>>

/** Per-language key → old/new pair (e.g. older release vs newer release). */
type LangDiffMap = Record<string, Record<string, { old: string; new: string }>>

/** Per-language, per-lookup-key: string values keyed by git ref (e.g. `upstream/release-2.16`). */
type LangRefPairMap = Record<string, Record<string, Record<string, string>>>

const DISPLAY_LINE_MAX = 100

/** One output indent level for `printBackportMapFormatted` (2 characters). Key = 1×, ref lines = 2×. */
const INDENT = '  '

/** Max line length when clipping backport output for ja / ko / zh*. */
const BACKPORT_CLIP_MAX_CJK = 80

/** Max line length when clipping backport output for other locales. */
const BACKPORT_CLIP_MAX_OTHER = 132

const PROMPT_LINES = [
  'This utility will backport translations from the main branch to the selected release branch.',
  'If the selected release branch is up to date, it will exit with a message.',
  'Otherwise, it will create a new branch and backport the translations.',
  'The new branch will be named "backport-translations-to-<release>-<date-time>"',
  'The new branch will be created on the selected release branch.\n',
  'Note: You can also use a command line argument to specify the release branch.',
  'Example: npm run i18n-backporting release-2.17\n',
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

  const maybeMap: LangDiffMap = {}
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

  for (let i = 0; i < orderedReleases.length - 1; i++) {
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

    for (const key of Object.keys(nextMap)) {
      if (!Object.prototype.hasOwnProperty.call(currentEn, key)) {
        continue
      }
      const nextEnVal = nextMap[key]
      const currentEnVal = currentEn[key]
      if (currentEnVal !== nextEnVal) {
        if (!maybeMap['en']) {
          maybeMap['en'] = {}
        }
        maybeMap['en'][key] = { old: currentEnVal, new: nextEnVal }
        continue
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
            payloadMap[lang][lookupKey] = nxtLoc ?? ''
          }
        }
      }
    }
  }

  printBackportMapFormatted(backportMap, releaseRef)
  // console.log('maybeMap', maybeMap)

  const status = await git.status()
  if (!status.isClean()) {
    console.log(chalk.yellow('\nStashing uncommitted changes...\n'))
    // await git.stash(['push', '-m', 'WIP: translation backporting'])  // TOTOTOTOTDO
  }
  process.exit(0)
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

/** Prints each locale section: blue banner for the language name; keys and ref/value lines in dim white (releaseRef first). */
function printBackportMapFormatted(backportMap: LangRefPairMap, releaseRef: string): void {
  for (const lang of Object.keys(backportMap).sort()) {
    const lineMax = isJapaneseChineseKoreanLocale(lang) ? BACKPORT_CLIP_MAX_CJK : BACKPORT_CLIP_MAX_OTHER
    const fullName = localeCodeToFullLanguageName(lang)
    console.log(chalk.bgBlue.white.bold(`\n       ${fullName}      \n`))
    const byKey = backportMap[lang]
    if (!byKey) {
      continue
    }
    const keysSorted = Object.keys(byKey).sort()
    for (let ki = 0; ki < keysSorted.length; ki++) {
      const lookupKey = keysSorted[ki]
      console.log(chalk.dim.white(clipDisplayLine(`${INDENT}${lookupKey}`, lineMax)))
      const pair = byKey[lookupKey]!
      const refOrder: string[] = []
      if (Object.prototype.hasOwnProperty.call(pair, releaseRef)) {
        refOrder.push(releaseRef)
      }
      for (const ref of Object.keys(pair).sort()) {
        if (ref !== releaseRef) {
          refOrder.push(ref)
        }
      }
      for (const ref of refOrder) {
        const valThis = pair[ref].replace(/\s+/g, ' ').trim()
        const linePrefix = `${INDENT}${INDENT}${ref}: `
        console.log(chalk.dim.white(clipDisplayLine(linePrefix + valThis, lineMax)))
      }
      if (ki < keysSorted.length - 1) {
        console.log()
      }
    }
  }
}

function cloneTranslationMap(map: TranslationMap): TranslationMap {
  const out: TranslationMap = {}
  for (const [lang, entries] of Object.entries(map)) {
    out[lang] = { ...entries }
  }
  return out
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
