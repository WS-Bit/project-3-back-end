import Users from '../models/user'; // Correct import
import { Document } from 'mongoose';
import { Request, Response } from 'express';
import { validatePassword } from '../models/user';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken'; // Fixed typo (it's `jsonwebtoken`, not `sendwebtoken`)
import formatValidationError from '../errors/validation'; // Ensure correct import
import User from '../models/user';
import Release from '../models/release';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail';
import validator from 'validator';

type UserDocument = Document & {
  username: string;
  email: string;
  password: string;
  uploads: mongoose.Types.ObjectId[];
  favourites: mongoose.Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

export const signUp = async (req: Request, res: Response) => {
  try {
      const { username, email, password, confirmPassword } = req.body;
      if (!username || !email || !password || !confirmPassword) {
          return res.status(400).json({ message: 'Invalid user sign-up format. Username, email, password, and confirm password are required' });
      }

      // Generate email confirmation token
      const emailConfirmationToken = crypto.randomBytes(20).toString('hex');
      const emailConfirmationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Add email confirmation fields to the user object
      const userObj = {
          ...req.body,
          emailConfirmationToken,
          emailConfirmationExpires,
          isEmailConfirmed: false
      };

      // Attempt to create the user
      const savedUser = await Users.create(userObj);
      console.log('NEW SIGN-UP:', savedUser);

      // Send confirmation email
      await sendEmail({
          to: email,
          subject: 'Confirm Your Email',
          templateId: process.env.SENDGRID_CONFIRMATION_TEMPLATE_ID,
          dynamicTemplateData: {
              confirmationUrl: `${process.env.FRONTEND_URL}/confirm-email/${emailConfirmationToken}`,
              username: username
          }
      });

      res.status(201).json({ 
          message: 'User created successfully. Please check your email to confirm your account.',
          user: {
              id: savedUser._id,
              username: savedUser.username,
              email: savedUser.email
          }
      });
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

export const confirmEmail = async (req: Request, res: Response) => {
  try {
      const { token } = req.params;
      const user = await Users.findOne({
          emailConfirmationToken: token,
          emailConfirmationExpires: { $gt: Date.now() }
      });

      if (!user) {
          return res.status(400).json({ message: 'Invalid or expired confirmation token.' });
      }

      user.isEmailConfirmed = true;
      user.emailConfirmationToken = null;
      user.emailConfirmationExpires = null;
      await user.save();

      res.json({ message: 'Email confirmed successfully. You can now log in.' });
  } catch (error) {
      console.error('Error in email confirmation:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
      const { email, password } = req.body;
      console.log(req.body)

      console.log(`Login attempt for email: ${email}`);

      if (!email || !password) {
          console.log('Login failed: Missing email or password');
          return res.status(400).json({ errors: { email: 'Email is required', password: 'Password is required' } });
      }

      const foundUser = await Users.findOne({ email });
      if (!foundUser) {
          console.log(`Login failed: User not found for email ${email}`);
          return res.status(401).json({ errors: { email: 'User not found. Please check your email.' } });
      }

      if (!foundUser.isEmailConfirmed) {
          console.log(`Login failed: Email not confirmed for ${email}`);
          return res.status(401).json({ errors: { email: 'Please confirm your email before logging in.' } });
      }

      console.log(`User found for email ${email}. Validating password...`);
      const isValidPassword = validatePassword(password, foundUser.password);
      console.log(`Password validation result: ${isValidPassword}`);

      if (!isValidPassword) {
          console.log(`Login failed: Incorrect password for email ${email}`);
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


  export const addToFavourites = async (req: Request, res: Response) => {
    const { userId, releaseId } = req.params;
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const releaseObjectId = new mongoose.Types.ObjectId(releaseId);
  
      if (!user.favourites.includes(releaseObjectId)) {
        user.favourites.push(releaseObjectId);
        await user.save();
      }
  
      res.json({ message: 'Added to favourites' });
    } catch (error) {
      console.error('Error adding to favourites:', error);
      res.status(500).json({ message: 'Error adding to favourites' });
    }
  };
  

  export const removeFromFavourites = async (req: Request, res: Response) => {
  const { userId, releaseId } = req.params;

  try {
    console.log(`Attempting to remove releaseId ${releaseId} from favourites for userId ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found for userId ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Current favourites:', user.favourites);

    const releaseObjectId = new mongoose.Types.ObjectId(releaseId);
    
    const initialFavouritesCount = user.favourites.length;
    user.favourites = user.favourites.filter(id => !id.equals(releaseObjectId));
    const finalFavouritesCount = user.favourites.length;

    console.log(`Favourites count before: ${initialFavouritesCount}, after: ${finalFavouritesCount}`);

    if (initialFavouritesCount === finalFavouritesCount) {
      console.log(`Release ${releaseId} was not in favourites`);
      return res.status(404).json({ message: 'Release not found in favourites' });
    }

    await user.save();

    console.log(`Successfully removed releaseId ${releaseId} from favourites`);
    res.json({ message: 'Removed from favourites' });
  } catch (error) {
    console.error('Error in removeFromFavourites:', error);
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    res.status(500).json({ message: 'Error removing from favourites', });
  }
};
  
  export const getUserFavourites = async (req: Request, res: Response) => {
    const { userId } = req.params;
  
    try {
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (!user.favourites || user.favourites.length === 0) {
        return res.json([]);
      }
  
      const favourites = await Release.find({
        _id: { $in: user.favourites }
      }).select('-reviews'); // Excluding reviews for performance, add back if needed
  
      return res.json(favourites);
    } catch (error) {
      console.error('Error fetching favourites:', error);
      return res.status(500).json({ message: 'Error fetching favourites.' });
    }
  };


  export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body as { email: string };
      const user = await User.findOne({ email }) as UserDocument | null;
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
  
      const resetToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
      await user.save();
  
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
  
      console.log('Reset URL:', resetUrl); // For debugging
  
      const templateId = process.env.SENDGRID_TEMPLATE_ID;
  
      try {
        if (templateId) {
          await sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            templateId: templateId,
            dynamicTemplateData: {
              recipient_name: user.username,
              reset_password_link: resetUrl
            }
          });
        } else {
          await sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            text: `Hello ${user.username},\n\nYou requested a password reset. Please click on this link to reset your password: ${resetUrl}\n\nIf you didn't request this, please ignore this email.`,
            html: `<p>Hello ${user.username},</p><p>You requested a password reset. Please click <a href="${resetUrl}">here</a> to reset your password.</p><p>If you didn't request this, please ignore this email.</p>`
          });
        }
  
        res.status(200).json({ message: 'Password reset email sent' });
      } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
  
        console.error('Error sending email:', error);
        res.status(500).json({ 
          message: 'Email could not be sent', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    } catch (error) {
      console.error('Error in forgotPassword:', error);
      res.status(500).json({ 
        message: 'Server error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get hashed token
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resetToken)
        .digest('hex');
  
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: new Date() },
      });
  
      if (!user) {
        res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        return;
      }
  
      // Validate password
      if (!req.body.password || !validator.isStrongPassword(req.body.password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minSymbols: 1,
        minNumbers: 1
      })) {
        res.status(400).json({ message: 'Password does not meet strength requirements' });
        return;
      }
  
      // Set new password
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
  
      res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Error in resetPassword:', error);
      res.status(500).json({ message: 'An error occurred while resetting the password' });
    }
  };