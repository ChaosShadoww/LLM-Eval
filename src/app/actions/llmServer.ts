"use server";


import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import cors from 'cors';
import { processLLMPrompt } from './api/evaluate'; // Adjust path if needed

const { processLLMPrompt } = require('./api/evaluate'); // Import the function

const app = express();
const prisma = new PrismaClient();
const port = 3001; // Choose a different port than your main app


const { evaluatePrompt } = require('./api/evaluate/route.ts'); // Adjust path as needed
require('dotenv').config();
app.use(express.json());
const cors = require('cors');
app.use(cors());

app.use(express.json());

app.post('/api/evaluate', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const { llmResponse, evaluation } = await processLLMPrompt(prompt); // Use the function

        res.json({ llmResponse, evaluation }); // Send both back
    } catch (error) {
        console.error("Error in /api/evaluate:", error);
        res.status(500).json({ error: "An error occurred" });
    }
});

app.listen(port, () => {
  console.log(`Analytics API listening at http://localhost:${port}`);
});


