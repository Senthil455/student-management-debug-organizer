#!/usr/bin/env node
// Generates a participant build of the Student Management System with the
// selected bugs injected into the source code.
//
// Usage:
//   node tools/generate.js --list
//   node tools/generate.js --bugs 1,2,9,14 --out teams/teamA
//   node tools/generate.js --bugs 1,2,9,14 --out teams/teamA --force

const fs = require('fs');
const path = require('path');
const { BUGS, CONFLICTS } = require('./bugs');

const ROOT = path.join(__dirname, '..');

// Files and folders copied into every generated build.
// tools/, README.md and ANSWER_KEY.md are deliberately NOT copied:
// participants must not receive the solutions.
const COPY_ITEMS = ['server.js', 'package.json', 'package-lock.json', 'src', 'public', 'data'];

function normalize(text) {
  return String(text).replace(/\r\n/g, '\n');
}

function parseArgs(argv) {
  const args = { out: 'build' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') args.list = true;
    else if (a === '--force') args.force = true;
    else if (a === '--bugs') { i += 1; args.bugs = argv[i]; }
    else if (a === '--out') { i += 1; args.out = argv[i]; }
    else {
      console.error('Unknown option: ' + a);
      process.exit(1);
    }
  }
  return args;
}

function listBugs() {
  console.log('Available bugs:\n');
  console.log('ID    Difficulty  Area                                      Title');
  console.log('----  ----------  ----------------------------------------  ----------------------------------------');
  BUGS.forEach(function (b) {
    console.log(
      String(b.id).padEnd(5) +
      b.difficulty.padEnd(11) +
      b.area.padEnd(41) +
      b.title
    );
  });
  console.log('\nIncompatible combinations (patch the same code):');
  CONFLICTS.forEach(function (pair) {
    console.log('  Bug ' + pair[0] + ' + Bug ' + pair[1]);
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    listBugs();
    return;
  }

  if (!args.bugs) {
    console.error('Usage: node tools/generate.js --bugs <id,id,...> --out <folder> [--force]');
    console.error('       node tools/generate.js --list');
    process.exit(1);
  }

  const rawIds = args.bugs.split(',').map(function (s) { return parseInt(s.trim(), 10); });
  const invalid = rawIds.filter(function (id) {
    return !BUGS.some(function (b) { return b.id === id; });
  });
  if (rawIds.length === 0 || invalid.length > 0) {
    console.error('Invalid or unknown bug ids: ' + (invalid.join(', ') || '(none given)') + '. Run with --list to see available ids.');
    process.exit(1);
  }

  const ids = rawIds.filter(function (id, i) { return rawIds.indexOf(id) === i; });
  if (ids.length !== rawIds.length) {
    console.error('Warning: duplicate bug ids were ignored.');
  }

  const enabled = ids.map(function (id) {
    return BUGS.find(function (b) { return b.id === id; });
  });

  // Reject combinations that patch overlapping code.
  const conflicts = [];
  CONFLICTS.forEach(function (pair) {
    if (ids.indexOf(pair[0]) !== -1 && ids.indexOf(pair[1]) !== -1) {
      conflicts.push('Bug ' + pair[0] + ' + Bug ' + pair[1]);
    }
  });
  if (conflicts.length > 0) {
    console.error('These bugs cannot be combined because they patch the same code: ' + conflicts.join(', '));
    process.exit(1);
  }

  const outDir = path.resolve(ROOT, args.out);
  if (fs.existsSync(outDir) && !args.force) {
    console.error('Output folder already exists: ' + outDir + ' (use --force to overwrite)');
    process.exit(1);
  }
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  COPY_ITEMS.forEach(function (item) {
    const src = path.join(ROOT, item);
    if (!fs.existsSync(src)) {
      if (item === 'package-lock.json') {
        return; // created by npm install; optional
      }
      console.error('Missing source item: ' + item);
      process.exit(1);
    }
    fs.cpSync(src, path.join(outDir, item), { recursive: true });
  });

  // Participant-facing instructions (no hints about the bugs).
  const readmeSrc = path.join(ROOT, 'PARTICIPANT_README.md');
  if (fs.existsSync(readmeSrc)) {
    fs.copyFileSync(readmeSrc, path.join(outDir, 'README.md'));
  }

  // Inject the selected bugs.
  enabled.forEach(function (bug) {
    bug.patches.forEach(function (patch) {
      const file = path.join(outDir, patch.file);
      const content = normalize(fs.readFileSync(file, 'utf-8'));
      const find = normalize(patch.find);
      const replace = normalize(patch.replace);
      const occurrences = content.split(find).length - 1;

      if (occurrences === 0) {
        console.error('PATCH FAILED (bug ' + bug.id + ', ' + patch.file + '): snippet not found.');
        console.error('The clean sources no longer match tools/bugs.js - update the catalogue.');
        process.exit(1);
      }
      if (occurrences > 1) {
        console.error('PATCH FAILED (bug ' + bug.id + ', ' + patch.file + '): snippet occurs ' + occurrences + ' times; it must be unique.');
        process.exit(1);
      }
      fs.writeFileSync(file, content.replace(find, replace));
    });
  });

  console.log('\nGenerated participant build: ' + outDir + '\n');
  console.log('Bugs enabled (' + enabled.length + '):');
  enabled.forEach(function (b) {
    console.log('  [Bug ' + String(b.id).padStart(2) + '] ' + b.difficulty.padEnd(7) + ' ' + b.title + '  (' + b.area + ')');
  });
  console.log('\nNext steps:');
  console.log('  cd ' + path.relative(process.cwd(), outDir));
  console.log('  npm install');
  console.log('  npm start        then open http://localhost:3000');
}

main();
