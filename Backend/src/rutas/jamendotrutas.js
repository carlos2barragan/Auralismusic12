import express from "express";
import jamendoController from "../Controladores/jamendoController.js";

const router = express.Router();

router.get("/jamendo/search", jamendoController.search);
router.get("/jamendo/popular", jamendoController.popular);

export default router;
