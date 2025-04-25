import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/db/connect.js";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import errorHandler from "./src/helpers/errorHandler.js";

dotenv.config();
const port = process.env.PORT || 8000;

const app = express();

//middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// error handler
app.use(errorHandler);

//routes
const routeFiles = fs.readdirSync("./src/routes");
routeFiles.forEach((file)=> {
  //dynamic import of routes
  import(`./src/routes/${file}`).then((route) => {
    app.use("/api/v1", route.default);
  })
  .catch((error) => {
    console.log("Failed to import route: ", error.message);
  })
})


const server = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log("Server is running on port: ", port);
    });
  } catch (error) {
    console.log("Error in server: ", error.message);
    process.exit(1);
  }
};

server();
