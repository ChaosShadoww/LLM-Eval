import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const port = 3001; // Choose a different port than your main app

app.get('/api/experiments', async (req, res) => {
  try {
    const experiments = await prisma.experiment.findMany();
    res.json(experiments);
  } catch (error) {
    console.error("Error fetching experiments:", error);
    res.status(500).json({ error: 'Failed to fetch experiments' });
  }
});

app.listen(port, () => {
  console.log(`Analytics API listening at http://localhost:${port}`);
});