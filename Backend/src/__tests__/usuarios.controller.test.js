import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import mongoose from "mongoose";

jest.unstable_mockModule("../Modelos/usuariosModelos.js", () => {
  const MockUsuario = class {
    constructor(d) {
      Object.assign(this, d);
      this.rol = this.rol || "usuario";
      this.save = jest.fn().mockResolvedValue(this);
    }
    static findOne = jest.fn();
    static find = jest.fn();
    static findById = jest.fn();
    static findByIdAndUpdate = jest.fn();
    static findByIdAndDelete = jest.fn();
  };
  return { default: MockUsuario };
});

jest.unstable_mockModule("../Modelos/cantanteModelos.js", () => ({
  default: {
    findOne: jest.fn(),
  },
}));

jest.unstable_mockModule("../Modelos/cancionesModelos.js", () => ({
  default: {
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: jest.fn().mockResolvedValue("hashedPassword"),
    compare: jest.fn(),
  },
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: jest.fn().mockReturnValue("mock_token"),
  },
}));

const {
  default: { Registro, login, obtenerUsuarios, obtenerUsuario, actualizarUsuario, eliminarUsuario, updateUserRole, obtenerStats, registrarPlay, actualizarConfig, cambiarPassword },
} = await import("../Controladores/usuariosController.js");

const Usuario = (await import("../Modelos/usuariosModelos.js")).default;
const Cantante = (await import("../Modelos/cantanteModelos.js")).default;
const bcrypt = (await import("bcrypt")).default;
const jwt = (await import("jsonwebtoken")).default;

const validId = new mongoose.Types.ObjectId().toString();

