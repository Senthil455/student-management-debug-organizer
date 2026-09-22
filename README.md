# Student Management System - Debugging Round

A deliberately simple **Student Management System** built for a debugging
competition (Round 2). The master build in this folder is the **fully fixed,
correct application**. Participant builds with intentional bugs are generated
from it with one command.

## Tech stack (intentionally simple)

| Layer | Technology |
| --- | --- |
| Frontend | Plain HTML, CSS, vanilla JavaScript (no frameworks, no build step) |
| Backend | Node.js + Express |
| Database | JSON file (`data/students.json`) - no installation needed |
| Dependency | `express` only |

**Requirement:** Node.js 18 or newer (https://nodejs.org).

## Folder layout

```
student-management-debug/
├── server.js                     Express entry point (serves UI + API)
├── src/
│   ├── routes/students.js        REST routes
│   ├── controllers/studentController.js   Request handlers
│   └── data/db.js                JSON-file "database" layer
├── data/
│   ├── students.json             Live records (mutated by the app)
│   └── students.seed.json        Pristine sample data used by reset
├── public/                       Frontend (index/search/update/manage pages)
├── tools/
│   ├── bugs.js                   Catalogue of the 15 bug patches
│   ├── generate.js               Team-build generator (bug injector)
│   └── smoke-test.js             API smoke test for any build
├── ANSWER_KEY.md                 ORGANIZER ONLY - all bugs + fixes + demos
├── PARTICIPANT_README.md         Copied into participant builds
└── teams/                        (created by you) generated team builds
```

## Run the clean master build (correct behaviour)

```bash
npm install
npm start
# open http://localhost:3000
```

Use this to show participants what correct behaviour looks like, or to verify
a team's fixes side by side.

## Generate a participant build

Each team gets its own folder containing the app with **exactly their 4 bugs**
baked into the code as natural-looking defects (no flags to flip).

```bash
# See the catalogue
node tools/generate.js --list

# Example: Team A gets bugs 1, 2, 9 and 14
node tools/generate.js --bugs 1,2,9,14 --out teams/teamA

# Then, for the team:
cd teams/teamA
npm install
npm start
```

Notes:

- The generated folder contains **no** answer key, no bug list and no tools -
  participants only receive the app + a short README.
- Re-running with `--force` overwrites an existing build.
- Bugs **12+15** and **14+15** patch the same code and cannot be combined;
  the generator refuses such combinations.
- The master build is never modified by the generator.

## Bug catalogue

| ID | Difficulty | Area | Title |
| --- | --- | --- | --- |
| 1 | Easy | Frontend | Empty Student Name Accepted |
| 2 | Easy | Frontend | Invalid Email Accepted |
| 3 | Easy | Frontend | Negative Phone Number Accepted |
| 4 | Easy | Frontend | Search Button Not Working |
| 5 | Easy | Frontend/API | Wrong Student Details Displayed |
| 6 | Easy | Frontend/API | Update Button Does Not Send Correct ID |
| 7 | Easy | Backend | Delete Button Does Not Delete Record |
| 8 | Easy | Frontend | Incorrect Success Message |
| 9 | Medium | Backend | Wrong Student Updated |
| 10 | Medium | Backend/Database | Search Query Error |
| 11 | Medium | Backend | Duplicate Register Number Allowed |
| 12 | Medium | Backend/Database | Delete API Deletes Wrong Record |
| 13 | Medium | Frontend/API | Frontend and Backend Data Mismatch |
| 14 | Hard | Full flow | Incorrect Data Flow During Update |
| 15 | Hard | Backend/Database | Multiple Records Affected by One Operation |

Details, fixes and demo scripts for every bug: see **ANSWER_KEY.md**.

### Which bugs fit which scenario

| Scenario | Bug IDs |
| --- | --- |
| 1 - Student Registration | 1, 2, 3, 8, 11, 13 |
| 2 - Student Search | 4, 5, 10 |
| 3 - Update Student Details | 6, 7, 9, 12, 14, 15 |

## Suggested team assignments (2 Easy + 1 Medium + 1 Hard)

```bash
node tools/generate.js --bugs 1,2,9,14   --out teams/teamA
node tools/generate.js --bugs 3,8,10,15  --out teams/teamB
node tools/generate.js --bugs 4,7,13,14  --out teams/teamC
node tools/generate.js --bugs 5,6,11,15  --out teams/teamD
node tools/generate.js --bugs 2,3,12,14  --out teams/teamE
node tools/generate.js --bugs 1,4,13,15  --out teams/teamF
```

(Reusing a bug for several teams is fine - each team gets its own folder and
its own data file.)

## Verify any build with the smoke test

With the server running:

```bash
node tools/smoke-test.js http://localhost:3000
```

- On the **clean master** every check passes.
- On a **buggy build** the failing checks point at the broken API features
  (bugs 9, 10, 11, 12, 14, 15). Frontend bugs (1, 2, 3, 4, 5, 6, 8, 13) are
  verified through the browser.

## Event-day workflow

1. `npm install` once in the master folder.
2. Generate one folder per team (commands above).
3. Copy each team folder to the team's machine (or shared lab drive), then
   `npm install` + `npm start` there.
4. Give each team their bug list (e.g. printed slips: "Bug 1, 2, 9, 14") and
   the scenario description.
5. Judge with the checklist in ANSWER_KEY.md; compare behaviour against the
   clean master if in doubt.
6. Participants use **Manage -> Restore Sample Data** to reset records at any
   time.

## Miscellaneous

- Change the port with `PORT=4000 npm start` (defaults to 3000).
- `data/students.json` holds the live records; `Restore Sample Data` (or
  `POST /api/reset`) copies `students.seed.json` back over it.
- If you edit the clean sources, re-run a generation - the generator fails
  loudly if a bug patch no longer matches, so the catalogue never silently
  drifts.
