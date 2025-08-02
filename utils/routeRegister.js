import adminRoutes from '../routes/adminRoutes.js';

export const registerAdminRoutes = (app) => {
  app.use('/api/admin', adminRoutes);
}; 