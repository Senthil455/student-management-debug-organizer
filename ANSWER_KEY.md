# ANSWER KEY - Organizer Only

Do **not** copy this file (or `tools/`) into participant folders - the
generated builds contain neither.

Seed data: 12 students, IDs 1-12. Useful records for demos:

| ID | Reg. No | Name | Dept |
| --- | --- | --- | --- |
| 1 | CS231001 | Aarav Sharma | CSE |
| 2 | EC231014 | Diya Patel | ECE |
| 3 | CS231027 | Priya Nair | CSE |
| 4 | ME231033 | Rohan Gupta | MECH |
| 10 | ME231092 | Aditya Verma | MECH |
| 11 | CS231105 | Ishita Bose | CSE |
| 12 | CE231118 | Arjun Menon | CIVIL |

Verification tool: `node tools/smoke-test.js http://localhost:3000` (API bugs
9, 10, 11, 12, 14, 15). Frontend bugs are verified in the browser.

---

## EASY BUGS

### Bug 1 - Empty Student Name Accepted (Frontend)

- **Symptom:** Submitting the registration form with an empty name succeeds; the student is saved with a blank name (visible on the Manage page).
- **Location:** `public/js/register.js` - the empty-name check is replaced by a `// TODO: add name validation` comment.
- **Fix:** restore the check before the email check:

  ```js
  if (name.trim() === '') {
    showMessage(msg, 'Student name is required.', 'error');
    return;
  }
  ```

- **Demo:** open Register, enter only a register number (e.g. `CS231200`) and valid email/phone, submit. Manage page shows a student with no name.
- **Note:** the backend intentionally validates only the register number, so this is a frontend-validation exercise.

### Bug 2 - Invalid Email Accepted (Frontend)

- **Symptom:** `student@` or `abc.com` are accepted as email addresses.
- **Location:** `public/js/register.js` - the email regex was replaced with a plain "not empty" check.
- **Fix:** restore the format check:

  ```js
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMessage(msg, 'Please enter a valid email address.', 'error');
    return;
  }
  ```

- **Demo:** register with email `student@` - accepted. Manage page shows the bad email.

### Bug 3 - Negative Phone Number Accepted (Frontend)

- **Symptom:** `-9876543210` is accepted as a phone number (only `isNaN` is checked).
- **Location:** `public/js/register.js` - phone validation loosened.
- **Fix:** restore the 10-digit check:

  ```js
  if (!/^\d{10}$/.test(phone)) {
    showMessage(msg, 'Phone number must be exactly 10 digits.', 'error');
    return;
  }
  ```

- **Demo:** register with phone `-9876543210` - accepted; Manage page shows the negative phone.

### Bug 4 - Search Button Not Working (Frontend)

- **Symptom:** clicking Search does nothing; console (F12) shows `TypeError: Cannot read properties of null (reading 'addEventListener')`.
- **Location:** `public/js/search.js` - the listener is attached to `document.getElementById('search-button')`, but the button's actual id is `searchBtn`.
- **Fix:** either restore `searchBtn.addEventListener('click', handleSearch);` or change the HTML id to `search-button` (both acceptable).
- **Demo:** open Search, type `CS231003`, click Search - nothing happens; show the console error.

### Bug 5 - Wrong Student Details Displayed (Frontend/API)

- **Symptom:** searching ANY register number shows **Aarav Sharma (id 1)** - the page fetches the whole list `/api/students` and renders `students[0]`.
- **Location:** `public/js/search.js` - wrong endpoint + wrong render source.
- **Fix:**

  ```js
  const result = await api('/api/students/search?regno=' + encodeURIComponent(regno));
  ...
  renderStudent(result.data.student);
  ```

- **Demo:** search `CS231027` (Priya Nair) - Aarav's details are displayed. Compare with the Manage page.

### Bug 6 - Update Button Does Not Send Correct ID (Frontend/API)

- **Symptom:** updating any student always fails with **"Student not found"** - the PUT goes to `/api/students/CS231027` (register number) instead of the numeric id.
- **Location:** `public/js/update.js` - the update fetch uses the find-input value instead of `currentStudent.id`.
- **Fix:** `await api('/api/students/' + currentStudent.id, { ... })`
- **Demo:** find `CS231027`, change department, Save - error message. Network tab shows the wrong URL. After the fix, the Manage page shows the change.

### Bug 7 - Delete Button Does Not Delete Record (Backend)

