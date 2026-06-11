import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({
  flatId,
  action,
  entityType,
  entityId,
  description,
  metadata = {},
  createdBy,
}) => {
  try {
    await ActivityLog.create({
      flatId,
      action,
      entityType,
      entityId,
      description,
      metadata,
      createdBy,
      status: 'active',
    });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};
