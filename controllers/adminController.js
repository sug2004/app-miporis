import AdminUserRelation from '../models/adminUserModel.js';
import User from '../models/UserModel.js';
import ControlData from '../models/complianceModel.js';

export const getUsersAnalytics = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Find all user relations for this admin
    const relations = await AdminUserRelation.find({ adminId }).populate('userId', '-passwordHash -resetPasswordPin -resetPinExpiry');
    
    if (!relations || relations.length === 0) {
      return res.status(200).json({ 
        totalUsers: 0,
        analytics: [] 
      });
    }
    
    // Get the user IDs
    const userIds = relations.map(relation => relation.userId._id);
    
    // Array to hold all analytics data
    const analyticsData = [];
    
    // Process each user
    for (const userId of userIds) {
      // Get user details
      const user = await User.findById(userId).select('-passwordHash -resetPasswordPin -resetPinExpiry');
      
      // Get analytics for this user
      const analytics = await ControlData.aggregate([
        { $match: { userId: userId.toString() } },
        {
          $group: {
            _id: "$compliant_type",
            total_count: { $sum: 1 },
            total_result: {
              $sum: { $cond: [{ $eq: ["$compliant_result", "C"] }, 1, 0] }
            },
            total_Relevance: {
              $sum: { $cond: [{ $eq: ["$Relevance", "Y"] }, 1, 0] }
            },
            Compliance: {
              $sum: { $cond: [{ $eq: ["$Compliance", "Y"] }, 1, 0] }
            },
            total_NC: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$compliant_result", "NC"] },
                      { $eq: ["$Relevance", "Y"] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            total_PC: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$compliant_result", "PC"] },
                      { $eq: ["$Relevance", "Y"] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            compliant_type: "$_id",
            total_count: 1,
            total_result: 1,
            total_Relevance: 1,
            Compliance: 1,
            total_NC: 1,
            total_PC: 1,
            percent: {
              $cond: {
                if: { $eq: ["$total_count", 0] },
                then: 0,
                else: { $multiply: [{ $divide: ["$total_result", "$total_Relevance"] }, 100] }
              }
            },
            _id: 0
          }
        }
      ]);
      
      // Add user data with analytics to result array
      analyticsData.push({
        user: user,
        analytics: analytics
      });
    }
    
    res.status(200).json({
      totalUsers: userIds.length,
      analytics: analyticsData
    });
    
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get summary of all users analytics
export const getAllUsersAnalyticsSummary = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Find all user relations for this admin
    const relations = await AdminUserRelation.find({ adminId });
    
    if (!relations || relations.length === 0) {
      return res.status(200).json({ 
        totalUsers: 0,
        summary: {} 
      });
    }
    
    // Get the user IDs
    const userIds = relations.map(relation => relation.userId.toString());
    
    // Get aggregated analytics for all users
    const summary = await ControlData.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: "$compliant_type",
          total_count: { $sum: 1 },
          compliant_count: { 
            $sum: { $cond: [{ $eq: ["$compliant_result", "C"] }, 1, 0] } 
          },
          partial_count: { 
            $sum: { $cond: [{ $eq: ["$compliant_result", "PC"] }, 1, 0] } 
          },
          non_compliant_count: { 
            $sum: { $cond: [{ $eq: ["$compliant_result", "NC"] }, 1, 0] } 
          },
          total_Relevance: {
            $sum: { $cond: [{ $eq: ["$Relevance", "Y"] }, 1, 0] }
          },
        }
      },
      {
        $project: {
          compliant_type: "$_id",
          total_count: 1,
          compliant_count: 1,
          partial_count: 1,
          non_compliant_count: 1,
          total_Relevance: 1,
          compliance_percentage: {
            $cond: {
              if: { $eq: ["$total_count", 0] },
              then: 0,
              else: { $multiply: [{ $divide: ["$compliant_count", "$total_Relevance"] }, 100] }
            }
          },
          _id: 0
        }
      }
    ]);
    
    res.status(200).json({
      totalUsers: userIds.length,
      summary: summary
    });
    
  } catch (error) {
    console.error('Error fetching summary analytics:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete user by admin
export const deleteUserByAdmin = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;
    
    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if the relation exists between admin and user
    const relation = await AdminUserRelation.findOne({
      adminId: adminId,
      userId: userId
    });
    
    if (!relation) {
      return res.status(404).json({ 
        success: false, 
        message: 'No relation found between admin and user or user not managed by this admin' 
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      // If relation exists but user doesn't (unusual case), delete the relation
      await AdminUserRelation.deleteOne({ _id: relation._id });
      return res.status(404).json({ 
        success: false, 
        message: 'User not found but relation deleted' 
      });
    }
    
    // Delete all control data related to this user
    const deleteControlResult = await ControlData.deleteMany({ userId: userId.toString() });
    
    // Delete the user
    const deleteUserResult = await User.deleteOne({ _id: userId });
    
    // Delete the relation
    const deleteRelationResult = await AdminUserRelation.deleteOne({ _id: relation._id });
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      details: {
        controlDataDeleted: deleteControlResult.deletedCount,
        userDeleted: deleteUserResult.deletedCount,
        relationDeleted: deleteRelationResult.deletedCount
      }
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};
