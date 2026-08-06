import express from "express";
import anunciosController from "../Controladores/anunciosController.js";

const router = express.Router();

router.get("/anuncios", anunciosController.obtenerAnuncios);

export default router;
