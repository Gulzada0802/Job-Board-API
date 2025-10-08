import express from "express";
import dotenv from "dotenv";

//routes
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js"
import applicationRoutes from "./routes/applications.js"
dotenv.config();

const app = express();
app.use(express.json());

//routes
app.use("/auth", authRoutes);
app.use("/jobs", jobRoutes); 
app.use("/applications", applicationRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
