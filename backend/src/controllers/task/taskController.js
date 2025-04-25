import asyncHandler from "express-async-handler";
import TaskModel from "../../models/task/TaskModel.js";

export const createTask = asyncHandler(async (req, res) => {
    try {
        const { title, description, dueDate, priority,status } = req.body;
        if(!title || title.trim() === "") {
            return res.status(400).json({ message: "Title is required" });
        }
        if(!description || description.trim() === "") {
            return res.status(400).json({ message: "Description is required" });
        }
        
        const task = new TaskModel({
            title,
            description,
            dueDate,
            priority,
            status,
            user: req.user._id, 
        })

        await task.save();

        res.status(201).json({
            message: "Task created successfully",
            task,
        });

    } catch (error) {
        res.status(500).json({
            message: "Error creating task",
            error: error.message,
        });
    }
})

export const getTasks = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        const tasks = await TaskModel.find({ user: userId});
        res.status(200).json({
            length: tasks.length,
            tasks,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching tasks",
            error: error.message,
        });
    }
})

export const getTask = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const taskId = req.params.id;
        if (!taskId) {
            return res.status(400).json({ message: "Task ID is required" });
        }
        const task = await TaskModel.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        if(task.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to access this task" });
        }
        res.status(200).json(task);
        
    } catch (error) {
        res.status(500).json({
            message: "Error fetching task",
            error: error.message,
        });
        
    }
})