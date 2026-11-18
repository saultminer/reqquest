/**
 * Assembles build-runtime/ - what the nginx image needs besides the static site - from the runtime
 * shipped in this package plus the project's own runtime/ folder.
 *
 *   <project>/runtime/nginx/server.d/*.conf   included inside our server block
 *   <project>/runtime/nginx/http.d/*.conf     included inside our http block
 *   <project>/runtime/apply-env.d/*.sh        run at container start, after our own steps
 *   <project>/runtime/nginx.conf              replaces ours
 *   <project>/runtime/apply-env.sh            replaces ours
 *
 * The drop-in folders exist so a project never has to replace our files to add a location or a
 * startup step: a replaced file stops receiving our changes, and nothing about a missing nginx
 * location fails a build. A project that replaces one anyway has forked it, so sync records our
 * version's hash in the overrides lockfile exactly as it does for a route override.
 *
 * Anything else under runtime/ is an error. A misspelled file there would otherwise be ignored in
 * silence, which is the failure this folder is meant to remove.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hash, SyncError, walk } from './util.js'

const BASE = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'app', 'runtime')
const REPLACEABLE = ['nginx.conf', 'apply-env.sh']
const DROP_INS = [
  { dir: join('nginx', 'server.d'), ext: '.conf' },
  { dir: join('nginx', 'http.d'), ext: '.conf' },
  { dir: 'apply-env.d', ext: '.sh' }
]

/** The project's runtime/ files, sorted into what they are; throws on anything unrecognized. */
function readProjectRuntime (projectRoot) {
  const root = join(projectRoot, 'runtime')
  const replaced = []
  const dropIns = []
  const unknown = []
  for (const rel of walk(root)) {
    if (REPLACEABLE.includes(rel)) replaced.push(rel)
    else if (DROP_INS.some(({ dir, ext }) => dirname(rel) === dir && rel.endsWith(ext))) dropIns.push(rel)
    else unknown.push(rel)
  }
  if (unknown.length) {
    throw new SyncError('runtime/ holds files reqquest-ui does not recognize, so they would never reach the image:\n' +
      unknown.map(rel => `  runtime${sep}${rel}`).join('\n') +
      `\nIt accepts ${REPLACEABLE.join(', ')}, and ${DROP_INS.map(({ dir, ext }) => `${dir}${sep}*${ext}`).join(', ')}.`)
  }
  return { root, replaced, dropIns }
}

/**
 * @returns {Map<string, string>} replaced runtime file -> hash of our version of it, for the
 *   overrides lockfile
 */
export function runtimeOverrides (projectRoot) {
  const { replaced } = readProjectRuntime(projectRoot)
  return new Map(replaced.map(rel => [rel, hash(readFileSync(join(BASE, rel)))]))
}

/** Writes build-runtime/. It is rebuilt from nothing so a drop-in the project deleted does not linger. */
export function writeRuntime (projectRoot) {
  const { root, replaced, dropIns } = readProjectRuntime(projectRoot)
  const out = join(projectRoot, 'build-runtime')
  rmSync(out, { recursive: true, force: true })
  // created even when empty, so a Dockerfile can COPY them unconditionally
  for (const { dir } of DROP_INS) mkdirSync(join(out, dir), { recursive: true })
  for (const rel of REPLACEABLE) cpSync(join(replaced.includes(rel) ? root : BASE, rel), join(out, rel))
  for (const rel of dropIns) cpSync(join(root, rel), join(out, rel))
  return { out, replaced, dropIns }
}
