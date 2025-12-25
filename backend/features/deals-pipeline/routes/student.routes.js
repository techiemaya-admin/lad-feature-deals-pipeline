/**
 * Student Routes
 * /api/students
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');

// LIST
router.get('/', studentController.listStudents);

// GET BY ID
router.get('/:id', studentController.getStudentById);

// CREATE
router.post('/', studentController.createStudent);

// UPDATE
router.put('/:id', studentController.updateStudent);

// DELETE (soft delete)
router.delete('/:id', studentController.deleteStudent);


// Assign counsellor (ADMIN only)
router.put('/:id/assign-counsellor', studentController.assignCounsellor);

module.exports = router;
