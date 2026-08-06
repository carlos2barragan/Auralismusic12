import axios from "axios";

const JAMENDO_BASE = "https://api.jamendo.com/v3.0";
const CLIENT_ID = process.env.JAMENDO_CLIENT_ID || "";

export async function getPopularTracks(limit = 20, tags = "") {
  if (!CLIENT_ID) return [];
  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      format: "json",
      limit: String(limit),
      order: "popularity_total",
      audioformat: "mp32",
      imagesize: "300",
    });
    if (tags) params.append("tags", tags);

    const { data } = await axios.get(`${JAMENDO_BASE}/tracks/?${params}`);
    return (data.results || []).map(formatJamendoTrack);
  } catch (err) {
    console.error("Jamendo error:", err.response?.data || err.message);
    return [];
  }
}

export async function searchJamendo(query, limit = 10) {
  if (!CLIENT_ID) return [];
  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      format: "json",
      limit: String(limit),
      search: query,
      audioformat: "mp32",
      imagesize: "300",
    });

    const { data } = await axios.get(`${JAMENDO_BASE}/tracks/?${params}`);
    return (data.results || []).map(formatJamendoTrack);
  } catch (err) {
    console.error("Jamendo search error:", err.response?.data || err.message);
    return [];
  }
}

export async function getArtistTracks(artistName, limit = 15) {
  if (!CLIENT_ID) return [];
  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      format: "json",
      limit: String(limit),
      artist_name: artistName,
      audioformat: "mp32",
      imagesize: "300",
      order: "popularity_total",
    });

    const { data } = await axios.get(`${JAMENDO_BASE}/tracks/?${params}`);
    return (data.results || []).map(formatJamendoTrack);
  } catch (err) {
    console.error("Jamendo artist tracks error:", err.response?.data || err.message);
    return [];
  }
}

export async function searchArtist(artistName) {
  if (!CLIENT_ID) return null;
  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      format: "json",
      limit: "1",
      artist_name: artistName,
      imagesize: "300",
    });

    const { data } = await axios.get(`${JAMENDO_BASE}/artists/tracks/?${params}`);
    if (!data.results?.length) return null;
    const track = data.results[0];
    return {
      nombre: track.artist_name,
      imagen: track.artist_image || track.image || null,
      generos: [],
    };
  } catch (err) {
    console.error("Jamendo artist search error:", err.response?.data || err.message);
    return null;
  }
}

function formatJamendoTrack(track) {
  return {
    jamendoId: track.id,
    titulo: track.name,
    artista: track.artist_name,
    album: track.album_name || "Single",
    imagen: track.image || track.album_image || "",
    fileUrl: track.audio || "",
    downloadUrl: track.audiodownload || "",
    duracion: track.duration,
    genero: "",
    plays: Math.floor(Math.random() * 5000000) + 100000,
  };
}
