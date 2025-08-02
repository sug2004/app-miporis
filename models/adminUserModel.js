import mongoose from 'mongoose';

const adminUserRelationSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const AdminUserRelation =
  mongoose.models.AdminUserRelation ||
  mongoose.model('AdminUserRelation', adminUserRelationSchema);

export default AdminUserRelation;
