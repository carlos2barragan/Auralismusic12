import { describe, expect, it, jest } from "@jest/globals";
import mongoose from "mongoose";

jest.unstable_mockModule("../Modelos/playlistModelos.js", () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.unstable_mockModule("../Modelos/cancionesModelos.js", () => ({
  default: {
    find: jest.fn(),
  },
}));

jest.unstable_mockModule("../Modelos/usuariosModelos.js", () => ({
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

const { crear, agregarCancion, listar, ObtenerPorId, Actualizar, Eliminar } =
  await import("../Controladores/playlistController.js");

const PlayList = (await import("../Modelos/playlistModelos.js")).default;
const Canciones = (await import("../Modelos/cancionesModelos.js")).default;
const Usuario = (await import("../Modelos/usuariosModelos.js")).default;

const validUserId = new mongoose.Types.ObjectId().toString();
const validPlaylistId = new mongoose.Types.ObjectId().toString();
const validSongId = new mongoose.Types.ObjectId().toString();

describe("CREAR PLAYLIST", () => {
  it("Deberia retornar 400 si el usuario no existe", async () => {
    Usuario.findById.mockResolvedValue(null);
    Canciones.find.mockResolvedValue([{ _id: validSongId }]);

    const req = {
      body: { creadoPor: validUserId, canciones: [validSongId], nombre: "Test" },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await crear(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("usuario") }));
  });

  it("Deberia retornar 400 si no hay canciones válidas", async () => {
    const mockUsuario = { _id: validUserId };
    Usuario.findById.mockResolvedValue(mockUsuario);
    Canciones.find.mockResolvedValue([]);

    const req = {
      body: { creadoPor: validUserId, canciones: ["inexistente"], nombre: "Test" },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await crear(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "No se encontraron canciones válidas para agregar a la playlist." });
  });
});

describe("AGREGAR CANCION A PLAYLIST", () => {
  it("Deberia agregar canciones a la playlist", async () => {
    const mockPlaylist = {
      _id: validPlaylistId,
      canciones: [],
      save: jest.fn().mockResolvedValue(undefined),
      push: jest.fn(),
    };
    mockPlaylist.canciones.push = jest.fn();
    PlayList.findById.mockResolvedValue(mockPlaylist);

    const req = {
      params: { id: validPlaylistId },
      body: { canciones: [validSongId] },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await agregarCancion(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: expect.stringContaining("Canción") }));
  });

  it("Deberia retornar 400 si canciones no es un array", async () => {
    const req = { params: { id: validPlaylistId }, body: { canciones: "no-array" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await agregarCancion(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ mensaje: "Formato de canciones inválido" });
  });

  it("Deberia retornar 404 si la playlist no existe", async () => {
    PlayList.findById.mockResolvedValue(null);

    const req = { params: { id: validPlaylistId }, body: { canciones: [validSongId] } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await agregarCancion(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensaje: "Playlist no encontrada" });
  });

  it("Deberia retornar 500 si ocurre un error", async () => {
    PlayList.findById.mockRejectedValue(new Error("DB error"));

    const req = { params: { id: validPlaylistId }, body: { canciones: [validSongId] } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await agregarCancion(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensaje: "Error interno del servidor" });
  });
});

describe("LISTAR PLAYLISTS", () => {
  it("Deberia listar las playlists del usuario", async () => {
    const mockPlaylists = [{ _id: validPlaylistId, nombre: "Mi playlist", creadoPor: validUserId }];
    PlayList.find.mockResolvedValue(mockPlaylists);

    const req = { query: { userId: validUserId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await listar(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockPlaylists);
  });

  it("Deberia retornar 400 si el userId es inválido", async () => {
    const req = { query: { userId: "id-invalido" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await listar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "ID de usuario inválido" });
  });

  it("Deberia retornar 500 si ocurre un error", async () => {
    PlayList.find.mockRejectedValue(new Error("DB error"));

    const req = { query: { userId: validUserId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await listar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("OBTENER PLAYLIST POR ID", () => {
  it("Deberia retornar la playlist cuando el ID es válido", async () => {
    const mockPlaylist = { _id: validPlaylistId, nombre: "Mi playlist" };
    PlayList.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockPlaylist) });

    const req = { params: { id: validPlaylistId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await ObtenerPorId(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockPlaylist);
  });

  it("Deberia retornar 400 si el ID no es válido", async () => {
    const req = { params: { id: "id-invalido" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await ObtenerPorId(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "ID no válido" });
  });

  it("Deberia retornar 404 si la playlist no existe", async () => {
    PlayList.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

    const req = { params: { id: validPlaylistId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await ObtenerPorId(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Playlist no encontrada" });
  });

  it("Deberia retornar 500 si ocurre un error", async () => {
    PlayList.findById.mockReturnValue({ populate: jest.fn().mockRejectedValue(new Error("DB error")) });

    const req = { params: { id: validPlaylistId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await ObtenerPorId(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("ACTUALIZAR PLAYLIST", () => {
  it("Deberia retornar 404 si la playlist no existe", async () => {
    PlayList.findById.mockResolvedValue(null);

    const req = { params: { id: validPlaylistId }, body: { cancionesIds: [validSongId] } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await Actualizar(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Playlist no encontrada" });
  });

  it("Deberia retornar 400 si todas las canciones ya están en la playlist", async () => {
    const mockPlaylist = {
      _id: validPlaylistId,
      canciones: [validSongId],
      save: jest.fn(),
    };
    PlayList.findById.mockResolvedValue(mockPlaylist);

    const req = { params: { id: validPlaylistId }, body: { cancionesIds: [validSongId] } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await Actualizar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Todas las canciones ya están en la playlist" });
  });

  it("Deberia agregar nuevas canciones a la playlist", async () => {
    const newSongId = new mongoose.Types.ObjectId().toString();
    const mockPlaylist = {
      _id: validPlaylistId,
      canciones: [validSongId],
      push: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockPlaylist.canciones.push = jest.fn();
    PlayList.findById.mockResolvedValue(mockPlaylist);

    const req = { params: { id: validPlaylistId }, body: { cancionesIds: [newSongId] } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await Actualizar(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("Deberia retornar 500 si ocurre un error", async () => {
    PlayList.findById.mockRejectedValue(new Error("DB error"));

    const req = { params: { id: validPlaylistId }, body: { cancionesIds: [validSongId] } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await Actualizar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("ELIMINAR PLAYLIST", () => {
  it("Deberia eliminar la playlist exitosamente", async () => {
    PlayList.findByIdAndDelete.mockResolvedValue({ _id: validPlaylistId });

    const req = { params: { id: validPlaylistId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await Eliminar(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Playlist eliminada con exito" });
  });

  it("Deberia retornar 400 si el ID no es válido", async () => {
    const req = { params: { id: "id-invalido" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await Eliminar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("Deberia retornar 404 si la playlist no existe", async () => {
    PlayList.findByIdAndDelete.mockResolvedValue(null);

    const req = { params: { id: validPlaylistId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await Eliminar(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Playlist no encontrada" });
  });

  it("Deberia retornar 500 si ocurre un error", async () => {
    PlayList.findByIdAndDelete.mockRejectedValue(new Error("DB error"));

    const req = { params: { id: validPlaylistId } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await Eliminar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
