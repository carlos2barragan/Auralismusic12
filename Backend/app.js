import "dotenv/config";
import express from "express";
import session from "express-session";
import { connectDB } from "./src/config/database.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import usuariosrutas from "./src/rutas/usuariosrutas.js";
import cancionesrutas from "./src/rutas/cancionesrutas.js";
import cantantesrutas from "./src/rutas/cantantesrutas.js";
import playlistrutas from "./src/rutas/playlistrutas.js";
import uploadRoutes from "./src/rutas/uploads.js";
import spotifyrutas from "./src/rutas/spotifyrutas.js";
import solicitudesrutas from "./src/rutas/solicitudesrutas.js";
import anunciosrutas from "./src/rutas/anunciosrutas.js";
import jamendorutas from "./src/rutas/jamendotrutas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

connectDB().catch((err) => {
  console.error("Error en la conexión a la base de datos:", err);
  process.exit(1);
});

const allowedOrigins = [
  process.env.FRONTEND_URL_LOCAL,
  process.env.FRONTEND_URL_PROD,
].filter(Boolean);

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Origen no permitido por CORS"));
  },
  credentials: true,
}));

app.use(session({
  secret: process.env.SESSION_SECRET || "auralis_session_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === "production", httpOnly: true, maxAge: 3600000 },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public/uploads", express.static(path.join(__dirname, "public/uploads")));

app.use("/Api", usuariosrutas);
app.use("/Api", cantantesrutas);
app.use("/Api", cancionesrutas);
app.use("/Api", playlistrutas);
app.use("/Api", uploadRoutes);
app.use("/Api", spotifyrutas);
app.use("/Api", solicitudesrutas);
app.use("/Api", anunciosrutas);
app.use("/Api", jamendorutas);

app.use((req, res, next) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
  console.error("Error interno:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en: ${process.env.BACKEND_URL_LOCAL || `http://localhost:${PORT}`}`);
});
