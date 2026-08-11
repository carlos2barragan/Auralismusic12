import cloudinaryPkg from "cloudinary";
import { uploadToCloudinary } from "../config/multer.js";

const cloudinary = cloudinaryPkg.v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "❌ No se recibió ninguna imagen." });
    }

 
    const result = await uploadToCloudinary(req.file.buffer, "uploads", "image");

    res.status(201).json({
      message: "✅ Imagen subida correctamente",
      imageUrl: result.secure_url, 
    });
  } catch (error) {
    res.status(500).json({ error: "❌ Error al subir la imagen.", details: error.message });
  }
};


export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "❌ No se recibieron imágenes." });
    }


    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, "uploads", "image")
    );
    const results = await Promise.all(uploadPromises);

    const imageUrls = results.map((result) => result.secure_url);

    res.status(201).json({
      message: "✅ Imágenes subidas correctamente",
      imageUrls,
    });
  } catch (error) {
    res.status(500).json({ error: "❌ Error al subir imágenes.", details: error.message });
  }
};


export const uploadAudioFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "❌ No se ha recibido el archivo de audio." });
    }


    const result = await uploadToCloudinary(req.file.buffer, "audios", "audio");

    res.status(201).json({
      message: "✅ Canción subida con éxito",
      audioUrl: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({ error: "❌ Error al subir el audio.", details: error.message });
  }
  
};
