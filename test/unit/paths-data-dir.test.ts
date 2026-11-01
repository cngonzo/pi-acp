import test from 'node:test'
import assert from 'node:assert/strict'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { getPiAcpDir, getPiAcpSessionMapPath } from '../../src/acp/paths.js'

function withEnv<T>(value: string | undefined, fn: () => T): T {
  const previous = process.env.PI_ACP_DATA_DIR
  if (value === undefined) delete process.env.PI_ACP_DATA_DIR
  else process.env.PI_ACP_DATA_DIR = value
  try {
    return fn()
  } finally {
    if (previous === undefined) delete process.env.PI_ACP_DATA_DIR
    else process.env.PI_ACP_DATA_DIR = previous
  }
}

test('getPiAcpDir defaults to ~/.pi/pi-acp when PI_ACP_DATA_DIR is unset', () => {
  const dir = withEnv(undefined, getPiAcpDir)
  assert.equal(dir, join(homedir(), '.pi', 'pi-acp'))
})

test('PI_ACP_DATA_DIR overrides the adapter data directory', () => {
  const dir = withEnv('/tmp/branded-session-map-dir', getPiAcpDir)
  assert.equal(dir, '/tmp/branded-session-map-dir')
})

test('PI_ACP_DATA_DIR is resolved, so relative paths cannot drift with cwd', () => {
  const dir = withEnv('relative/adapter-dir', getPiAcpDir)
  assert.ok(dir.startsWith('/'), `expected an absolute path, got ${dir}`)
  assert.ok(dir.endsWith('relative/adapter-dir'))
})

test('the session map follows the override', () => {
  const map = withEnv('/tmp/two-adapters/pi-acp', getPiAcpSessionMapPath)
  assert.equal(map, '/tmp/two-adapters/pi-acp/session-map.json')
})

test('two adapters can be given disjoint session maps', () => {
  const interactive = withEnv('/tmp/braid/interactive', getPiAcpSessionMapPath)
  const build = withEnv('/tmp/braid/build', getPiAcpSessionMapPath)
  assert.notEqual(interactive, build)
  assert.ok(interactive.endsWith('/interactive/session-map.json'))
  assert.ok(build.endsWith('/build/session-map.json'))
})
