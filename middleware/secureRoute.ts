import { Request, Response, NextFunction } from 'express';

import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();
import Users from '../models/user';


export default function secureRoute(req: Request, res: Response, next: NextFunction) {

    console.log("Hey! This is a secure route. Authorise access only!")

    const rawToken = req.headers.authorization
    if (!rawToken) {
        return res.status(401).json({ message: "Unauthorised. No Auth header found." })
    }
    
    const token = rawToken.replace("Bearer ", "")

    jwt.verify(token, process.env.JWT_SECRET as string, async (err, payload) => {
        if (err || !payload) {
            return res.status(401).json({ message: "Unathorised. Invalid JWT."})
        }
        
        console.log("Valid token! The payload is: ", payload)

        interface JWTPayload {
            userId: string
        }

        const jwtPayload = payload as JWTPayload
        const userId = jwtPayload.userId

        const user = await Users.findById(userId)
        if (!user) {
            return res.status(401).json({ message: "User not found. Invalid JWT!"})
        }
        
     
        req.currentUser = user

        next()
    }) 
   

   
}