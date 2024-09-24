import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import Users from '../models/user';
dotenv.config();

export default async function secureRoute(req: Request, res: Response, next: NextFunction) {
    console.log("Secure Route accessed. Authorization in progress...");
    
    const rawToken = req.headers.authorization;

    if (!rawToken) {
        return res.status(401).json({ message: "Unauthorized. No Auth header found." });
    }

    const token = rawToken.replace("Bearer ", "");

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

        console.log("Token verified, payload: ", payload);

        const user = await Users.findById(payload.userId);
        if (!user) {
            return res.status(401).json({ message: "User not found. Invalid JWT!" });
        }

        req.currentUser = user; // Attach the user to req
        next(); // Proceed to the next middleware/controller

    } catch (error) {
        console.error("Authorization error:", error);
        return res.status(401).json({ message: "Unauthorized. Invalid or expired token." });
    }
}
