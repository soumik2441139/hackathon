import geoip from "geoip-lite";
import { Request, Response, NextFunction } from "express";

const ALLOWED = ["IN", "US"]; // Target audience

export default function geoBlock(req: Request, res: Response, next: NextFunction) {
  const ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "";
  
  // Clean up IPv6 mapped IPv4 addresses (e.g. ::ffff:127.0.0.1)
  const cleanIp = ip.split(',')[0].trim().replace(/^.*:/, '');
  
  // Skip geo-blocking for local development
  if (cleanIp === '127.0.0.1' || cleanIp === 'localhost') {
      return next();
  }

  const geo = geoip.lookup(cleanIp);

  if (!geo || !ALLOWED.includes(geo.country)) {
    return res.status(403).json({ error: "Region not allowed. Access denied by GeoIP Protocol." });
  }
  next();
}
