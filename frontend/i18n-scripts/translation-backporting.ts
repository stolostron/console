/* Copyright Contributors to the Open Cluster Management project */
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import inquirer from 'inquirer'
import { simpleGit, type SimpleGit } from 'simple-git'

/** Resolved from repo `frontend/` (see `npm run i18n-backporting`). */
const LOCALES_DIR = path.resolve(process.cwd(), 'public', 'locales')

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

const STOLOSTRON_CONSOLE_REPO_PATH = 'stolostron/console'

/** Map a `git remote -v` fetch URL to `org/repo` when it is a github.com clone URL. */
function githubRepoPathFromRemoteUrl(url: string): string | undefined {
  const trimmed = url.trim().replace(/\.git$/i, '')
  const httpsMatch = /^https:\/\/github\.com\/([^/]+\/[^/]+)$/i.exec(trimmed)
  if (httpsMatch) return httpsMatch[1].toLowerCase()
  const sshMatch = /^git@github\.com:([^/]+\/[^/]+)$/i.exec(trimmed)
  if (sshMatch) return sshMatch[1].toLowerCase()
  return undefined
}

/** Name of the remote whose `(fetch)` URL points at https://github.com/stolostron/console.git (or SSH equivalent). */
function resolveStolostronUpstreamRemoteName(cwd: string): string {
  const out = execFileSync('git', ['remote', '-v'], { cwd, encoding: 'utf8' })
  for (const line of out.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const match = /^(\S+)\s+(\S+)\s+\(fetch\)$/.exec(trimmed)
    if (!match) continue
    const [, name, fetchUrl] = match
    if (githubRepoPathFromRemoteUrl(fetchUrl) === STOLOSTRON_CONSOLE_REPO_PATH) {
      return name
    }
  }
  throw new Error(
    `No git remote with fetch URL https://github.com/${STOLOSTRON_CONSOLE_REPO_PATH}.git (git@github.com:${STOLOSTRON_CONSOLE_REPO_PATH}.git is also accepted). Add one, e.g.: git remote add upstream https://github.com/${STOLOSTRON_CONSOLE_REPO_PATH}.git`
  )
}

/** Remote names whose `(fetch)` URL is not the stolostron/console upstream (forks and other clones). */
function listNonStolostronUpstreamRemoteNames(cwd: string): string[] {
  const out = execFileSync('git', ['remote', '-v'], { cwd, encoding: 'utf8' })
  const seen = new Set<string>()
  const names: string[] = []
  for (const line of out.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const match = /^(\S+)\s+(\S+)\s+\(fetch\)$/.exec(trimmed)
    if (!match) continue
    const [, name, fetchUrl] = match
    if (githubRepoPathFromRemoteUrl(fetchUrl) === STOLOSTRON_CONSOLE_REPO_PATH) {
      continue
    }
    if (!seen.has(name)) {
      seen.add(name)
      names.push(name)
    }
  }
  return names.sort((a, b) => {
    if (a === 'origin' && b !== 'origin') return -1
    if (b === 'origin' && a !== 'origin') return 1
    return a.localeCompare(b)
  })
}

const UPSTREAM_NAME = resolveStolostronUpstreamRemoteName(process.cwd())

void run().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

