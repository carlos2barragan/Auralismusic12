import Usuario from "../Modelos/usuariosModelos.js";
import Cantante from "../Modelos/cantanteModelos.js";
import Canciones from "../Modelos/cancionesModelos.js";
import Seguidor from "../Modelos/seguidorModelos.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

 const Registro = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ message: "El correo ya está registrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const NuevoUsuario = new Usuario({ nombre, email, password: hashedPassword, rol: "usuario" });
    await NuevoUsuario.save();

    res.status(201).json({ message: "Usuario Registrado", usuario: { id: NuevoUsuario._id, nombre, email, rol: NuevoUsuario.rol } });
  } catch (error) {
    console.error("❌ Error al registrar usuario:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

 const login = async (req, res) => {
  try {

    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email y contraseña son requeridos." });

    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(401).json({ message: "Credenciales incorrectas." });

    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) return res.status(401).json({ message: "Credenciales incorrectas." });

    const token = jwt.sign({ id: usuario._id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    usuario.refreshToken = refreshToken;
    await usuario.save();

    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      token,
      refreshToken,
      user: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
      } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

  const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password');
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los usuarios" });
  }
};

  const obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "ID no válido" });
    const usuario = await Usuario.findById(id).populate("playlists").select('-password');
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.status(200).json(usuario);
  } catch (error) {
    console.error("Error en obtener usuario", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "ID no válido" });
    let updateData = { nombre, email };
    if (password) updateData.password = await bcrypt.hash(password, 10);
    const usuario = await Usuario.findByIdAndUpdate(id, updateData, { new: true });
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

 const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "ID no válido" });
    const usuario = await Usuario.findByIdAndDelete(id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.status(200).json({ message: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

 const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "ID no válido" });
    const user = await Usuario.findById(id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    user.rol = role;
    await user.save();
    if (role === "cantante") {
      let cantanteExistente = await Cantante.findOne({ cantante: user.nombre });
      if (!cantanteExistente) {
        const nuevoCantante = new Cantante({ cantante: user.nombre, canciones: [], avatar: user.avatar || null });
        await nuevoCantante.save();
      }
    }
    res.json({ message: "Rol actualizado con éxito", user });
  } catch (error) {
    console.error("Error al actualizar el rol:", error);
    res.status(500).json({ error: "Error al actualizar el rol" });
  }
};

const obtenerStats = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "ID no válido" });

    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    const historial = usuario.historial || [];
    const total = historial.length;

    const genreCount = {};
    historial.forEach(h => { if (h.genero) genreCount[h.genero] = (genreCount[h.genero] || 0) + 1; });
    const favGenero = Object.entries(genreCount).sort(([,a],[,b]) => b-a)[0]?.[0] || null;

    const artistCount = {};
    historial.forEach(h => { if (h.cantante) artistCount[h.cantante] = (artistCount[h.cantante] || 0) + 1; });
    const favArtista = Object.entries(artistCount).sort(([,a],[,b]) => b-a)[0]?.[0] || null;
    const artTopCount = Object.values(artistCount).sort((a,b) => b-a)[0] || 0;

    const tiempoMinutos = Math.round(total * 3.5);
    const artistasUnicos = new Set(historial.map(h => h.cantante).filter(Boolean)).size;
    const numPlaylists = (usuario.playlists || []).length;

    const recientes = [...historial].reverse().slice(0, 10).map(h => ({
      titulo: h.titulo, cantante: h.cantante, fecha: h.fecha
    }));

    const genreChart = Object.entries(genreCount)
      .sort(([,a],[,b]) => b-a)
      .slice(0, 5)
      .map(([nombre, count]) => ({ nombre, count }));

    res.status(200).json({
      total, favGenero, favArtista, artTopCount,
      tiempoMinutos, artistasUnicos, numPlaylists,
      recientes, genreChart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
};

const registrarPlay = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancionId, titulo, cantante, genero } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "ID no válido" });

    await Usuario.findByIdAndUpdate(id, {
      $push: { historial: { $each: [{ cancion: cancionId, titulo, cantante, genero, fecha: new Date() }], $slice: -500 } }
    });

    if (cancionId && mongoose.Types.ObjectId.isValid(cancionId)) {
      await Canciones.findByIdAndUpdate(cancionId, { $inc: { plays: 1 } });
    }

    res.status(200).json({ message: "Reproducción registrada" });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar reproducción" });
  }
};

const actualizarConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { config } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "ID no válido" });

    const usuario = await Usuario.findByIdAndUpdate(id, { $set: { config } }, { new: true });
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar configuración" });
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { passwordActual, passwordNueva } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "ID no válido" });

    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    const match = await bcrypt.compare(passwordActual, usuario.password);
    if (!match) return res.status(401).json({ message: "La contraseña actual es incorrecta" });

    usuario.password = await bcrypt.hash(passwordNueva, 10);
    await usuario.save();
    res.status(200).json({ message: "Contraseña actualizada con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al cambiar la contraseña" });
  }
};

const verificarEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    usuario.isVerified = true;
    await usuario.save();
    res.status(200).json({ success: true, message: "Correo verificado con éxito" });
  } catch (error) {
    res.status(400).json({ message: "Token inválido o expirado" });
  }
};

const seguirUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.usuario.id;
    if (followerId.toString() === id) return res.status(400).json({ message: "No puedes seguirte a ti mismo" });

    const yaSigue = await Seguidor.findOne({ follower: followerId, following: id });
    if (yaSigue) return res.status(400).json({ message: "Ya sigues a este usuario" });

    await Seguidor.create({ follower: followerId, following: id });
    res.status(200).json({ message: "Ahora sigues a este usuario" });
  } catch (error) {
    res.status(500).json({ message: "Error al seguir usuario" });
  }
};

const dejarDeSeguir = async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.usuario.id;
    await Seguidor.findOneAndDelete({ follower: followerId, following: id });
    res.status(200).json({ message: "Dejaste de seguir a este usuario" });
  } catch (error) {
    res.status(500).json({ message: "Error al dejar de seguir" });
  }
};

const obtenerFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await Seguidor.countDocuments({ following: id });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener seguidores" });
  }
};

const obtenerFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await Seguidor.countDocuments({ follower: id });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener seguidos" });
  }
};

const isFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.usuario?.id;
    if (!followerId) return res.status(200).json({ following: false });
    const sigue = await Seguidor.findOne({ follower: followerId, following: id });
    res.status(200).json({ following: !!sigue });
  } catch (error) {
    res.status(500).json({ message: "Error al verificar seguimiento" });
  }
};

const upgradeToPremium = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "ID no válido" });
    const usuario = await Usuario.findByIdAndUpdate(id, { plan: "premium" }, { new: true });
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.status(200).json({ message: "¡Actualizado a Premium!", user: { _id: usuario._id, nombre: usuario.nombre, plan: usuario.plan } });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar plan" });
  }
};

const obtenerSeguidos = async (req, res) => {
  try {
    const { id } = req.params;
    const follows = await Seguidor.find({ follower: id });
    const ids = follows.map(f => f.following);

    const [usuarios, cantantes] = await Promise.all([
      Usuario.find({ _id: { $in: ids } }).select("nombre avatar"),
      Cantante.find({ _id: { $in: ids } }).select("cantante avatar"),
    ]);

    const userMap = new Map(usuarios.map(u => [u._id.toString(), { nombre: u.nombre, avatar: u.avatar }]));
    const cantanteMap = new Map(cantantes.map(c => [c._id.toString(), { nombre: c.cantante, avatar: c.avatar }]));

    const seguidos = ids.map(id => {
      const key = id.toString();
      const data = userMap.get(key) || cantanteMap.get(key) || { nombre: 'Desconocido', avatar: null };
      return { _id: id, ...data };
    });

    res.status(200).json(seguidos);
  } catch (error) {
    console.error("Error obtenerSeguidos:", error);
    res.status(500).json({ message: "Error al obtener seguidos" });
  }
};

const refrescarToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token requerido" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario || usuario.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Refresh token inválido" });
    }

    const newToken = jwt.sign({ id: usuario._id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const newRefreshToken = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    usuario.refreshToken = newRefreshToken;
    await usuario.save();

    res.status(200).json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ message: "Refresh token inválido o expirado" });
  }
};

const cerrarSesion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "ID no válido" });
    await Usuario.findByIdAndUpdate(id, { refreshToken: null });
    res.status(200).json({ message: "Sesión cerrada" });
  } catch (error) {
    res.status(500).json({ message: "Error al cerrar sesión" });
  }
};

export default { Registro, login, obtenerUsuarios, obtenerUsuario, actualizarUsuario, eliminarUsuario, updateUserRole, obtenerStats, registrarPlay, actualizarConfig, cambiarPassword, verificarEmail, seguirUsuario, dejarDeSeguir, obtenerFollowers, obtenerFollowing, isFollowing, upgradeToPremium, obtenerSeguidos, refrescarToken, cerrarSesion };
