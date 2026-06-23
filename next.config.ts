import type { NextConfig } from "next";

const lanIp = process.env.LAN_IP;

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "sharp"],
  // Permite acceder desde celular/tablet en la misma red (dev).
  // Agrega tu IP Wi‑Fi en .env: LAN_IP=192.168.1.139
  allowedDevOrigins: [
    ...(lanIp ? [lanIp, `${lanIp}:3000`] : []),
    "192.168.1.139",
    "192.168.1.139:3000",
  ],
};

export default nextConfig;
