#!/usr/bin/env node
// Behavioural smoke test for the Student Management System.
//
// Start a server first, then run:
//   node tools/smoke-test.js http://localhost:3000
//
// On the CLEAN master build every check passes.
// On a BUGGY participant build the failing checks point at the broken
// features (API-level bugs only: 9, 10, 11, 12, 14, 15). Frontend bugs
// (1, 2, 3, 4, 5, 6, 8, 13) must be tested through the browser.

const BASE = process.argv[2] || 'http://localhost:3000';
let passed = 0;
let failed = 0;

async function call(method, path, body) {
  const options = { method: method };
  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, options);
  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }
  return { status: res.status, data: data };
}

function check(name, cond, extra) {
  if (cond) {
    passed += 1;
    console.log('PASS  ' + name);
  } else {
    failed += 1;
    console.log('FAIL  ' + name + (extra ? '  [' + extra + ']' : ''));
  }
}

function byId(students, id) {
  return students.find(function (s) { return s.id === id; }) || null;
}

async function main() {
  console.log('Smoke test against ' + BASE + '\n');

  let r = await call('POST', '/api/reset');
  check('POST /api/reset responds 200', r.status === 200 && r.data && r.data.success === true, 'status ' + r.status);

  // --- list ---------------------------------------------------------------
  r = await call('GET', '/api/students');
  const count = r.data && r.data.students ? r.data.students.length : -1;
  check('sample data has 12 students', count === 12, 'got ' + count);

  // --- search (bug 10) ------------------------------------------------------
  r = await call('GET', '/api/students/search?regno=CS231027');
  const found = r.data && r.data.student ? r.data.student : null;
  check('search CS231027 returns Priya Nair', found && found.name === 'Priya Nair', found ? found.name : 'not found');

  r = await call('GET', '/api/students/search?regno=cs231027');
  const foundLower = r.data && r.data.student ? r.data.student : null;
  check('search cs231027 (lowercase) returns Priya Nair', foundLower && foundLower.name === 'Priya Nair', foundLower ? foundLower.name : 'not found');

  r = await call('GET', '/api/students/search?regno=UNKNOWN999');
  check('search UNKNOWN999 returns 404', r.status === 404, 'status ' + r.status);

  // --- create (bug 11) ------------------------------------------------------
  r = await call('POST', '/api/students', {
    registerNumber: 'CS299999',
    name: 'Test Student',
    email: 'test.student@college.edu',
    phone: '9999999999',
    department: 'CSE',
    year: 1,
  });
  const created = r.data && r.data.student ? r.data.student : null;
  check('POST creates student (201, id 13)', r.status === 201 && created && created.id === 13, 'status ' + r.status);

  r = await call('POST', '/api/students', {
    registerNumber: 'CS299999',
    name: 'Another Student',
    email: 'another@college.edu',
    phone: '9999999998',
    department: 'IT',
    year: 2,
  });
  check('duplicate register number rejected (409)', r.status === 409, 'status ' + r.status);

  // --- update (bugs 9, 14, 15) ---------------------------------------------
  r = await call('PUT', '/api/students/3', { department: 'IT' });
  const upd = r.data && r.data.student ? r.data.student : null;
  check('PUT /api/students/3 updates student id 3', r.status === 200 && upd && upd.id === 3,
    upd ? ('server updated id ' + upd.id) : 'status ' + r.status);

  r = await call('GET', '/api/students');
  const list = (r.data && r.data.students) || [];
  const s2 = byId(list, 2);
  const s3 = byId(list, 3);
  const s13 = byId(list, 13);
  check('student 3 department is now IT', s3 && s3.department === 'IT', s3 ? ('department ' + s3.department) : 'missing');
  check('student 2 record untouched', s2 && s2.department === 'ECE' && s2.name === 'Diya Patel',
    s2 ? ('department ' + s2.department) : 'missing');
  check('student 13 record untouched', s13 && s13.department === 'CSE' && s13.name === 'Test Student',
    s13 ? ('department ' + s13.department) : 'missing');

  // --- delete (bugs 12, 15) --------------------------------------------------
  r = await call('DELETE', '/api/students/1');
  check('DELETE /api/students/1 succeeds', r.status === 200, 'status ' + r.status);

  r = await call('GET', '/api/students');
  const after = (r.data && r.data.students) || [];
  check('exactly one record removed (12 remain)', after.length === 12, 'got ' + after.length);
  check('student 1 removed', !byId(after, 1), 'still present');
  const expectedRemaining = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const missing = expectedRemaining.filter(function (id) { return !byId(after, id); });
  check('students 2-13 all still present', missing.length === 0, 'missing ids: ' + missing.join(', '));

  // --- reset -----------------------------------------------------------------
  r = await call('POST', '/api/reset');
  check('reset responds 200', r.status === 200 && r.data && r.data.success === true, 'status ' + r.status);
  r = await call('GET', '/api/students');
  const restored = (r.data && r.data.students) || [];
  const s1 = byId(restored, 1);
  check('reset restores 12 sample students', restored.length === 12, 'got ' + restored.length);
  check('reset restores original records (student 1 = Aarav Sharma)', s1 && s1.name === 'Aarav Sharma' && s1.registerNumber === 'CS231001',
    s1 ? s1.name : 'missing');

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  console.log('Note: this script exercises the API only. Frontend bugs (1, 2, 3, 4, 5, 6, 8, 13) must be verified in the browser.');
  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch(function (err) {
  console.error('Smoke test could not run: ' + err.message);
  process.exit(1);
});
