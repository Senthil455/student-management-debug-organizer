// Simple JSON-file "database" for students.
// Live records live in data/students.json; data/students.seed.json keeps the
// original sample records used by reset().

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'students.json');
const SEED_FILE = path.join(__dirname, '..', '..', 'data', 'students.seed.json');

let students = loadStudents();

function loadStudents() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveStudents() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2) + '\n');
}

function getAll() {
  return students;
}

function findStudentByRegno(regno) {
  const target = String(regno || '').trim().toLowerCase();
  return students.find((s) => s.registerNumber.toLowerCase() === target) || null;
}

function createStudent(data) {
  const nextId = students.reduce((max, s) => Math.max(max, s.id), 0) + 1;
  const student = {
    id: nextId,
    registerNumber: String(data.registerNumber || '').trim(),
    name: String(data.name == null ? '' : data.name).trim(),
    email: String(data.email == null ? '' : data.email).trim(),
    phone: String(data.phone == null ? '' : data.phone).trim(),
    department: String(data.department == null ? '' : data.department).trim(),
    year: Number(data.year) || 1,
  };
  students.push(student);
  saveStudents();
  return student;
}

function applyUpdates(student, updates) {
  const editable = ['name', 'email', 'phone', 'department', 'year'];
  editable.forEach(function (key) {
    if (updates[key] !== undefined) {
      student[key] = updates[key];
    }
  });
}

function updateStudent(id, updates) {
  const idx = students.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  applyUpdates(students[idx], updates);
  saveStudents();
  return students[idx];
}

function deleteStudent(id) {
  const idx = students.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  students.splice(idx, 1);
  saveStudents();
  return true;
}

function reset() {
  students = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
  saveStudents();
}

module.exports = {
  getAll: getAll,
  findStudentByRegno: findStudentByRegno,
  createStudent: createStudent,
  updateStudent: updateStudent,
  deleteStudent: deleteStudent,
  reset: reset,
};
