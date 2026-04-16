const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const authRouter = require('./service/auth');
const movieRouter = require('./service/movie');
const userRouter = require('./service/users');
const showtimeRouter = require('./service/showtime');
const voucherRouter = require('./service/voucher');
const reportsRouter = require('./service/reports');
const isLogin = require('./middle_wares/isLogin');
const productRouter = require('./service/product');
const invoiceRouter = require('./service/invoice');
const bookingRouter = require('./service/booking');
const tmdbRouter = require('./service/tmdb');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
// app.use(bodyParser.json());
app.use(express.json());

app.use('/auth', authRouter);

app.use('/phim', movieRouter);
app.use('/users', userRouter);
app.use('/showtime', showtimeRouter);
app.use('/voucher', voucherRouter);
app.use('/reports', reportsRouter);
app.use('/products', productRouter);
app.use('/invoice', invoiceRouter);
app.use('/booking', bookingRouter);
app.use('/tmdb', tmdbRouter);

app.get('/', (req, res) => {
  res.send('Server đang chạy!');
});
const startServer = async () => {
  const { connectDB } = require('./service/db');
  await connectDB(); // Kết nối CSDL trước khi khởi động server
};

startServer()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Lỗi khi khởi động server:', err);
  });
