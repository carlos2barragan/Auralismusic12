import express from "express";
import usuariosController from "../Controladores/usuariosController.js";
import sendVerificationEmailMiddleware from "../middlewares/enviarEmail.js";
import tokenValido from "../middlewares/autenticacion.js";
import verificarRoles from "../middlewares/verificarRole.js";

const router = express.Router();

router.post("/registro", sendVerificationEmailMiddleware, usuariosController.Registro);
router.post("/login", usuariosController.login);
router.get("/usuarios/:id", tokenValido, usuariosController.obtenerUsuario);
router.get("/usuarios", tokenValido, verificarRoles(["administrador"]), usuariosController.obtenerUsuarios);
router.put("/usuarios/:id", tokenValido, usuariosController.actualizarUsuario);
router.patch("/usuarios/:id/rol", tokenValido, verificarRoles(["administrador"]), usuariosController.updateUserRole);
router.delete("/usuarios/:id", tokenValido, verificarRoles(["administrador"]), usuariosController.eliminarUsuario);

router.get("/usuarios/:id/stats", tokenValido, usuariosController.obtenerStats);
router.post("/usuarios/:id/play", tokenValido, usuariosController.registrarPlay);
router.patch("/usuarios/:id/config", tokenValido, usuariosController.actualizarConfig);
router.patch("/usuarios/:id/password", tokenValido, usuariosController.cambiarPassword);

router.get("/verificar/:token", usuariosController.verificarEmail);

router.post("/usuarios/:id/follow", tokenValido, usuariosController.seguirUsuario);
router.delete("/usuarios/:id/follow", tokenValido, usuariosController.dejarDeSeguir);
router.get("/usuarios/:id/followers", usuariosController.obtenerFollowers);
router.get("/usuarios/:id/following", usuariosController.obtenerFollowing);
router.get("/usuarios/:id/is-following", tokenValido, usuariosController.isFollowing);
router.patch("/usuarios/:id/premium", tokenValido, usuariosController.upgradeToPremium);
router.get("/usuarios/:id/seguidos", usuariosController.obtenerSeguidos);
router.post("/refrescar-token", usuariosController.refrescarToken);
router.post("/usuarios/:id/cerrar-sesion", tokenValido, usuariosController.cerrarSesion);

export default router;
