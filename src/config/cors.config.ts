export const getCorsConfig = () => {
  return {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ],
    credentials: true,
  };
};
