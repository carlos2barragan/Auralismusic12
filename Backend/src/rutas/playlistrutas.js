import express from "express";
import playlistController from "../Controladores/playlistController.js";
import tokenValido from "../middlewares/autenticacion.js";

const router = express.Router();

router.post("/playlists", tokenValido, playlistController.crear);
router.get("/playlists", tokenValido, playlistController.listar);
router.get("/playlists/:id", tokenValido, playlistController.ObtenerPorId);
router.post("/playlists/:id", tokenValido, playlistController.agregarCancion);
router.put("/playlists/:id", tokenValido, playlistController.Actualizar);
router.delete("/playlists/:id", tokenValido, playlistController.Eliminar);

export default router;
