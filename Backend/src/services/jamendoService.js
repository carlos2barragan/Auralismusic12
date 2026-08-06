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
