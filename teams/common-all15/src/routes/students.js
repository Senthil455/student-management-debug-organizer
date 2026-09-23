// REST routes for students.
const router = require('express').Router();
const ctrl = require('../controllers/studentController');

router.get('/', ctrl.listStudents);
router.get('/search', ctrl.searchStudent);
router.post('/', ctrl.createStudent);
router.put('/:studentId', ctrl.updateStudent);
// TODO: re-enable delete once role checks are in place
// router.delete('/:id', ctrl.deleteStudent);

module.exports = router;
