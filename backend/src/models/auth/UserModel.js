import mongoose from 'mongoose';
import bcrypt from 'bcrypt'


const UserSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, "Please provide your name"],
    },
    email:{
        type: String,
        required: [true, "Please provide your email"],
        unique: true,
        trim: true,
        match: [
            /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
            "Please provide a valid email",
        ],
    },
    password:{
        type: String,
        required: [true, "Please provide a password"],
        minlength: 6,
    },
    photo:{
        type: String,
        default: "https://www.gravatar.com/avatar/94d093eda664addd6e450d7e98b8d08b?s=200&r=pg&d=mm",
    },
    bio:{
        type: String,
        default: "Hello there! I am using this app for learn.",
    },
    role:{
        type: String,
        default: "user",
        enum: ["user", "admin", "super-admin"],
    },
    isVerified:{
        type: Boolean,
        default: false,
    },
},{timestamps: true, minimize:true});

//hash password
UserSchema.pre("save", async function (next) {
    if(!this.isModified("password")){
        return next()
    }

    const salt = await bcrypt.genSalt(10)

    const hashedPassword     = await bcrypt.hash(this.password, salt)

    this.password = hashedPassword

    next()

})

const User = mongoose.model("User", UserSchema);

export default User;