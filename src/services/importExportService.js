import XLSX from 'xlsx';
import Flat from '../models/Flat.js';
import Owner from '../models/Owner.js';
import { ApiError } from '../utils/ApiError.js';
import { logActivity } from '../utils/activityLogger.js';

const FLAT_HEADERS = ['flatNumber', 'wing', 'floor', 'flatStatus', 'notes'];
const OWNER_HEADERS = [
  'flatNumber',
  'fullName',
  'mobile',
  'alternateMobile',
  'email',
  'aadhaarNumber',
  'panNumber',
  'ownershipStartDate',
  'isPrimary',
];

export const getFlatTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    FLAT_HEADERS,
    ['A-101', 'A', 1, 'Occupied', 'Corner flat'],
    ['A-102', 'A', 1, 'Vacant', ''],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Flats');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

export const getOwnerTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    OWNER_HEADERS,
    ['A-101', 'Rajesh Kumar', '9876543210', '', 'raj@email.com', '', '', '2020-01-15', 'true'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Owners');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

export const previewImport = (buffer, type) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return { count: rows.length, preview: rows.slice(0, 10), rows };
};

export const importFlats = async (rows, userId) => {
  const results = { created: 0, errors: [] };
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.flatNumber) {
        results.errors.push({ row: i + 2, message: 'Flat number is required' });
        continue;
      }
      const flat = await Flat.create({
        flatNumber: String(row.flatNumber).trim(),
        wing: String(row.wing || '').trim(),
        floor: Number(row.floor) || 0,
        flatStatus: row.flatStatus || 'Vacant',
        notes: String(row.notes || ''),
        createdBy: userId,
      });
      await logActivity({
        flatId: flat._id,
        action: 'Flat Created',
        entityType: 'Flat',
        entityId: flat._id,
        description: `Flat ${flat.flatNumber} imported`,
        createdBy: userId,
      });
      results.created++;
    } catch (err) {
      results.errors.push({ row: i + 2, message: err.message });
    }
  }
  return results;
};

export const importOwners = async (rows, userId) => {
  const results = { created: 0, errors: [] };
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const flat = await Flat.findOne({
        flatNumber: String(row.flatNumber).trim(),
        status: 'active',
      });
      if (!flat) {
        results.errors.push({ row: i + 2, message: `Flat ${row.flatNumber} not found` });
        continue;
      }
      const isPrimary = String(row.isPrimary).toLowerCase() === 'true';
      if (isPrimary) {
        await Owner.updateMany({ flatId: flat._id, status: 'active' }, { isPrimary: false });
      }
      const owner = await Owner.create({
        flatId: flat._id,
        fullName: String(row.fullName).trim(),
        mobile: String(row.mobile).trim(),
        alternateMobile: String(row.alternateMobile || '').trim(),
        email: String(row.email || '').trim(),
        aadhaarNumber: String(row.aadhaarNumber || '').trim(),
        panNumber: String(row.panNumber || '').trim(),
        ownershipStartDate: row.ownershipStartDate ? new Date(row.ownershipStartDate) : undefined,
        isPrimary,
        createdBy: userId,
      });
      await logActivity({
        flatId: flat._id,
        action: 'Owner Added',
        entityType: 'Owner',
        entityId: owner._id,
        description: `Owner ${owner.fullName} imported`,
        createdBy: userId,
      });
      results.created++;
    } catch (err) {
      results.errors.push({ row: i + 2, message: err.message });
    }
  }
  return results;
};

export const exportData = async (type, format = 'xlsx') => {
  let data = [];
  let sheetName = 'Data';

  if (type === 'flats') {
    const flats = await Flat.find({ status: 'active' }).sort({ wing: 1, flatNumber: 1 });
    data = flats.map((f) => ({
      flatNumber: f.flatNumber,
      wing: f.wing,
      floor: f.floor,
      flatStatus: f.flatStatus,
      notes: f.notes,
    }));
    sheetName = 'Flats';
  } else if (type === 'owners') {
    const owners = await Owner.find({ status: 'active' }).populate('flatId', 'flatNumber wing');
    data = owners.map((o) => ({
      flatNumber: o.flatId?.flatNumber || '',
      wing: o.flatId?.wing || '',
      fullName: o.fullName,
      mobile: o.mobile,
      alternateMobile: o.alternateMobile,
      email: o.email,
      aadhaarNumber: o.aadhaarNumber,
      panNumber: o.panNumber,
      ownershipStartDate: o.ownershipStartDate,
      isPrimary: o.isPrimary,
    }));
    sheetName = 'Owners';
  } else {
    throw new ApiError(400, 'Invalid export type');
  }

  const ws = XLSX.utils.json_to_sheet(data);
  if (format === 'csv') {
    return XLSX.utils.sheet_to_csv(ws);
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};
