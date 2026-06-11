import Owner from '../models/Owner.js';
import Occupant from '../models/Occupant.js';
import FamilyMember from '../models/FamilyMember.js';
import Tenant from '../models/Tenant.js';
import Vehicle from '../models/Vehicle.js';
import Document from '../models/Document.js';
import Note from '../models/Note.js';
import Tag from '../models/Tag.js';
import Flat from '../models/Flat.js';
import Reminder from '../models/Reminder.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { logActivity } from '../utils/activityLogger.js';
import fs from 'fs';

const createCrudService = (Model, config) => {
  const {
    entityType,
    nameField,
    createAction,
    updateAction,
    flatField = 'flatId',
    searchFields = [],
    sort = { createdAt: -1 },
    beforeCreate,
    afterCreate,
  } = config;

  const buildFilter = (query) => {
    const filter = { status: 'active' };
    if (query.flatId) filter[flatField] = query.flatId;
    if (query.search && searchFields.length) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = searchFields.map((f) => ({ [f]: regex }));
    }
    Object.keys(query).forEach((key) => {
      if (['page', 'limit', 'search', 'flatId'].includes(key)) return;
      if (query[key]) filter[key] = query[key];
    });
    return filter;
  };

  return {
    getAll: async (query) => {
      const { page, limit, skip } = getPagination(query);
      const filter = buildFilter(query);
      const [data, total] = await Promise.all([
        Model.find(filter)
          .populate('flatId', 'flatNumber wing')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Model.countDocuments(filter),
      ]);
      return paginatedResponse(data, total, page, limit);
    },

    getById: async (id) => {
      const doc = await Model.findOne({ _id: id, status: 'active' }).populate(
        'flatId',
        'flatNumber wing'
      );
      if (!doc) throw new ApiError(404, `${entityType} not found`);
      return doc;
    },

    create: async (data, userId) => {
      if (beforeCreate) await beforeCreate(data);
      const doc = await Model.create({ ...data, createdBy: userId });
      if (afterCreate) await afterCreate(doc, userId);
      const label = doc[nameField] || entityType;
      await logActivity({
        flatId: doc[flatField],
        action: createAction,
        entityType,
        entityId: doc._id,
        description: `${entityType} ${label} added`,
        createdBy: userId,
      });
      return doc.populate('flatId', 'flatNumber wing');
    },

    update: async (id, data, userId) => {
      const doc = await Model.findOneAndUpdate(
        { _id: id, status: 'active' },
        data,
        { new: true, runValidators: true }
      ).populate('flatId', 'flatNumber wing');
      if (!doc) throw new ApiError(404, `${entityType} not found`);
      const label = doc[nameField] || entityType;
      await logActivity({
        flatId: doc[flatField],
        action: updateAction || `${entityType} Updated`,
        entityType,
        entityId: doc._id,
        description: `${entityType} ${label} updated`,
        createdBy: userId,
      });
      return doc;
    },

    remove: async (id) => {
      const doc = await Model.findOneAndUpdate(
        { _id: id, status: 'active' },
        { status: 'inactive' },
        { new: true }
      );
      if (!doc) throw new ApiError(404, `${entityType} not found`);
      return doc;
    },
  };
};

export const ownerService = createCrudService(Owner, {
  entityType: 'Owner',
  nameField: 'fullName',
  createAction: 'Owner Added',
  updateAction: 'Owner Updated',
  searchFields: ['fullName', 'mobile', 'email'],
  beforeCreate: async (data) => {
    if (data.isPrimary && data.flatId) {
      await Owner.updateMany(
        { flatId: data.flatId, status: 'active' },
        { isPrimary: false }
      );
    }
  },
});

export const occupantService = createCrudService(Occupant, {
  entityType: 'Occupant',
  nameField: 'name',
  createAction: 'Occupant Added',
  searchFields: ['name', 'mobile'],
});

export const familyMemberService = createCrudService(FamilyMember, {
  entityType: 'FamilyMember',
  nameField: 'name',
  createAction: 'Family Member Added',
  searchFields: ['name', 'mobile', 'relation'],
});

