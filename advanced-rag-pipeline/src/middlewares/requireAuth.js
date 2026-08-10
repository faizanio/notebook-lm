import { getAuth } from '@clerk/express';

export const requireAuth = () => (req, res, next) => {
  const auth = getAuth(req);
  if (!auth || !auth.userId) {
    return res.status(401).json({ error: "Unauthenticated" });
  }
  next();
};
