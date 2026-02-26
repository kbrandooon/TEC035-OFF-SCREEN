#!/usr/bin/env node

/**
 * Check Supabase Queries Script
 *
 * Detects forbidden Supabase query patterns:
 * - .select('*')
 * - .select() without explicit columns
 *
 * Usage:
 *   node check-supabase-queries.js <file-path> [file-path...]
 *
 * Output: JSON array of violations with file, line, column, and pattern
 */

import fs from 'fs'
import path from 'path'

/**
 * Check a single file for Supabase query violations
 * @param {string} filePath - Path to file to check
 * @returns {Object[]} Array of violations
 */
function checkFile(filePath) {
  const violations = []

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    lines.forEach((line, index) => {
      const lineNumber = index + 1

      // Pattern 1: .select('*')
      if (/\.select\s*\(\s*['"`]\*['"`]\s*\)/.test(line)) {
        violations.push({
          file: filePath,
          line: lineNumber,
          column: line.indexOf('.select'),
          pattern: ".select('*')",
          severity: 'error',
          message:
            "Forbidden: .select('*') detected. Use explicit column list.",
          suggestion: "Replace with .select('column1, column2, ...')",
        })
      }

      // Pattern 2: .select() without arguments (empty or whitespace only)
      if (/\.select\s*\(\s*\)/.test(line)) {
        violations.push({
          file: filePath,
          line: lineNumber,
          column: line.indexOf('.select'),
          pattern: '.select()',
          severity: 'error',
          message: 'Forbidden: .select() without explicit columns detected.',
          suggestion:
            "Add explicit column list: .select('column1, column2, ...')",
        })
      }
    })
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message)
  }

  return violations
}

/**
 * Main execution
 */
function main() {
  const files = process.argv.slice(2)

  if (files.length === 0) {
    console.error(
      'Usage: node check-supabase-queries.js <file-path> [file-path...]',
    )
    process.exit(1)
  }

  const allViolations = []

  files.forEach((file) => {
    const violations = checkFile(file)
    allViolations.push(...violations)
  })

  const result = {
    totalViolations: allViolations.length,
    violations: allViolations,
    summary: {
      byPattern: allViolations.reduce((acc, v) => {
        acc[v.pattern] = (acc[v.pattern] || 0) + 1
        return acc
      }, {}),
      byFile: allViolations.reduce((acc, v) => {
        acc[v.file] = (acc[v.file] || 0) + 1
        return acc
      }, {}),
    },
  }

  console.log(JSON.stringify(result, null, 2))

  // Exit with error code if violations found
  process.exit(allViolations.length > 0 ? 1 : 0)
}

main()