- **Symptom:** delete shows "API route not found"; the record stays. Network tab: `DELETE /api/students/3` -> 404.
- **Location:** `src/routes/students.js` - the DELETE route is commented out.
- **Fix:** restore `router.delete('/:id', ctrl.deleteStudent);`
- **Demo:** delete any student on the Manage page - nothing is removed. After the fix it disappears.

### Bug 8 - Incorrect Success Message (Frontend)

- **Symptom:** "Student added successfully!" appears even when the server rejects the request (e.g. duplicate register number -> 409).
- **Location:** `public/js/register.js` - the response status check was removed; success is shown unconditionally.
- **Fix:** restore:

  ```js
  if (result.ok && result.data.success) {
    showMessage(msg, 'Student added successfully!', 'success');
    form.reset();
  } else {
    showMessage(msg, result.data.message || 'Registration failed. Please try again.', 'error');
  }
  ```

- **Demo:** register register number `CS231001` (already exists) - green success message, yet the Manage page shows no new student. Combine with bug 11 for an even better demo.

---

## MEDIUM BUGS

### Bug 9 - Wrong Student Updated (Backend)

- **Symptom:** updating student **id 3** (Priya Nair) actually changes **id 2** (Diya Patel).
- **Root cause:** the controller computes an array INDEX (`findIndex`) and passes it into `db.updateStudent()`, which matches on student ID - index 2 holds student id 2.
- **Location:** `src/controllers/studentController.js`:

  ```js
  // buggy
  const updated = db.updateStudent(db.getAll().findIndex((s) => s.id === id), updates);
  // fixed
  const updated = db.updateStudent(id, updates);
  ```

- **Demo:** update student 3's department to IT, then open Manage: student 2 changed, student 3 did not. (Updating id 1 returns 404 - index 0 matches no id; that is also a valid observation for teams.)
- **Smoke test:** failing checks `PUT /api/students/3 updates student id 3`, `student 3 department is now IT`, `student 2 record untouched`.

### Bug 10 - Search Query Error (Backend/Database)

- **Symptom:** searching any register number returns a DIFFERENT student (usually Aarav Sharma).
- **Root cause:** `src/data/db.js` - `findStudentByRegno` uses an inverted comparison:

  ```js
  // buggy
  return students.find((s) => s.registerNumber.toLowerCase() !== target) || null;
  // fixed
  return students.find((s) => s.registerNumber.toLowerCase() === target) || null;
  ```

- **Demo:** search `CS231027` - shows Diya Patel instead of Priya Nair. Also affects the "Find Student" step of the Update page (loaded record is wrong).
- **Smoke test:** all three search checks fail.

### Bug 11 - Duplicate Register Number Allowed (Backend)

- **Symptom:** two students can be registered with the same register number.
- **Root cause:** `src/controllers/studentController.js` - the duplicate check was removed (replaced by a misleading comment).
- **Fix:** restore before creating the student:

  ```js
  if (db.findStudentByRegno(registerNumber)) {
    return res.status(409).json({ success: false, message: 'Register number already exists' });
  }
  ```

- **Demo:** register `CS231001` twice - both succeed; Manage page shows two records with the same register number.
- **Smoke test:** failing check `duplicate register number rejected (409)`.

### Bug 12 - Delete API Deletes Wrong Record (Backend/Database)

- **Symptom:** deleting student **id 3** removes **id 4** (Rohan Gupta) instead.
- **Root cause:** `src/data/db.js` - `deleteStudent` splices at array position `id` ("ids line up with row positions" comment) instead of finding the record by id.
- **Fix:**

  ```js
  const idx = students.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  students.splice(idx, 1);
  saveStudents();
  return true;
  ```

- **Demo:** delete student 3, check Manage: student 4 is gone, student 3 still there.
- **Smoke test:** failing checks `student 1 removed` and `students 2-13 all still present` after `DELETE /api/students/1` (id 2 disappears instead).

### Bug 13 - Frontend and Backend Data Mismatch (Frontend/API)

- **Symptom:** registration succeeds but the new student has **blank name/email/phone** (only register number + defaults are saved).
- **Root cause:** `public/js/register.js` sends `studentName`, `emailId`, `mobileNo`, `branch`, `studyYear`, while the backend expects `name`, `email`, `phone`, `department`, `year`.
- **Fix:** send the field names the backend expects:

  ```js
  body: JSON.stringify({ registerNumber: registerNumber, name: name, email: email, phone: phone, department: department, year: Number(year) }),
  ```

  (Aligning the backend instead is also acceptable if done consistently.)
