import { spawn } from 'node:child_process'

function run(command, args) {
  return new Promise(resolve => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: process.env
    })

    child.on('close', code => {
      resolve(typeof code === 'number' ? code : 1)
    })

    child.on('error', () => {
      resolve(1)
    })
  })
}

function parseArgs(argv) {
  return {
    coverage: argv.includes('--coverage')
  }
}

async function main() {
  const { coverage } = parseArgs(process.argv.slice(2))

  const vitestArgs = coverage
    ? ['run', '--coverage', '--coverage.reporter=html', '--coverage.reporter=text', '--coverage.reporter=json-summary', '--coverage.reporter=lcov']
    : ['run']

  const vitestExitCode = await run('vitest', vitestArgs)

  process.exit(vitestExitCode)
}

await main()
