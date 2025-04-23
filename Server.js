import bodyParser from "body-parser";
import cors from "cors";
import knex from "knex";
import bcrypt from "bcryptjs";
import handleRegister from "./controlers/Register.js";
import handleSignin from "./controlers/Signin.js";
import handleimage from "./controlers/image.js";
import handleProfile from "./controlers/Profile.js";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    port: 5432,
    user: "hassan",
    password: "lamp1388",
    database: "faceD",
  },
});
const corsOptions = {
  origin: "http://localhost:3000", // Allow requests from frontend
  methods: "GET, POST, PUT, DELETE, OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true, // ✅ Allow credentials (cookies)
};
const app = express(); // Initialize the app object

app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(cookieParser());

const SECRET_KEY = "your_secret_key"; // Use a secure key
function verifyToken(req) {
  const token = req.cookies?.token; // Use optional chaining to prevent errors
  if (!token) {
    return false; // Token not provided
  }
  try {
    return jwt.verify(token, SECRET_KEY); // Validate token using `jsonwebtoken`
  } catch (error) {
    console.error("Invalid token:", error.message);
    return false; // Token validation failed
  }
}
function getUserFromToken(token) {
  try {
    const decoded = jwt.decode(token, SECRET_KEY);
    return decoded.user; // Assuming the token contains `user` object
  } catch (error) {
    console.error("Error decoding token:", error.message);
    return null;
  }
}

app.get("/home", (req, res) => {
  const isValidToken = verifyToken(req); // Validate token using `req`
  if (isValidToken) {
    const user = getUserFromToken(req.cookies.token); // Fetch user
    res.json({ user, success: true });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.post("/clarifai", async (req, res) => {
  const PAT = "00c236996d8441d08590f7c1e799312a";
  const USER_ID = "clarifai";
  const APP_ID = "main";
  const MODEL_ID = "face-detection";
  const MODEL_VERSION_ID = "6dc7e46bc9124c5c8824be4822abe105";
  const IMAGE_URL = req.body.imageUrl;

  const raw = JSON.stringify({
    user_app_id: { user_id: USER_ID, app_id: APP_ID },
    inputs: [{ data: { image: { url: IMAGE_URL } } }],
  });

  const requestOptions = {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Key " + PAT,
    },
    body: raw,
  };
  ("hello world");
  try {
    const response = await fetch(
      `https://api.clarifai.com/v2/models/${MODEL_ID}/versions/${MODEL_VERSION_ID}/outputs`,
      requestOptions
    );
    const data = await response.json();
    res.json(data); // Send the response to your frontend
  } catch (error) {
    console.error("Error making request to Clarifai API:", error);
    res.status(500).json({ error: "Failed to fetch from Clarifai API" });
  }
});

app.post("/Signin", (req, res) => {
  handleSignin(req, res, db, bcrypt);
});

app.post("/Register", (req, res) => {
  handleRegister(req, res, db, bcrypt);
});

app.get("/profile/:id", (req, res) => {
  handleProfile(req, res);
});

app.put("/image", (req, res) => {
  handleimage(req, res, db);
});

app.listen(5000, () => {
  console.log("Server is running");
});
