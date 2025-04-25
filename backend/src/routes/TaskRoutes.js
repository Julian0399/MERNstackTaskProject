import express from 'express';
import { createTask,getTasks,getTask } from '../controllers/task/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/create-task",protect, createTask);
router.get("/get-tasks",protect, getTasks);
router.get("/get-task/:id",protect, getTask);



export default router;