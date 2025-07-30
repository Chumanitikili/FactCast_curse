import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { json } from 'body-parser';
import { connectDB } from './utils/db';
import { authRouter } from './routes/auth';
import { factCheckRouter } from './routes/factcheck';
import { userRouter } from './routes/user';
import { billingRouter } from './routes/billing';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(json());
app.use(morgan('combined'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

app.use('/api/auth', authRouter);
app.use('/api/factcheck', factCheckRouter); // <-- Fact checking pipeline
app.use('/api/user', userRouter);
app.use('/api/billing', billingRouter);

app.use(errorHandler);

connectDB().then(() => {
  app.listen(process.env.PORT || 4000, () =>
    console.log(`Server running on port ${process.env.PORT || 4000}`)
  );
});