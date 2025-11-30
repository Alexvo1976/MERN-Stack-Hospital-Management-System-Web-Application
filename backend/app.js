import express from "express";
import { dbConnection } from "./database/dbConnection.js";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
import { errorMiddleware } from "./middlewares/error.js";
import messageRouter from "./router/messageRouter.js";
import userRouter from "./router/userRouter.js";
import appointmentRouter from "./router/appointmentRouter.js";

const app = express();

// ✅ Load environment variables
config({ path: "./config/config.env" });

// ✅ Safely log active environment
console.log("🟢 Starting server...");
console.log("🌍 FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("🌍 DASHBOARD_URL:", process.env.DASHBOARD_URL);

// ✅ CORS setup
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      process.env.DASHBOARD_URL || "http://localhost:5174",
      "http://localhost:5175",
    ],
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ File upload
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// ✅ API routes
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/appointment", appointmentRouter);

// ✅ Database connection
dbConnection();

// ✅ Error handler (must be last middleware)
app.use(errorMiddleware);

export default app;
