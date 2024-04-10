import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";

import xss from "xss-clean";
import MongoSanitize from "express-mongo-sanitize";
import dbConnection from "./dbConfig/dbConnection.js";
import router from "./routes/index.js";
import authRoute from "./routes/authRoute.js";
import errorMiddleware from "./middleware/error.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

dbConnection();
app.use(cors());
app.use(xss());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(MongoSanitize());
app.use(express.json({ limit: "15mb" }));
app.use(morgan("dev"));
// app.use("api/v1/auth", authRoute);

app.use(router);
app.use(errorMiddleware);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
