import express from 'express';
import cors from 'cors';
import router from './routes';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

app.get('/', (_, res) => {
    res.json({
        message: "Veterinary Service API",
        status: "Running",
        docs: "See README.md"
    });
});

app.use('/api', router);

app.listen(port, () => {
    console.log(`TS Server running on http://localhost:${port}`);
});