- **Demo:** register a complete, valid student -> Manage page shows empty fields. Network tab: compare the request payload with the API contract.

---

## HARD BUGS

### Bug 14 - Incorrect Data Flow During Update (Frontend -> API -> Backend -> Database)

- **Symptom:** updating **ANY** student always changes **Aarav Sharma (id 1)** and the UI even reports success (showing Aarav's data).
- **Root cause - a chain across the whole flow:**
  1. `src/routes/students.js` - the route was renamed to `router.put('/:studentId', ...)`
  2. `src/controllers/studentController.js` - still reads `req.params.id` -> `undefined` -> `Number(undefined)` = `NaN`
  3. `src/data/db.js` - `updateStudent` gets `NaN`, `findIndex` fails, and a "safety fallback" (`if (idx === -1) idx = 0;`) silently updates the FIRST record.
- **Fixes (both needed):**
  - restore `router.put('/:id', ctrl.updateStudent);` (or read `req.params.studentId` in the controller)
  - remove the fallback in `src/data/db.js`:

    ```js
    if (idx === -1) return null;
    ```

- **Demo:** update Priya Nair (id 3)'s department -> success message appears, but the Manage page shows Aarav Sharma (id 1) changed and Priya untouched.
- **Tracing path for participants:** Network tab shows `PUT /api/students/3` (frontend is fine) -> route parameter name -> controller param -> database fallback.
- **Smoke test:** failing checks `PUT /api/students/3 updates student id 3` (server returns id 1) and `student 3 department is now IT`.

### Bug 15 - Multiple Records Affected by One Operation (Backend/Database)

- **Symptom:** updating or deleting student **id 1** affects **ids 1, 10, 11 and 12** simultaneously.
- **Root cause:** `src/data/db.js` - both `updateStudent` and `deleteStudent` match ids with a loose string comparison `String(s.id).includes(String(id))` instead of strict equality. With seed ids 1-12, the string `"1"` is contained in `"1"`, `"10"`, `"11"` and `"12"`.
- **Fix (both functions):** restore exact matching:

  ```js
  // updateStudent
  const idx = students.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  applyUpdates(students[idx], updates);
  saveStudents();
  return students[idx];

  // deleteStudent
  const idx = students.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  students.splice(idx, 1);
  saveStudents();
  return true;
  ```

- **Demo:** delete student id 1 on the Manage page - four records (1, 10, 11, 12) disappear. Or update student 1's department - four records change. (Also try id 2: affects 2 and 12.)
- **Smoke test:** failing checks `exactly one record removed (12 remain)` (9 remain) and `students 2-13 all still present`.
- **Note:** bugs 12/14 patch the same functions and cannot be combined with 15 in one build (the generator enforces this).

---

## BUG INTERACTIONS (all combinations are allowed unless noted)

| Combination | Effect |
| --- | --- |
| 12 + 15, 14 + 15 | Incompatible - same code (generator refuses) |
| 8 + any registration bug | The false success message hides the server rejection - good teaching combo |
| 5 + 10 | Search broken at BOTH layers (display and query) - fix both to verify |
| 6 / 9 / 14 / 15 together | Update flow broken at several layers - teams must fix them one at a time and re-test |

## JUDGING CHECKLIST (per scenario)

**Scenario 1 - Registration:**
1. Submitting an empty name / invalid email (`student@`, `abc.com`) / negative or short phone is rejected with a clear inline message.
2. A valid registration adds exactly one record (Manage page).
3. Registering an existing register number shows an error - no duplicate rows.
4. A failed submission never shows a success message.
5. Registered student's saved details match what was typed.

**Scenario 2 - Search:**
1. `CS231027` returns Priya Nair; case-insensitive `cs231027` also works.
2. An unknown register number shows "Student not found".
3. Displayed details match the Manage page record.
4. The button (and any Enter behaviour) triggers the search.

**Scenario 3 - Update / Delete:**
1. Updating a student changes ONLY that student's record (check the whole table).
2. Deleting a student removes ONLY that student.
3. Duplicate/wrong-ID requests fail cleanly instead of silently touching another row.
4. Restore Sample Data returns the table to the original 12 records.

Tip: keep the clean master build running on another port (`PORT=3100 npm start`)
to compare correct behaviour side by side while judging.


