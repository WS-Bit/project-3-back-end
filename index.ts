import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import router from './config/router'

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL
}));
app.use(express.json());
app.use('/api', router);

// Start the server
async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to the database');
    
    app.listen(process.env.PORT, () => {
      console.log(`Express API is running on http://localhost:${process.env.PORT}`);
    });
    
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

start();
