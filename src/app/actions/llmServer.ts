"use server";


import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import cors from 'cors';

const { processLLMPrompt } = require('./api/evaluate'); // Import the function

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = 3001; 


const { evaluatePrompt } = require('./api/evaluate'); // Adjust path as needed
app.use(express.json());
app.use(cors());


app.post('/api/evaluate', async (req, res) => {
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