export const tenantService = {
  ...createCrudService(Tenant, {
    entityType: 'Tenant',
    nameField: 'tenantName',
    createAction: 'Tenant Added',
    searchFields: ['tenantName', 'mobile'],
    beforeCreate: async (data) => {
      if (data.isCurrent && data.flatId) {
        await Tenant.updateMany(
          { flatId: data.flatId, status: 'active' },
          { isCurrent: false }
        );
      }
    },
  }),

  getHistory: async (flatId) => {
    return Tenant.find({ flatId, status: 'active' }).sort({ isCurrent: -1, createdAt: -1 });
  },

  getExpiring: async (days = 30) => {
    const future = new Date();
    future.setDate(future.getDate() + days);
    return Tenant.find({
      status: 'active',
      isCurrent: true,
      agreementEndDate: { $lte: future, $gte: new Date() },
    })
      .populate('flatId', 'flatNumber wing')
      .sort({ agreementEndDate: 1 });
  },
};

export const vehicleService = {
  ...createCrudService(Vehicle, {
    entityType: 'Vehicle',
    nameField: 'vehicleNumber',
    createAction: 'Vehicle Added',
    updateAction: 'Vehicle Updated',
    searchFields: ['vehicleNumber', 'brand', 'parkingSlot'],
  }),

  getHistory: async (flatId) => {
    return Vehicle.find({ flatId }).sort({ createdAt: -1 });
  },
};

export const noteService = createCrudService(Note, {
  entityType: 'Note',
  nameField: 'title',
  createAction: 'Note Created',
  searchFields: ['title', 'content'],
});

export const reminderService = createCrudService(Reminder, {
  entityType: 'Reminder',
  nameField: 'title',
  createAction: 'Reminder Created',
  searchFields: ['title', 'description'],
  sort: { dueDate: 1 },
});

export const tagService = {
  getAll: async () => Tag.find({ status: 'active' }).sort({ isDefault: -1, name: 1 }),

  create: async (data, userId) => {
    const tag = await Tag.create({ ...data, createdBy: userId });
    return tag;
  },

  update: async (id, data) => {
    const tag = await Tag.findOneAndUpdate(
      { _id: id, status: 'active' },
      data,
      { new: true, runValidators: true }
    );
    if (!tag) throw new ApiError(404, 'Tag not found');
    return tag;
  },

  remove: async (id) => {
    const tag = await Tag.findOneAndUpdate(
      { _id: id, status: 'active', isDefault: false },
      { status: 'inactive' },
      { new: true }
    );
    if (!tag) throw new ApiError(404, 'Tag not found or cannot delete default tag');
    await Flat.updateMany({ tagIds: id }, { $pull: { tagIds: id } });
    return tag;
  },

  assignToFlat: async (flatId, tagIds) => {
    const flat = await Flat.findOneAndUpdate(
      { _id: flatId, status: 'active' },
      { tagIds },
      { new: true }
    ).populate('tagIds', 'name color');
    if (!flat) throw new ApiError(404, 'Flat not found');
    return flat;
  },

  removeFromFlat: async (flatId, tagId) => {
    const flat = await Flat.findOneAndUpdate(
      { _id: flatId, status: 'active' },
      { $pull: { tagIds: tagId } },
      { new: true }
    ).populate('tagIds', 'name color');
    if (!flat) throw new ApiError(404, 'Flat not found');
    return flat;
  },
};

export const documentService = {
  getAll: async (query) => {
    const { page, limit, skip } = getPagination(query);
    const filter = { status: 'active' };
    if (query.flatId) filter.flatId = query.flatId;
    if (query.documentType) filter.documentType = query.documentType;
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ title: regex }, { originalName: regex }];
    }
    const [data, total] = await Promise.all([
      Document.find(filter)
        .populate('flatId', 'flatNumber wing')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Document.countDocuments(filter),
    ]);
    return paginatedResponse(data, total, page, limit);
  },

  getById: async (id) => {
    const doc = await Document.findOne({ _id: id, status: 'active' }).populate(
      'flatId',
      'flatNumber wing'
    );
    if (!doc) throw new ApiError(404, 'Document not found');
    return doc;
  },

  upload: async (data, file, userId) => {
    const doc = await Document.create({
      ...data,
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      createdBy: userId,
    });
    await logActivity({
      flatId: doc.flatId,
      action: 'Document Uploaded',
      entityType: 'Document',
      entityId: doc._id,
      description: `Document ${doc.originalName} uploaded`,
      createdBy: userId,
    });
    return doc.populate('flatId', 'flatNumber wing');
  },

  remove: async (id) => {
    const doc = await Document.findOneAndUpdate(
      { _id: id, status: 'active' },
      { status: 'inactive' },
      { new: true }
    );
    if (!doc) throw new ApiError(404, 'Document not found');
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }
    return doc;
  },
};
