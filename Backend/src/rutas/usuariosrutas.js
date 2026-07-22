import express from "express";
import usuariosController from "../Controladores/usuariosController.js";
import sendVerificationEmailMiddleware from "../middlewares/enviarEmail.js";
import tokenValido from "../middlewares/autenticacion.js";
import verificarRoles from "../middlewares/verificarRole.js";

const router = express.Router();

router.post("/Registro", sendVerificationEmailMiddleware, usuariosController.Registro);
router.post("/login", usuariosController.login);
router.get("/Usuario/:id", tokenValido, usuariosController.obtenerUsuario);
router.get("/Usuario", tokenValido, verificarRoles(["administrador"]), usuariosController.obtenerUsuarios);
router.put("/Usuario/:id", tokenValido, usuariosController.actualizarUsuario);
router.patch("/usuario/:id/rol", tokenValido, verificarRoles(["administrador"]), usuariosController.updateUserRole);
router.delete("/Usuario/:id", tokenValido, verificarRoles(["administrador"]), usuariosController.eliminarUsuario);

router.get("/Usuario/:id/stats", tokenValido, usuariosController.obtenerStats);
router.post("/Usuario/:id/play", tokenValido, usuariosController.registrarPlay);
router.patch("/Usuario/:id/config", tokenValido, usuariosController.actualizarConfig);
router.patch("/Usuario/:id/password", tokenValido, usuariosController.cambiarPassword);

router.get("/verificar/:token", usuariosController.verificarEmail);

export default router;
