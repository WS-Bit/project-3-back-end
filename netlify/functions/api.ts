import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import router from '../../config/router'
import serverless from "serverless-http"
dotenv.config();

const app = express();

// Add this middleware to handle raw body
app.use(express.raw({ type: 'application/json' }));

// Add this middleware to parse the raw body
app.use((req, res, next) => {
  if (req.headers['content-type'] === 'application/json') {
    try {
      req.body = JSON.parse(req.body.toString());
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }
  next();
});

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