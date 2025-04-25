import moongose from 'mongoose';

const connectDB = async () => {
    try {
        console.log("Connecting to DB...");
        await moongose.connect(process.env.MONGO_URI, {
            
        })
        console.log("Connected to DB...");
    } catch (error) {
        console.log("Error in connecting to DB: ", error.message);
        process.exit(1)
    }
}

export default connectDB;