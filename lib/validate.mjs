import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { $, cd } from 'zx'

const message = 'Cannot use import statement outside a module'

$.verbose = false
const tmpdir = os.tmpdir()

async function validate (id) {
  console.log('Validating', id)
  const savedPath = process.cwd()
  const tempPath = await fs.mkdtemp(path.join(tmpdir, 'esmi-'))
  try {
    cd(tempPath)
    await execute(id)
  } catch (error) {
    if (error.stderr?.includes('code ENOVERSIONS')) {
      console.log('No available package versions')
      return
    } else if (error.stderr?.includes('no such package available')) {
      console.log('Package uninstallable')
      return
    } else if (error.stderr?.includes(message)) {
      console.log('INVALID: Uses ESM syntax in a CommonJS module')
      return
    } else if (error.stderr?.includes('command failed')) {
      console.log('Install script failed')
      return
    } else if (
      error.stderr?.includes('Cannot find package') ||
      error.stderr?.includes('Cannot find module')
    ) {
      console.log('Package unusable after install')
      return
    } else if (error.stderr?.includes('ReferenceError: ')) {
      console.log('Package threw error')
      return
    } else throw error
  } finally {
    cd(savedPath)
    await fs.rm(tempPath, { recursive: true })
  }
}

async function execute (id) {
  await $`npm install ${id}`
  const source = `import '${id}'`
  await $`node --input-type=module --eval ${source}`
  console.log('Importable from an ES module')
}

export default validate
