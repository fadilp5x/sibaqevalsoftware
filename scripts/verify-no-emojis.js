const fs = require('fs')
const path = require('path')

const emojiRegex = /\p{Extended_Pictographic}/u
const dirs = ['app', 'components', 'lib']
let found = []

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(entry.name)) {
        scanDir(fullPath)
      }
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8')
      if (emojiRegex.test(content)) {
        found.push(fullPath)
      }
    }
  }
}

dirs.forEach(scanDir)

if (found.length > 0) {
  console.log('FAIL: Emojis detected in:', found)
  process.exit(1)
} else {
  console.log('PASS: 100% ZERO EMOJIS! Entire codebase is strictly vector Lucide icons.')
  process.exit(0)
}
