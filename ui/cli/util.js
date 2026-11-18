import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

/** A problem with the project that the developer must fix; the CLI prints its message and exits 1. */
export class SyncError extends Error {}

/**
 * Finds an installed package's directory by walking node_modules upward from `from`, the way Node
 * resolves a bare import. Used instead of require.resolve because several of these packages declare
 * "exports" that do not expose package.json.
 */
export function packageDir (name, from) {
  let dir = from
  while (true) {
    const candidate = join(dir, 'node_modules', name)
    if (existsSync(join(candidate, 'package.json'))) return candidate
    const parent = dirname(dir)
    if (parent === dir) throw new Error(`Cannot find package '${name}' from ${from}. Is @reqquest/ui installed?`)
    dir = parent
  }
}

export function readJson (path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/** Absolute path of a package's executable, from its package.json "bin". */
export function packageBin (name, from, binName = name.split('/').pop()) {
  const dir = packageDir(name, from)
  const { bin } = readJson(join(dir, 'package.json'))
  return join(dir, typeof bin === 'string' ? bin : bin[binName])
}

/** Relative paths of every file under `root`, or [] if it does not exist. */
export function walk (root) {
  if (!existsSync(root) || !statSync(root).isDirectory()) return []
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter(e => e.isFile())
    .map(e => relative(root, join(e.parentPath, e.name)))
}

export function hash (content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}
