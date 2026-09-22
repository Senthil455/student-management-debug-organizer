// Bug catalogue for the debugging round.
//
// Every bug is a set of exact-text patches that tools/generate.js applies to
// the CLEAN master sources to produce a participant build. Each `find`
// snippet must occur exactly once in its file; the generator verifies this
// and fails loudly if the clean sources ever drift from this catalogue.
//
// Do not enable bugs in the master build - master is always the fixed app.

const BUGS = [
  // ---------------------------- EASY ----------------------------
  {
    id: 1,
    title: 'Empty Student Name Accepted',
    difficulty: 'Easy',
    area: 'Frontend (registration form)',
    scenario: 'Scenario 1 - Student Registration',
    symptom: 'The registration form submits successfully with the name field left empty; a student with a blank name is saved.',
    patches: [
      {
        file: 'public/js/register.js',
        find: String.raw`  if (name.trim() === '') {
    showMessage(msg, 'Student name is required.', 'error');
    return;
  }`,
        replace: String.raw`  // TODO: add name validation`,
      },
    ],
  },
  {
    id: 2,
    title: 'Invalid Email Accepted',
    difficulty: 'Easy',
    area: 'Frontend (registration form)',
    scenario: 'Scenario 1 - Student Registration',
    symptom: 'Emails such as "student@" or "abc.com" pass validation and are saved.',
    patches: [
      {
        file: 'public/js/register.js',
        find: String.raw`  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMessage(msg, 'Please enter a valid email address.', 'error');
    return;
  }`,
        replace: String.raw`  if (email.trim() === '') {
    showMessage(msg, 'Email is required.', 'error');
    return;
  }`,
      },
    ],
  },
  {
    id: 3,
    title: 'Negative Phone Number Accepted',
    difficulty: 'Easy',
    area: 'Frontend (registration form)',
    scenario: 'Scenario 1 - Student Registration',
    symptom: 'The phone field accepts values like -9876543210 because only "is it a number" is checked.',
    patches: [
      {
        file: 'public/js/register.js',
        find: String.raw`  if (!/^\d{10}$/.test(phone)) {
    showMessage(msg, 'Phone number must be exactly 10 digits.', 'error');
    return;
  }`,
        replace: String.raw`  if (isNaN(Number(phone))) {
    showMessage(msg, 'Phone number must be a number.', 'error');
    return;
  }`,
      },
    ],
  },
  {
    id: 4,
    title: 'Search Button Not Working',
    difficulty: 'Easy',
    area: 'Frontend (search page)',
    scenario: 'Scenario 2 - Student Search',
    symptom: 'Clicking Search does nothing; the console shows "Cannot read properties of null" because the listener targets a wrong element id.',
    patches: [
      {
        file: 'public/js/search.js',
        find: String.raw`searchBtn.addEventListener('click', handleSearch);`,
        replace: String.raw`document.getElementById('search-button').addEventListener('click', handleSearch);`,
      },
    ],
  },
  {
    id: 5,
    title: 'Wrong Student Details Displayed',
    difficulty: 'Easy',
    area: 'Frontend/API (search page)',
    scenario: 'Scenario 2 - Student Search',
    symptom: 'Any register number that is searched shows the first student in the list: the page fetches the full list instead of calling the search API.',
    patches: [
      {
        file: 'public/js/search.js',
        find: String.raw`  const result = await api('/api/students/search?regno=' + encodeURIComponent(regno));`,
        replace: String.raw`  const result = await api('/api/students');`,
      },
      {
        file: 'public/js/search.js',
        find: String.raw`  renderStudent(result.data.student);`,
        replace: String.raw`  renderStudent(result.data.students[0]);`,
      },
    ],
  },
  {
    id: 6,
    title: 'Update Button Does Not Send Correct ID',
    difficulty: 'Easy',
    area: 'Frontend/API (update page)',
    scenario: 'Scenario 3 - Update Student Details',
    symptom: 'Saving changes always fails with "Student not found": the update request sends the register number in the URL instead of the student id.',
    patches: [
      {
        file: 'public/js/update.js',
        find: String.raw`  const result = await api('/api/students/' + currentStudent.id, {`,
        replace: String.raw`  const result = await api('/api/students/' + document.getElementById('findRegno').value, {`,
      },
    ],
  },
  {
    id: 7,
    title: 'Delete Button Does Not Delete Record',
    difficulty: 'Easy',
    area: 'Backend (API route)',
    scenario: 'Scenario 3 - Update Student Details',
    symptom: 'Delete shows "API route not found" and the record stays; the DELETE route is commented out in the backend.',
    patches: [
      {
        file: 'src/routes/students.js',
        find: String.raw`router.delete('/:id', ctrl.deleteStudent);`,
        replace: String.raw`// TODO: re-enable delete once role checks are in place
// router.delete('/:id', ctrl.deleteStudent);`,
      },
    ],
  },
  {
    id: 8,
    title: 'Incorrect Success Message',
    difficulty: 'Easy',
    area: 'Frontend (registration form)',
    scenario: 'Scenario 1 - Student Registration',
    symptom: '"Student added successfully!" is shown even when the server rejects the request (e.g. duplicate register number, 409).',
    patches: [
      {
        file: 'public/js/register.js',
        find: String.raw`  if (result.ok && result.data.success) {
    showMessage(msg, 'Student added successfully!', 'success');
    form.reset();
  } else {
    showMessage(msg, result.data.message || 'Registration failed. Please try again.', 'error');
  }`,
        replace: String.raw`  showMessage(msg, 'Student added successfully!', 'success');
  form.reset();`,
      },
    ],
  },

  // ---------------------------- MEDIUM ----------------------------
  {
    id: 9,
    title: 'Wrong Student Updated',
    difficulty: 'Medium',
    area: 'Backend (controller + database id handling)',
    scenario: 'Scenario 3 - Update Student Details',
    symptom: 'Updating student id 3 changes student id 2 instead: the controller passes an array INDEX into db.updateStudent(), which expects a student ID.',
    patches: [
      {
        file: 'src/controllers/studentController.js',
        find: String.raw`  const updated = db.updateStudent(id, updates);`,
        replace: String.raw`  // pass the record position for a faster update
  const updated = db.updateStudent(db.getAll().findIndex((s) => s.id === id), updates);`,
      },
    ],
  },
  {
    id: 10,
    title: 'Search Query Error (wrong field / inverted match)',
    difficulty: 'Medium',
    area: 'Backend/Database (search query)',
    scenario: 'Scenario 2 - Student Search',
    symptom: 'Searching any register number returns a different student: the database lookup uses an inverted comparison (!==) instead of (===).',
    patches: [
      {
        file: 'src/data/db.js',
        find: String.raw`  return students.find((s) => s.registerNumber.toLowerCase() === target) || null;`,
        replace: String.raw`  return students.find((s) => s.registerNumber.toLowerCase() !== target) || null;`,
      },
    ],
  },
  {
    id: 11,
    title: 'Duplicate Register Number Allowed',
    difficulty: 'Medium',
    area: 'Backend (registration endpoint)',
    scenario: 'Scenario 1 - Student Registration',
    symptom: 'Two students can be registered with the same register number; the duplicate check was removed from the backend.',
    patches: [
      {
        file: 'src/controllers/studentController.js',
        find: String.raw`  if (db.findStudentByRegno(registerNumber)) {
    return res.status(409).json({ success: false, message: 'Register number already exists' });
  }`,
        replace: String.raw`  // NOTE: register numbers are assumed to be unique, no explicit check needed.`,
      },
    ],
  },
  {
    id: 12,
    title: 'Delete API Deletes Wrong Record',
    difficulty: 'Medium',
    area: 'Backend/Database (delete query)',
    scenario: 'Scenario 3 - Update Student Details',
    symptom: 'Deleting student id 3 removes student id 4 instead: db.deleteStudent() splices the array at position "id" instead of finding the record by id.',
    patches: [
      {
        file: 'src/data/db.js',
        find: String.raw`  const idx = students.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  students.splice(idx, 1);
  saveStudents();
  return true;`,
        replace: String.raw`  // ids line up with row positions, so splice directly
  const idx = Number(id);
  if (idx < 1 || idx > students.length) return false;
  students.splice(idx, 1);
  saveStudents();
  return true;`,
      },
    ],
  },
  {
    id: 13,
    title: 'Frontend and Backend Data Mismatch',
    difficulty: 'Medium',
    area: 'Frontend/API (field names)',
    scenario: 'Scenario 1 - Student Registration',
    symptom: 'Registration succeeds but the new student shows up with blank name/email/phone: the frontend sends studentName/emailId/mobileNo while the backend expects name/email/phone.',
    patches: [
      {
        file: 'public/js/register.js',
        find: String.raw`    body: JSON.stringify({ registerNumber: registerNumber, name: name, email: email, phone: phone, department: department, year: Number(year) }),`,
        replace: String.raw`    body: JSON.stringify({ registerNumber: registerNumber, studentName: name, emailId: email, mobileNo: phone, branch: department, studyYear: Number(year) }),`,
      },
    ],
  },

  // ---------------------------- HARD ----------------------------
  {
    id: 14,
    title: 'Incorrect Data Flow During Update',
    difficulty: 'Hard',
    area: 'Frontend -> API -> Backend -> Database',
    scenario: 'Scenario 3 - Update Student Details',
    symptom: 'Updating ANY student always changes Aarav Sharma (id 1). The route parameter is renamed to :studentId while the controller still reads req.params.id, so the id becomes undefined; a dangerous fallback in the database layer then updates the first record. Participants must trace the full request flow.',
    patches: [
      {
        file: 'src/routes/students.js',
        find: String.raw`router.put('/:id', ctrl.updateStudent);`,
        replace: String.raw`router.put('/:studentId', ctrl.updateStudent);`,
      },
      {
        file: 'src/data/db.js',
        find: String.raw`  if (idx === -1) return null;`,
        replace: String.raw`  if (idx === -1) idx = 0; // fallback: default to the first record so the request never fails`,
      },
    ],
  },
  {
    id: 15,
    title: 'Multiple Records Affected by One Operation',
    difficulty: 'Hard',
    area: 'Backend/Database (update + delete query)',
    scenario: 'Scenario 3 - Update Student Details',
    symptom: 'Updating or deleting student id 1 affects ids 1, 10, 11 and 12: the database layer matches ids with a loose String.includes() instead of strict equality. Participants must trace the query and restore exact matching.',
    patches: [
      {
        file: 'src/data/db.js',
        find: String.raw`  const idx = students.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  applyUpdates(students[idx], updates);
  saveStudents();
  return students[idx];`,
        replace: String.raw`  const targets = students.filter((s) => String(s.id).includes(String(id)));
  if (targets.length === 0) return null;
  targets.forEach((s) => applyUpdates(s, updates));
  saveStudents();
  return targets[0];`,
      },
      {
        file: 'src/data/db.js',
        find: String.raw`  const idx = students.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  students.splice(idx, 1);
  saveStudents();
  return true;`,
        replace: String.raw`  const before = students.length;
  students = students.filter((s) => !String(s.id).includes(String(id)));
  saveStudents();
  return students.length < before;`,
      },
    ],
  },
];

// Bugs that patch overlapping code and therefore cannot be combined
// in one generated build.
const CONFLICTS = [
  [12, 15],
  [14, 15],
];

module.exports = { BUGS: BUGS, CONFLICTS: CONFLICTS };


