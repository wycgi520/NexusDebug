// Helper wrapper to launch electron-vite dev with ELECTRON_RUN_AS_NODE cleared
// This is needed when running inside VS Code / AI coding IDE which leaks that env var
const { spawnSync } = require('child_process')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const result = spawnSync(
  'electron-vite',
  ['dev'],
  {
    stdio: 'inherit',
    env,
    cwd: projectRoot,
    shell: true   // needed for .cmd files on Windows
  }
)

process.exit(result.status || 0)
