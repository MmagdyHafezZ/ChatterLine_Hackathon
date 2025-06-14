// src/app.ts
import express, { Request, Response } from 'express';

import prisma from './prisma';

const app = express();
const port = process.env.PORT || 3000;

var store = {}


app.get('/', async (req: Request, res: Response) => {
    console.log(await prisma.user.count())

    res.send('Hello, Express with TypeScript!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});