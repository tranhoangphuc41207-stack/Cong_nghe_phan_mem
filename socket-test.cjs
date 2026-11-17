
const { io } = require('socket.io-client');

const token = process.env.JWT_TOKEN;

if (!token) {
  console.error('Chua co JWT_TOKEN. Hay dang nhap truoc.');
  process.exit(1);
}

const socket = io('http://localhost:3000', {
  auth: {
    token: token,
  },
  reconnection: false,
  timeout: 5000,
});

console.log('Dang ket noi den AR-IMMS Socket.IO...');

socket.on('connect', () => {
  console.log('================================');
  console.log('KET NOI SOCKET.IO THANH CONG!');
  console.log('Socket ID:', socket.id);
  console.log('Dang cho su kien canh bao...');
  console.log('================================');
});

socket.on('connect_error', (error) => {
  console.error('KET NOI THAT BAI:', error.message);
});

socket.on('alert:new', (data) => {
  console.log('\n===== CANH BAO MOI =====');
  console.log(JSON.stringify(data, null, 2));
});

socket.on('alert:updated', (data) => {
  console.log('\n===== CANH BAO DUOC CAP NHAT =====');
  console.log(JSON.stringify(data, null, 2));
});

socket.on('alert:resolved', (data) => {
  console.log('\n===== CANH BAO DA GIAI QUYET =====');
  console.log(JSON.stringify(data, null, 2));
});

socket.on('disconnect', (reason) => {
  console.log('Da ngat ket noi:', reason);
});

process.on('SIGINT', () => {
  console.log('\nDang dong Socket.IO Client...');
  socket.disconnect();
  process.exit(0);
});
