#!/usr/bin/env node
/**
 * Builds and runs a downstream ReqQuest UI. The project needs only @reqquest/ui installed and a
 * src/local/index.ts exporting `uiRegistry`; svelte, SvelteKit, Vite and their configuration all come
 * from this package. See docs/downstream-ui.md.
 *
 *   reqquest-ui sync [--strict] [--accept]   assemble .reqquest/ (see cli/sync.js)
 *   reqquest-ui dev [vite args...]           sync, then the Vite dev server; re-syncs on changes
 *   reqquest-ui build                        sync --strict, registry check, production build
 *                                            -> build/ (static site) and build-runtime/ (nginx,
 *                                               with the project's runtime/ - see cli/runtime.js)
 *   reqquest-ui check [svelte-check args]    type-check everything, including src/local
 *   reqquest-ui check-registry               fail if src/local/index.ts has type errors
 *
 * Run it from the project root (the directory holding package.json and src/local).
 */
import { spawnSync, spawn } from 'node:child_process'
import { existsSync, watch } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeRuntime } from '../cli/runtime.js'
import { sync, SyncError } from '../cli/sync.js'
import { packageBin } from '../cli/util.js'

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot = process.cwd()
const appRoot = join(projectRoot, '.reqquest')
const [command, ...args] = process.argv.slice(2)

function run (pkg, bin, binArgs) {
  const result = spawnSync(process.execPath, [packageBin(pkg, PACKAGE_ROOT, bin), ...binArgs], { cwd: appRoot, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function svelteKitSync () {
  run('@sveltejs/kit', 'svelte-kit', ['sync'])
}

/** Ported from ui/check-registry.js, which explains why the gate is narrowed to one file. */
function checkRegistry () {
  const REGISTRY = 'src/local/index.ts'
  const result = spawnSync(process.execPath, [packageBin('svelte-check', PACKAGE_ROOT), '--tsconfig', './tsconfig.json', '--output', 'machine'], { cwd: appRoot, encoding: 'utf8' })
  const errors = (result.stdout ?? '').split('\n').filter(line => line.includes(' ERROR ') && line.includes(`${REGISTRY}"`))
  if (errors.length > 0) {
    console.error(`${REGISTRY} has ${errors.length} type error(s).\n`)
    for (const line of errors) console.error(line)
    console.error('\nA missing prompt means the API defines a prompt this UI has no component for.')
    console.error(`Add it to the prompts object in ${REGISTRY}, or regenerate the key declaration if the API's definitions changed.`)
    process.exit(1)
  }
  console.log(`${REGISTRY} is in step with the generated key declaration.`)
}

function dev () {
  sync(projectRoot)
  svelteKitSync()
  const vite = spawn(process.execPath, [packageBin('vite', PACKAGE_ROOT), 'dev', ...args], { cwd: appRoot, stdio: 'inherit' })
  vite.on('exit', code => process.exit(code ?? 0))

  // src/local is aliased in place, so Vite already watches it; routes and static are copied
  let timer
  const resync = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        sync(projectRoot)
      } catch (e) {
        if (!(e instanceof SyncError)) throw e
        console.error(`reqquest-ui: ${e.message}`)
      }
    }, 100)
  }
  for (const dir of ['src/routes', 'static']) {
    if (existsSync(join(projectRoot, dir))) watch(join(projectRoot, dir), { recursive: true }, resync)
  }
  watch(join(projectRoot, 'package.json'), resync)
}

function build () {
  sync(projectRoot, { strict: true })
  svelteKitSync()
  checkRegistry()
  run('vite', 'vite', ['build'])
  const { replaced, dropIns } = writeRuntime(projectRoot)
  console.log('reqquest-ui: site written to build/, the nginx runtime to build-runtime/' +
    (replaced.length || dropIns.length ? ` (from your runtime/: ${[...replaced, ...dropIns].join(', ')})` : ''))
}

try {
  switch (command) {
    case 'sync':
      sync(projectRoot, { strict: args.includes('--strict'), accept: args.includes('--accept') })
      break
    case 'dev':
      dev()
      break
    case 'build':
      build()
      break
    case 'check':
      sync(projectRoot)
      svelteKitSync()
      run('svelte-check', 'svelte-check', ['--tsconfig', './tsconfig.json', ...args])
      break
    case 'check-registry':
      sync(projectRoot)
      svelteKitSync()
      checkRegistry()
      break
    default:
      console.error('usage: reqquest-ui <sync [--strict] [--accept] | dev | build | check | check-registry>')
      process.exit(command ? 1 : 0)
  }
} catch (e) {
  if (!(e instanceof SyncError)) throw e
  console.error(`reqquest-ui: ${e.message}`)
  process.exit(1)
}
