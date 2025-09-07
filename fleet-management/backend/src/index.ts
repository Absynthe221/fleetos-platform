import express from 'express';
const app = express();
app.use(express.json());
app.get('/', (_req, res) => res.send('Fleet scaffolding ready'));
app.listen(5050, () => console.log('Dev server on :5050'));
