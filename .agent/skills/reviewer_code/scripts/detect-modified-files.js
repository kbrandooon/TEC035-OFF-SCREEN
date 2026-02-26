#!/usr/bin/env node

/**
 * Detect Modified Files Script
 *
 * Detects files that have been modified (staged or unstaged) in the git repository.
 * Filters for relevant file extensions (.ts, .tsx, .js, .jsx) and outputs JSON.
 *
 * Usage:
 *   node detect-modified-files.js [--staged|--unstaged|--all]
 *
 * Options:
 *   --staged    Only show staged files (default)
 *   --unstaged  Only show unstaged files
 *   --all       Show both staged and unstaged files
 */

import { execSync } from 'child_process'
import path from 'path'

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

/**
 * Execute git command and return file list
 * @param {string} command - Git command to execute
 * @returns {string[]} Array of file paths
 */
function getGitFiles(command) {
  try {
    const output = execSync(command, { encoding: 'utf-8' })
    return output
      .split('\n')
      .filter(Boolean)
      .filter((file) => {
        const ext = path.extname(file)
        return SUPPORTED_EXTENSIONS.includes(ext)
      })
  } catch (error) {
    // If git command fails (e.g., no changes), return empty array
    return []
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || '--staged'

  let stagedFiles = []
  let unstagedFiles = []

  if (mode === '--staged' || mode === '--all') {
    stagedFiles = getGitFiles('git diff --cached --name-only')
  }

  if (mode === '--unstaged' || mode === '--all') {
    unstagedFiles = getGitFiles('git diff --name-only')
  }

  const result = {
    staged: stagedFiles,
    unstaged: unstagedFiles,
    all: [...new Set([...stagedFiles, ...unstagedFiles])],
    count: {
      staged: stagedFiles.length,
      unstaged: unstagedFiles.length,
      total: [...new Set([...stagedFiles, ...unstagedFiles])].length,
    },
  }

  console.log(JSON.stringify(result, null, 2))
}

main()
