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
    ? ['run', '--coverage', '--coverage.reporter=html', '--coverage.reporter=text', '--coverage.reporter=json-summary']
    : ['run']

  const vitestExitCode = await run('vitest', vitestArgs)

  const testsStatus = vitestExitCode === 0 ? 'passing' : 'failing'
  const badgeArgs = coverage
    ? [`--testsStatus=${testsStatus}`]
    : [`--testsStatus=${testsStatus}`, '--skip-coverage']

  // Always attempt to update badges (even if tests failed).
  await run(process.execPath, ['scripts/generate-badges.mjs', ...badgeArgs])

  process.exit(vitestExitCode)
}

await main()
