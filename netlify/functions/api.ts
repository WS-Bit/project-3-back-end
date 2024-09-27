import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import router from '../../config/router'
import serverless from "serverless-http"
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors())
app.use('/api', router);

// Start the server
async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to the database');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

start();

export const handler = serverless(app)
