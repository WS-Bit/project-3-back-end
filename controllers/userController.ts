import Users from '../models/user'; // Correct import
import { Request, Response } from 'express';
import { validatePassword } from '../models/user';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken'; // Fixed typo (it's `jsonwebtoken`, not `sendwebtoken`)
import formatValidationError from '../errors/validation'; // Ensure correct import
import User from '../models/user';
import Release from '../models/release';

export const signUp = async (req: Request, res: Response) => {
    try {
        const { username, email, password, confirmPassword } = req.body;
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'Invalid user sign-up format. Username, email, password, and confirm password are required' });
        }

        // Attempt to create the user
        const savedUser = await Users.create(req.body);
        console.log('NEW SIGN-UP:', savedUser);

        res.status(201).send(savedUser);
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            // Handle Mongoose validation error with deep error messages
            console.error('Validation error:', error.message);
            return res.status(400).send({ 
                message: 'Validation error', 
                errors: formatValidationError(error) // Send detailed validation errors
            });
        } else if (error instanceof mongoose.Error) {
            // Handle other Mongoose errors
            console.error('Mongoose error:', error.message);
            return res.status(500).send({ message: 'Database error' });
        } else if (error instanceof Error) {
            // Check for MongoDB duplicate key error code (11000)
            if ((error as any).code === 11000) {
                console.error('Duplicate email error:', error.message);
                return res.status(409).send({ message: 'Email already in use' });
            }
            console.error('Error in sign-up process:', error.message);
            res.status(500).send({ message: 'Internal server error' });
        } else {
            console.error('Unknown error:', error);
            res.status(500).send({ message: 'An unknown error occurred' });
        }
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // ! Check if both email and password are provided
        if (!email || !password) {
            return res.status(400).json({ errors: { email: 'Email is required', password: 'Password is required' } });
        }

        // ! Find the user by email
        const foundUser = await Users.findOne({ email });
        if (!foundUser) {
            return res.status(401).json({ errors: { email: 'User not found. Please check your email.' } });
        }

        // ! Validate the password
        const isValidPassword = validatePassword(password, foundUser.password);
        if (!isValidPassword) {
            return res.status(401).json({ errors: { password: 'Incorrect password.' } });
        }

        // ! Assign a token
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in the environment variables.');
        }

        const token = jwt.sign(
            { userId: foundUser._id, email: foundUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '90d' }
        );

        // ! Respond with success
        return res.status(200).json({
            message: 'Login successful',
            user: {
              id: foundUser._id,
              username: foundUser.username,
              email: foundUser.email,
            },
            token,
          });
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            // ! Handle Mongoose validation error
            console.error('Validation error:', error.message);
            return res.status(400).json({ errors: formatValidationError(error) });
        } else if (error instanceof mongoose.Error) {
            // ! Handle other Mongoose errors
            console.error('Mongoose error:', error.message);
            return res.status(500).json({ message: 'Database error' });
        } else if (error instanceof Error) {
            // ! Handle other general errors
            console.error('Error during login process:', error.message);
            res.status(500).json({ message: 'Internal server error' });
        } else {
            console.error('Unknown error:', error);
            res.status(500).json({ message: 'An unknown error occurred' });
        }
    }
    
};

export async function getCurrentUser(req: Request, res: Response) {
    try {
        if (!req.currentUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(req.currentUser);
    } catch (error) {
        console.error("Error fetching current user:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}

export const getUserProfile = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
  
      // Fetch user by ID
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Fetch releases by the user's ID
      const uploads = await Release.find({ user: user._id });
  
      // Return user data along with uploads
      res.json({ user, uploads });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };

  export const getUserUploads = async (req: Request, res: Response) => {
    const { userId } = req.params;
  
    try {
      // Fetch uploads for the user
      const uploads = await Release.find({ user: userId }).populate('user', 'username email');
  
      return res.json(uploads);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      return res.status(500).json({ message: 'Error fetching uploads.' });
    }
  };