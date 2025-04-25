import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        unique: true,
    },
    description: {
        type: String,
        default:" No description",
        required: [true, 'Description is required'],
    },
    dueDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending',
    },
    completed :{
        type: Boolean,
        default: false,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low',
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, 
{timestamps: true,}
);

const TaskModel = mongoose.model('Task', TaskSchema);
export default TaskModel;