async function run(): Promise<void> {
  console.log(chalk.bgBlue.white.bold('\n       Translation Backporting v1.0.0      \n'))
  console.log(chalk.cyan(PROMPT_LINES))
  const gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: process.cwd(), encoding: 'utf8' }).trim()
  const git = simpleGit(gitRoot)

  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // ███████╗███████╗████████╗██╗   ██╗██████╗
  // ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
  // ███████╗█████╗     ██║   ██║   ██║██████╔╝
  // ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝
  // ███████║███████╗   ██║   ╚██████╔╝██║
  // ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  // --- FETCH FROM GIT ---
  try {
    console.log(chalk.dim(`Fetching from ${UPSTREAM_NAME}...`))
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
      chalk.yellow(`No release branch is at or behind ${UPSTREAM_NAME}/main (every tip has commits not in main).`)
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

  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // ███████╗██╗███╗   ██╗██████╗     ██████╗  █████╗  ██████╗██╗  ██╗██████╗  ██████╗ ██████╗ ████████╗███████╗
  // ██╔════╝██║████╗  ██║██╔══██╗    ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝
  // █████╗  ██║██╔██╗ ██║██║  ██║    ██████╔╝███████║██║     █████╔╝ ██████╔╝██║   ██║██████╔╝   ██║   ███████╗
  // ██╔══╝  ██║██║╚██╗██║██║  ██║    ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔═══╝ ██║   ██║██╔══██╗   ██║   ╚════██║
  // ██║     ██║██║ ╚████║██████╔╝    ██████╔╝██║  ██║╚██████╗██║  ██╗██║     ╚██████╔╝██║  ██║   ██║   ███████║
  // ╚═╝     ╚═╝╚═╝  ╚═══╝╚═════╝     ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
  //
  // //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

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

    for (const key of Object.keys(nextMap)) {
      if (!Object.prototype.hasOwnProperty.call(currentEn, key)) {
        continue
      }
      const nextEnVal = nextMap[key]
      const currentEnVal = currentEn[key]
      if (currentEnVal !== nextEnVal) {
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
  printBackportKeyCountsTable(backportMap, releaseRef)
  const detailChoice = await promptBackportDetailsChoice()
  if (detailChoice === 'q') {
    process.exit(0)
  }
  if (detailChoice === 'y') {
    printBackportMapFormatted(backportMap, releaseRef)
  }

  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  ██████╗ ██████╗ ███╗   ███╗███╗   ███╗██╗████████╗     █████╗ ███╗   ██╗██████╗     ██████╗ ██╗   ██╗███████╗██╗  ██╗
  // ██╔════╝██╔═══██╗████╗ ████║████╗ ████║██║╚══██╔══╝    ██╔══██╗████╗  ██║██╔══██╗    ██╔══██╗██║   ██║██╔════╝██║  ██║
  // ██║     ██║   ██║██╔████╔██║██╔████╔██║██║   ██║       ███████║██╔██╗ ██║██║  ██║    ██████╔╝██║   ██║███████╗███████║
  // ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██║   ██║       ██╔══██║██║╚██╗██║██║  ██║    ██╔═══╝ ██║   ██║╚════██║██╔══██║
  // ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║██║   ██║       ██║  ██║██║ ╚████║██████╔╝    ██║     ╚██████╔╝███████║██║  ██║
  //  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝   ╚═╝       ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝     ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝
  // //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  if (!payloadChanged) {
    console.log('No changes to backport...')
    process.exit(0)
  }

  const worktreeRelPath = 'frontend/i18n-scripts/temp'
  const worktreeAbsPath = path.join(gitRoot, ...worktreeRelPath.split('/'))
  const branchName = backportTranslationsBranchName(releaseRef)

  const createBranchChoice = await promptCreateBackportBranchYq(releaseRef)
  if (createBranchChoice === 'q') {
    process.exit(0)
  }

  const runCmd = (file: string, args: readonly string[], cwd: string): void => {
    execFileSync(file, args, { cwd, stdio: 'inherit' })
  }

  // STEP 2: create a new worktree
  console.log(chalk.yellow('\nSTEP 2: Create a new worktree.\n'))
  // git worktree add frontend/i18n-scripts/temp (remove first if this path is already in use)
  const worktreeListOut = execFileSync('git', ['worktree', 'list'], { cwd: gitRoot, encoding: 'utf8' })
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
    runCmd('git', ['worktree', 'remove', '--force', worktreeRelPath], gitRoot)
  } else if (fs.existsSync(worktreeAbsPath)) {
    // Leftover path on disk (not registered) would make `git worktree add` fail
    fs.rmSync(worktreeAbsPath, { recursive: true, force: true })
  }
  runCmd('git', ['worktree', 'add', worktreeRelPath], gitRoot)

  // STEP 3: change cwd to the new worktree and show pwd
  console.log(chalk.yellow('\nSTEP 3: Change cwd to the new worktree.\n'))
  // pushd frontend/i18n-scripts/temp
  // pwd
  const originalCwd = process.cwd()
  process.chdir(worktreeAbsPath)
  console.log(process.cwd())

  try {
    // STEP 4: create a new branch
    console.log(chalk.yellow('\nSTEP 4: Create a new branch.\n'))
    // git checkout -q -b ${branchName} --no-track upstream/${releaseRef}
    runCmd('git', ['checkout', '-q', '-b', branchName, '--no-track', releaseRef], process.cwd())

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
    runCmd('git', ['add', path.join('frontend', 'public', 'locales')], process.cwd())
    runCmd('git', ['diff', '--staged', '--name-only'], process.cwd())

    // STEP 7: commit staged changes
    console.log(chalk.yellow('\nSTEP 7: Commit staged changes.\n'))
    // git commit --signoff --no-verify -m "chore(i18n): backport translations to ${releaseRef}"
    runCmd(
      'git',
      ['commit', '--signoff', '--no-verify', '-m', `chore(i18n): backport translations to ${releaseRef}`],
      process.cwd()
    )

    // STEP 8: push changes
    console.log(chalk.yellow('\nSTEP 8: Push branch.\n'))
    const pushRemoteCandidates = listNonStolostronUpstreamRemoteNames(process.cwd())
    const pushRemote = await pickOriginBranch(pushRemoteCandidates)
    if (!pushRemote) {
      console.log(chalk.yellow('No push remote selected; skipping push and PR steps.'))
    } else {
      // git push --set-upstream <remote> ${branchName}
      runCmd('git', ['push', '--set-upstream', pushRemote, branchName], process.cwd())
    }

    // STEP 9: if gh exists, create a PR
    console.log(chalk.yellow('\nSTEP 9: Create PR (if gh is available).\n'))
    // gh pr create --base release-2.15 --title "chore(i18n): backport translations to ${releaseRef}" --body-file .github/pull_request_template.md
    let hasGh = false
    try {
      execFileSync('gh', ['--version'], { stdio: 'ignore' })
      hasGh = true
    } catch {
      hasGh = false
    }
    if (pushRemote && hasGh) {
      const createPr = await promptCreatePrYn(releaseRef)
      if (createPr === 'y') {
        const base = releaseRef.startsWith(`${UPSTREAM_NAME}/`)
          ? releaseRef.slice(UPSTREAM_NAME.length + 1)
          : releaseRef.replace(/\//g, '-')
        // So gh pr create targets the stolostron/console repo (not the fork default).
        runCmd('gh', ['repo', 'set-default', UPSTREAM_NAME], process.cwd())
        runCmd(
          'gh',
          [
            'pr',
            'create',
            '--base',
            base,
            '--title',
            `chore(i18n): backport translations to ${releaseRef}`,
            '--body-file',
            path.join('.github', 'pull_request_template.md'),
          ],
          process.cwd()
        )
      } else {
        console.log(chalk.dim('Skipping PR creation.'))
      }
    } else if (!pushRemote) {
      console.log(chalk.dim('Push was skipped; skipping PR creation step.'))
    } else {
      console.log(chalk.dim('gh not found; skipping PR creation step.'))
    }
  } finally {
    // STEP 10: remove the worktree
    console.log(chalk.yellow('\nSTEP 10: Remove the worktree.\n'))
    // git worktree remove frontend/i18n-scripts/temp
    runCmd('git', ['worktree', 'remove', worktreeRelPath], gitRoot)

    // STEP 11: return to the original cwd and show pwd
    console.log(chalk.yellow('\nSTEP 11: Return to original cwd.\n'))
    // popd
    // pwd
    process.chdir(originalCwd)
    console.log(process.cwd())
  }

  process.exit(0)
}

/** Per-language summary: full name; **Backports** is locale diff count, or English EN-diff count on the English row only. */
function printBackportKeyCountsTable(backportMap: LangRefPairMap, releaseRef: string): void {
  console.log()
  console.log()
  console.log(chalk.magenta.bold(`\nNumber of strings to be`))
  console.log(chalk.magenta.bold(`backported to ${releaseRef}\n`))
  const langs = new Set([...Object.keys(backportMap)])
  const rowsWithCount = [...langs].map((code) => {
    const nMap = backportMap[code] ? Object.keys(backportMap[code]).length : 0
    const count = nMap
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

type BackportBranchChoice = 'y' | 'q'

type YesNoChoice = 'y' | 'n'

/** Ask whether to open a PR targeting `releaseRef`; non-TTY returns `y`. */
async function promptCreatePrYn(releaseRef: string): Promise<YesNoChoice> {
  if (!process.stdin.isTTY) {
    return 'y'
  }
  return promptYn(`Create a PR for this branch to ${releaseRef}? (y/n)`)
}

async function promptYn(message: string): Promise<YesNoChoice> {
  const { choice } = await inquirer.prompt<{ choice: string }>([
    {
      type: 'input',
      name: 'choice',
      message,
      validate: (input: string) => {
        const c = input.trim().toLowerCase()
        if (c.length !== 1) {
          return 'Enter a single character: y or n'
        }
        if (c === 'y' || c === 'n') {
          return true
        }
        return 'Enter y or n'
      },
    },
  ])
  return choice.trim().toLowerCase() as YesNoChoice
}

/** Ask whether to print full backport diff; non-TTY returns `n`. */
async function promptBackportDetailsChoice(): Promise<BackportDetailsChoice> {
  if (!process.stdin.isTTY) {
    return 'n'
  }
  return promptYnq('Show details? (y/n/q)')
}

/** Proceed with backport branch or quit; non-TTY returns `y`. */
async function promptCreateBackportBranchYq(releaseRef: string): Promise<BackportBranchChoice> {
  if (!process.stdin.isTTY) {
    return 'y'
  }
  return promptYq(`\nCreate branch on ${releaseRef} for this backport? (y/q)`)
}

async function promptYq(message: string): Promise<BackportBranchChoice> {
  const { choice } = await inquirer.prompt<{ choice: string }>([
    {
      type: 'input',
      name: 'choice',
      message,
      validate: (input: string) => {
        const c = input.trim().toLowerCase()
        if (c.length !== 1) {
          return 'Enter a single character: y or q'
        }
        if (c === 'y' || c === 'q') {
          return true
        }
        return 'Enter y or q'
      },
    },
  ])
  return choice.trim().toLowerCase() as BackportBranchChoice
}

async function promptYnq(message: string): Promise<BackportDetailsChoice> {
  const { choice } = await inquirer.prompt<{ choice: string }>([
    {
      type: 'input',
      name: 'choice',
      message,
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
    try {
      const raw = await git.show(spec)
      translationMap[lang] = JSON.parse(raw) as Record<string, string>
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err)
      throw new Error(`Failed to read translations for locale "${lang}" (${spec}): ${detail}`, { cause: err })
    }
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
      message: 'Pick target release branch:',
      choices: pickChoices.map((ref) => ({ name: ref, value: ref })),
    },
  ])
  return releaseRef
}

/**
 * Pick the git remote for `git push --set-upstream` (must not be the stolostron/console fetch remote).
 * Non-interactive: set `I18N_BACKPORT_PUSH_REMOTE` to a name from `listNonStolostronUpstreamRemoteNames`.
 */
async function pickOriginBranch(pushRemoteNames: string[]): Promise<string | undefined> {
  if (pushRemoteNames.length === 0) {
    console.log(
      chalk.yellow(
        `No remotes found whose fetch URL is not https://github.com/${STOLOSTRON_CONSOLE_REPO_PATH}.git. Add a fork remote (e.g. git remote add origin https://github.com/<you>/console.git).`
      )
    )
    return undefined
  }

  const fromEnv = process.env.I18N_BACKPORT_PUSH_REMOTE?.trim()
  if (fromEnv) {
    if (pushRemoteNames.includes(fromEnv)) {
      console.log(chalk.dim(`Using I18N_BACKPORT_PUSH_REMOTE=${fromEnv}`))
      return fromEnv
    }
    console.log(chalk.red(`I18N_BACKPORT_PUSH_REMOTE=${fromEnv} is not a non-upstream remote name in this clone.`))
    console.log(chalk.dim(pushRemoteNames.join('\n')))
    return undefined
  }

  if (!process.stdin.isTTY) {
    console.log(
      chalk.yellow(
        `No TTY: set I18N_BACKPORT_PUSH_REMOTE to one of: ${pushRemoteNames.join(', ')} for a non-interactive run.`
      )
    )
    return undefined
  }

  const { remoteName } = await inquirer.prompt<{ remoteName: string }>([
    {
      type: 'select',
      name: 'remoteName',
      message: `Pick name of remote on which this branch will be pushed (it cannot be ${UPSTREAM_NAME}):`,
      choices: pushRemoteNames.map((name) => ({ name, value: name })),
    },
  ])
  return remoteName
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
