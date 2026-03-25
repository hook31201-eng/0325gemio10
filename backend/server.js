require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const custRouter = require('./routes/cust');
const factRouter = require('./routes/fact');
const itemRouter = require('./routes/item');
const userRouter = require('./routes/user');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/cust', custRouter);
app.use('/api/fact', factRouter);
app.use('/api/item', itemRouter);
app.use('/api/user', userRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TriSys Backend running on http://localhost:${PORT}`);
});
