#!/usr/bin/env node

/**
 * Validates that package-lock.json is in sync with package.json
 *
 * This script checks if the lock file needs updating by running
 * npm install in dry-run mode and checking for changes.
 *
 * Usage: node validate-lockfile.js
 * Exit codes:
 *   0 - Lock file is in sync
 *   1 - Lock file is out of sync or validation failed
 */

import { execSync } from 'child_process';
import fs from 'fs';

function validateLockFile() {
  console.log('🔍 Validating package-lock.json sync...\n');

  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    console.error('❌ Error: package.json not found');
    process.exit(1);
  }

  // Check if package-lock.json exists
  if (!fs.existsSync('package-lock.json')) {
    console.error('❌ Error: package-lock.json not found');
    console.error('   Run "npm install" to generate the lock file');
    process.exit(1);
  }

  try {
    // Run npm install in dry-run mode to check if changes would be made
    // Use --ignore-scripts to avoid running prepare/postinstall hooks before deps are installed
    console.log('Running npm install --package-lock-only --dry-run...\n');

    try {
      const output = execSync('npm install --package-lock-only --dry-run --ignore-scripts', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Check if the output indicates any changes would be made
      if (output.includes('added') || output.includes('removed') || output.includes('changed')) {
        console.error('❌ Lock file is OUT OF SYNC with package.json\n');
        console.error('Changes that would be made:');
        console.error(output);
        console.error('\n💡 Fix: Run "npm install" to update package-lock.json');
        process.exit(1);
      }

      // Additional check: try npm ci in dry-run mode
      console.log('Running npm ci --dry-run to verify sync...\n');
      execSync('npm ci --dry-run --ignore-scripts', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      console.log('✅ Lock file is in sync with package.json');
      process.exit(0);

    } catch (error) {
      // npm ci --dry-run will fail if lock file is out of sync
      if (error.stderr && error.stderr.includes('in sync')) {
        console.error('❌ Lock file is OUT OF SYNC with package.json\n');
        console.error(error.stderr);
        console.error('\n💡 Fix: Run "npm install" to update package-lock.json');
        process.exit(1);
      }
      throw error;
    }

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    if (error.stderr) {
      console.error('\nDetails:', error.stderr);
    }
    process.exit(1);
  }
}

// Run validation
validateLockFile();