describe("REGISTRO DE USUARIO", () => {
  it("Deberia registrar un usuario exitosamente", async () => {
    Usuario.findOne.mockResolvedValue(null);
    const saveMock = jest.fn().mockResolvedValue(undefined);

    const req = { body: { nombre: "Carlos", email: "carlos@test.com", password: "123456" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await Registro(req, res);
    expect(res.status).toHaveBeenCalledWith(expect.any(Number));
  });

  it("Deberia retornar 400 si faltan campos obligatorios", async () => {
    const req = { body: { nombre: "", email: "", password: "" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await Registro(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Todos los campos son obligatorios." });
  });

  it("Deberia retornar 400 si el email ya está registrado", async () => {
    Usuario.findOne.mockResolvedValue({ email: "carlos@test.com" });

    const req = { body: { nombre: "Carlos", email: "carlos@test.com", password: "123456" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await Registro(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "El correo ya está registrado." });
  });
});

describe("LOGIN", () => {
  it("Deberia retornar 400 si faltan email o password", async () => {
    const req = { body: { email: "", password: "" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Email y contraseña son requeridos." });
  });

  it("Deberia retornar 401 si el usuario no existe", async () => {
    Usuario.findOne.mockResolvedValue(null);

    const req = { body: { email: "noexiste@test.com", password: "123456" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Credenciales incorrectas." });
  });

  it("Deberia retornar 401 si la contraseña no coincide", async () => {
    Usuario.findOne.mockResolvedValue({ _id: validId, email: "carlos@test.com", password: "hashedPassword", rol: "usuario" });
    bcrypt.compare.mockResolvedValue(false);

    const req = { body: { email: "carlos@test.com", password: "wrongpass" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Credenciales incorrectas." });
  });

  it("Deberia hacer login exitosamente", async () => {
    const mockUser = { _id: validId, nombre: "Carlos", email: "carlos@test.com", password: "hashedPassword", rol: "usuario", refreshToken: null, save: jest.fn().mockResolvedValue(undefined) };
    Usuario.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    process.env.JWT_SECRET = "test_secret";

    const req = { body: { email: "carlos@test.com", password: "123456" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Inicio de sesión exitoso." }));
  });
});

describe("OBTENER USUARIOS", () => {
  it("Deberia listar todos los usuarios", async () => {
    const mockUsuarios = [{ _id: validId, nombre: "Carlos", email: "carlos@test.com" }];
    Usuario.find.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUsuarios) });

    const req = {};
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await obtenerUsuarios(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUsuarios);
  });

  it("Deberia retornar 500 si ocurre un error", async () => {
    Usuario.find.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error("DB error")) });

    const req = {};
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await obtenerUsuarios(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("OBTENER USUARIO POR ID", () => {
  it("Deberia retornar el usuario cuando el ID es válido", async () => {
    const mockUsuario = { _id: validId, nombre: "Carlos" };
    Usuario.findById.mockReturnValue({ populate: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(mockUsuario) }) });

    const req = { params: { id: validId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await obtenerUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUsuario);
  });

  it("Deberia retornar 400 si el ID no es válido", async () => {
    const req = { params: { id: "id-invalido" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await obtenerUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "ID no válido" });
  });

  it("Deberia retornar 404 si el usuario no existe", async () => {
    Usuario.findById.mockReturnValue({ populate: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(null) }) });

    const req = { params: { id: validId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await obtenerUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Usuario no encontrado" });
  });

  it("Deberia retornar 500 si ocurre un error", async () => {
    Usuario.findById.mockReturnValue({ populate: jest.fn().mockReturnValue({ select: jest.fn().mockRejectedValue(new Error("DB error")) }) });

    const req = { params: { id: validId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await obtenerUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("ACTUALIZAR USUARIO", () => {
  it("Deberia actualizar el usuario exitosamente", async () => {
    const mockUsuario = { _id: validId, nombre: "Carlos Updated", email: "new@test.com" };
    Usuario.findByIdAndUpdate.mockResolvedValue(mockUsuario);

    const req = { params: { id: validId }, body: { nombre: "Carlos Updated", email: "new@test.com" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await actualizarUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUsuario);
  });

  it("Deberia retornar 400 si el ID no es válido", async () => {
    const req = { params: { id: "id-invalido" }, body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await actualizarUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "ID no válido" });
  });

  it("Deberia retornar 404 si el usuario no existe", async () => {
    Usuario.findByIdAndUpdate.mockResolvedValue(null);

    const req = { params: { id: validId }, body: { nombre: "Carlos" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await actualizarUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Usuario no encontrado" });
  });
});

describe("ELIMINAR USUARIO", () => {
  it("Deberia eliminar el usuario exitosamente", async () => {
    Usuario.findByIdAndDelete.mockResolvedValue({ _id: validId });

    const req = { params: { id: validId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eliminarUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Usuario eliminado" });
  });

  it("Deberia retornar 400 si el ID no es válido", async () => {
    const req = { params: { id: "invalido" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eliminarUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("Deberia retornar 404 si el usuario no existe", async () => {
    Usuario.findByIdAndDelete.mockResolvedValue(null);

    const req = { params: { id: validId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eliminarUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("ACTUALIZAR ROL DE USUARIO", () => {
  it("Deberia actualizar el rol exitosamente", async () => {
    const mockUser = { _id: validId, nombre: "Carlos", rol: "usuario", save: jest.fn().mockResolvedValue(undefined) };
    Usuario.findById.mockResolvedValue(mockUser);
    Cantante.findOne.mockResolvedValue({ cantante: "Carlos" });

    const req = { params: { id: validId }, body: { role: "cantante" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await updateUserRole(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Rol actualizado con éxito" }));
  });

  it("Deberia retornar 400 si el ID no es válido", async () => {
    const req = { params: { id: "invalido" }, body: { role: "cantante" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await updateUserRole(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("Deberia retornar 404 si el usuario no existe", async () => {
    Usuario.findById.mockResolvedValue(null);

    const req = { params: { id: validId }, body: { role: "cantante" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await updateUserRole(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("OBTENER ESTADISTICAS", () => {
  it("Deberia retornar 400 si el ID no es válido", async () => {
    const req = { params: { id: "invalido" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await obtenerStats(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("Deberia retornar 404 si el usuario no existe", async () => {
    Usuario.findById.mockResolvedValue(null);

    const req = { params: { id: validId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await obtenerStats(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("Deberia retornar las estadísticas del usuario", async () => {
    const mockUser = {
      _id: validId,
      historial: [
        { titulo: "CRUZ", cantante: "Feid", genero: "regueton", fecha: new Date() },
        { titulo: "TUSA", cantante: "Karol G", genero: "regueton", fecha: new Date() },
      ],
      playlists: [],
    };
    Usuario.findById.mockResolvedValue(mockUser);

    const req = { params: { id: validId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await obtenerStats(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: 2 }));
  });
});

describe("REGISTRAR REPRODUCCION", () => {
  it("Deberia registrar una reproducción exitosamente", async () => {
    Usuario.findByIdAndUpdate.mockResolvedValue({ _id: validId });

    const req = {
      params: { id: validId },
      body: { cancionId: new mongoose.Types.ObjectId().toString(), titulo: "CRUZ", cantante: "Feid", genero: "regueton" },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await registrarPlay(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Reproducción registrada" });
  });

  it("Deberia retornar 400 si el ID no es válido", async () => {
    const req = { params: { id: "invalido" }, body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await registrarPlay(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("ACTUALIZAR CONFIGURACION", () => {
  it("Deberia actualizar la configuración exitosamente", async () => {
    const mockUser = { _id: validId, config: { perfilPublico: false } };
    Usuario.findByIdAndUpdate.mockResolvedValue(mockUser);

    const req = {
      params: { id: validId },
      body: { config: { perfilPublico: false, mostrarHistorial: true, notificaciones: false } },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await actualizarConfig(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUser);
  });

  it("Deberia retornar 404 si el usuario no existe", async () => {
    Usuario.findByIdAndUpdate.mockResolvedValue(null);

    const req = { params: { id: validId }, body: { config: {} } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await actualizarConfig(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("CAMBIAR PASSWORD", () => {
  it("Deberia retornar 400 si el ID no es válido", async () => {
    const req = { params: { id: "invalido" }, body: { passwordActual: "old", passwordNueva: "new" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await cambiarPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("Deberia retornar 404 si el usuario no existe", async () => {
    Usuario.findById.mockResolvedValue(null);

    const req = { params: { id: validId }, body: { passwordActual: "old", passwordNueva: "new" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await cambiarPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("Deberia retornar 401 si la contraseña actual es incorrecta", async () => {
    const mockUser = { _id: validId, password: "hashedPassword" };
    Usuario.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    const req = { params: { id: validId }, body: { passwordActual: "wrongpass", passwordNueva: "newpass" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await cambiarPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "La contraseña actual es incorrecta" });
  });

  it("Deberia cambiar la contraseña exitosamente", async () => {
    const mockUser = { _id: validId, password: "hashedPassword", save: jest.fn().mockResolvedValue(undefined) };
    Usuario.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    const req = { params: { id: validId }, body: { passwordActual: "oldpass", passwordNueva: "newpass123" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await cambiarPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Contraseña actualizada con éxito" });
  });
});
