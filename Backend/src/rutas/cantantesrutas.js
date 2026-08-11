import express from "express";
import cantanteController from "../Controladores/cantanteController.js";
import tokenValido from "../middlewares/autenticacion.js";
import verificarRoles from "../middlewares/verificarRole.js";

const router = express.Router();

router.post("/cantantes", tokenValido, verificarRoles(["administrador"]), cantanteController.crearCantante);
router.get("/cantantes", cantanteController.listarCantantes);
router.get("/cantantes/:id", cantanteController.obtenerCantante);
router.put("/cantantes/:id", tokenValido, verificarRoles(["administrador", "cantante"]), cantanteController.actualizarCantante);
router.delete("/cantantes/:id", tokenValido, verificarRoles(["administrador"]), cantanteController.eliminarCantante);

export default router;
