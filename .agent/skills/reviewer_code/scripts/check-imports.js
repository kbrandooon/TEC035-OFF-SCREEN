#!/usr/bin/env node

/**
 * Check Imports Script
 *
 * Validates import patterns to ensure tree-shakeable imports:
 * - Detects wildcard imports (import * as)
 * - Flags potential non-tree-shakeable patterns
 *
 * Usage:
 *   node check-imports.js <file-path> [file-path...]
 *
 * Output: JSON array of violations with file, line, and pattern
 */

import fs from 'fs'
import path from 'path'

/**
 * Check a single file for import violations
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
      const trimmedLine = line.trim()

      // Skip comments
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
        return
      }

      // Pattern 1: Wildcard imports (import * as)
      const wildcardMatch = trimmedLine.match(
        /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/,
      )
      if (wildcardMatch) {
        const [, alias, module] = wildcardMatch
        violations.push({
          file: filePath,
          line: lineNumber,
          column: line.indexOf('import'),
          pattern: 'wildcard-import',
          severity: 'warning',
          message: `Wildcard import detected: import * as ${alias} from '${module}'`,
          suggestion:
            "Use named imports instead: import { specific, exports } from '...'",
        })
      }

      // Pattern 2: Check for common non-tree-shakeable patterns
      // Example: lodash without specific imports
      const lodashMatch = trimmedLine.match(
        /import\s+(\w+)\s+from\s+['"]lodash['"]/,
      )
      if (lodashMatch) {
        violations.push({
          file: filePath,
          line: lineNumber,
          column: line.indexOf('import'),
          pattern: 'non-tree-shakeable-lodash',
          severity: 'warning',
          message: 'Non-tree-shakeable lodash import detected',
          suggestion:
            "Use lodash-es with named imports: import { debounce } from 'lodash-es'",
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
    console.error('Usage: node check-imports.js <file-path> [file-path...]')
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
      bySeverity: allViolations.reduce((acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1
        return acc
      }, {}),
    },
  }

  console.log(JSON.stringify(result, null, 2))

  // Exit with error code if errors (not warnings) found
  const errorCount = allViolations.filter((v) => v.severity === 'error').length
  process.exit(errorCount > 0 ? 1 : 0)
}

main()
