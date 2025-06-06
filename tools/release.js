#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

// Simple argument parser
function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].substring(2)
      const value = argv[i + 1]
      args[key] = value
      i++
    }
  }
  return args
}

class SemVer {
  constructor(version) {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
    if (!match) {
      throw new Error(`Invalid semver: ${version}`)
    }
    this.major = parseInt(match[1])
    this.minor = parseInt(match[2])
    this.patch = parseInt(match[3])
  }

  bump(type) {
    switch (type) {
      case 'major':
        this.major++
        this.minor = 0
        this.patch = 0
        break
      case 'minor':
        this.minor++
        this.patch = 0
        break
      case 'patch':
        this.patch++
        break
    }
  }

  toString() {
    return `${this.major}.${this.minor}.${this.patch}`
  }
}

function parseConventionalCommit(message) {
  // Parse conventional commit format: type(scope): description
  const conventionalRegex = /^(\w+)(\(([^)]+)\))?\!?:\s*(.+)$/m
  const match = message.match(conventionalRegex)

  if (match) {
    const [, type, , scope, description] = match
    const breaking = message.includes('BREAKING CHANGE') || message.includes('!:')

    return {
      type: type.toLowerCase(),
      scope,
      description: description.trim(),
      breaking,
      original: message,
    }
  }

  // Fallback for non-conventional commits
  return {
    type: 'other',
    description: message.split('\n')[0].trim(),
    breaking: false,
    original: message,
  }
}

async function readPackageConfig() {
  try {
    const content = fs.readFileSync('package.json', 'utf8')
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`Failed to read package.json: ${error.message}`)
  }
}

async function writePackageConfig(config) {
  try {
    const content = JSON.stringify(config, null, 2) + '\n'
    fs.writeFileSync('package.json', content)
  } catch (error) {
    throw new Error(`Failed to write package.json: ${error.message}`)
  }
}

async function readExistingChangelog() {
  try {
    return fs.readFileSync('CHANGELOG.md', 'utf8')
  } catch {
    return ''
  }
}

function generateChangelogEntry(entry) {
  let changelog = `## [${entry.version}] - ${entry.date}\n\n`

  if (entry.changes.breaking.length > 0) {
    changelog += '### ⚠ BREAKING CHANGES\n\n'
    for (const commit of entry.changes.breaking) {
      const scope = commit.scope ? `**${commit.scope}**: ` : ''
      changelog += `- ${scope}${commit.description}\n`
    }
    changelog += '\n'
  }

  if (entry.changes.feat.length > 0) {
    changelog += '### ✨ Features\n\n'
    for (const commit of entry.changes.feat) {
      const scope = commit.scope ? `**${commit.scope}**: ` : ''
      changelog += `- ${scope}${commit.description}\n`
    }
    changelog += '\n'
  }

  if (entry.changes.fix.length > 0) {
    changelog += '### 🐛 Bug Fixes\n\n'
    for (const commit of entry.changes.fix) {
      const scope = commit.scope ? `**${commit.scope}**: ` : ''
      changelog += `- ${scope}${commit.description}\n`
    }
    changelog += '\n'
  }

  if (entry.changes.other.length > 0) {
    changelog += '### 📝 Other Changes\n\n'
    for (const commit of entry.changes.other) {
      const scope = commit.scope ? `**${commit.scope}**: ` : ''
      changelog += `- ${scope}${commit.description}\n`
    }
    changelog += '\n'
  }

  return changelog
}

async function updateChangelog(newEntry) {
  const existingChangelog = await readExistingChangelog()
  const newEntryText = generateChangelogEntry(newEntry)

  let updatedChangelog

  if (existingChangelog.trim() === '') {
    // Create new changelog
    updatedChangelog = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n${newEntryText}`
  } else {
    // Insert new entry after the header
    const lines = existingChangelog.split('\n')
    const insertIndex = lines.findIndex((line) => line.startsWith('## [')) || lines.length
    lines.splice(insertIndex, 0, newEntryText)
    updatedChangelog = lines.join('\n')
  }

  fs.writeFileSync('CHANGELOG.md', updatedChangelog)
}

async function generateReleaseNotes(entry, prTitle, prNumber) {
  let releaseNotes = `# Release ${entry.version}\n\n`
  releaseNotes += `**Merged PR**: ${prTitle} (#${prNumber})\n\n`

  const entryText = generateChangelogEntry(entry)
  // Remove the version header from the entry since we have our own
  const entryWithoutHeader = entryText.replace(/^## \[.*?\] - .*?\n\n/, '')
  releaseNotes += entryWithoutHeader

  fs.writeFileSync('RELEASE_NOTES.md', releaseNotes)
}

async function main() {
  const args = parseArgs(process.argv)

  const bumpType = args['bump-type'] || 'patch'
  const prNumber = args['pr-number']
  const prTitle = args['pr-title'] || 'Merged changes'
  const commitsJson = args['commits']

  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error("Invalid bump type. Must be 'major', 'minor', or 'patch'")
    process.exit(1)
  }

  // Parse commits
  let commits = []
  if (commitsJson) {
    try {
      commits = JSON.parse(commitsJson)
    } catch (error) {
      console.error('Failed to parse commits JSON:', error.message)
      process.exit(1)
    }
  }

  console.log(`Processing ${commits.length} commits for ${bumpType} release...`)

  // Read current version
  const config = await readPackageConfig()
  const currentVersion = new SemVer(config.version)

  console.log(`Current version: ${currentVersion.toString()}`)

  // Bump version
  currentVersion.bump(bumpType)
  const newVersion = currentVersion.toString()

  console.log(`New version: ${newVersion}`)

  // Update package.json
  config.version = newVersion
  await writePackageConfig(config)

  // Parse commits and categorize
  const parsedCommits = commits.map(parseConventionalCommit)

  const changelogEntry = {
    version: newVersion,
    date: new Date().toISOString().split('T')[0],
    changes: {
      breaking: parsedCommits.filter((c) => c.breaking),
      feat: parsedCommits.filter((c) => c.type === 'feat' && !c.breaking),
      fix: parsedCommits.filter((c) => c.type === 'fix' && !c.breaking),
      other: parsedCommits.filter((c) => !['feat', 'fix'].includes(c.type) && !c.breaking),
    },
  }

  // Update changelog
  await updateChangelog(changelogEntry)

  // Generate release notes
  await generateReleaseNotes(changelogEntry, prTitle, prNumber)

  // Set environment variable for GitHub Actions
  fs.writeFileSync('.env', `NEW_VERSION=${newVersion}\n`)

  // Also write to GITHUB_ENV if running in GitHub Actions
  const githubEnv = process.env.GITHUB_ENV
  if (githubEnv) {
    fs.appendFileSync(githubEnv, `NEW_VERSION=${newVersion}\n`)
  }

  console.log(`✅ Release ${newVersion} prepared successfully!`)
  console.log('📝 Updated files:')
  console.log('  - package.json')
  console.log('  - CHANGELOG.md')
  console.log('  - RELEASE_NOTES.md')
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Error:', error.message)
    process.exit(1)
  })
}
