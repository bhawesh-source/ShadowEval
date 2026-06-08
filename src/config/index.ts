import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
export const EVALUATION_TOPIC = process.env.EVALUATION_TOPIC || 'llm-shadow-evaluations';
export const PRIMARY_MODEL_ENDPOINT = process.env.PRIMARY_MODEL_ENDPOINT || 'http://localhost:4000/primary';
export const CANDIDATE_MODEL_ENDPOINT = process.env.CANDIDATE_MODEL_ENDPOINT || 'http://localhost:4000/candidate';
