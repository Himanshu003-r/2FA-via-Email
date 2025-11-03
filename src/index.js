import dotenv from "dotenv"
import express from "express";
import cookie from "cookie-parser"
import connectDB from "./db/dbConnect.js";
import errorHandler from "./middleware/errorMiddleware.js";
import authRoute from "./routes/authRoute.js";
import cors from "cors"

dotenv.config({
    path:'./.env'
})
const app = express();
const corsOptions = {
origin: ["http://localhost:6000"],
credentials: true,
}
app.use(cors(corsOptions))

app.use(express.json({limit:"100mb"}));
app.use(express.urlencoded({limit: "100mb", extended: true}));
app.use(cookie())

app.get("/", (req, res) => {
  res.send("Hello World");
});


// Routes
app.use('/api/v1/auth', authRoute)

app.use(errorHandler)
const port = process.env.PORT || 6000;

const start = async () => {
  await connectDB();
  app.listen(port, () => console.log(`Running on server ${port}`));
};

start();
