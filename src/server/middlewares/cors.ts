import cors from 'cors';

export const configureCors = () => {
  return cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: '*',
    maxAge: 3600,
  });
};
