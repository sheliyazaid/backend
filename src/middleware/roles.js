import { authorize } from './auth.js';

export const adminOnly = authorize('Admin');
export const watchmanOrAdmin = authorize('Admin', 'Watchman');
export const residentOnly = authorize('Resident');
