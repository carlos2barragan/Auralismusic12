import mongoose from "mongoose";
import "dotenv/config";

export async function connectDB() {
    try {
        const MONGODB_URI =
            process.env.NODE_ENV === "production"
                ? process.env.MONGODB_URI_PROD
                : process.env.MONGODB_URI_LOCAL;

        if (!MONGODB_URI) {
            throw new Error("❌ No se encontró la URI de la base de datos en las variables de entorno.");
        }

        await mongoose.connect(MONGODB_URI);

        console.log("✅ Conectado a la base de datos.");
    } catch (error) {
        console.error("❌ Error al conectar con la base de datos:", error.message);
        process.exit(1); // Cierra el proceso solo si es un error grave
    }
}
export default connectDB