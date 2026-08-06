import express from "express";
import jamendoController from "../Controladores/jamendoController.js";

const router = express.Router();

router.get("/jamendo/search", jamendoController.search);
router.get("/jamendo/popular", jamendoController.popular);
router.get("/jamendo/artist/tracks", jamendoController.artistTracks);
router.get("/jamendo/artist/info", jamendoController.artistInfo);

export default router;
