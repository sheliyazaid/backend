import * as importExportService from '../services/importExportService.js';

export const downloadTemplate = async (req, res, next) => {
  try {
    const { type } = req.params;
    const buffer =
      type === 'owners'
        ? importExportService.getOwnerTemplate()
        : importExportService.getFlatTemplate();
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${type}-template.xlsx`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

export const previewImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File required' });
    }
    const result = importExportService.previewImport(req.file.buffer, req.body.type);
    res.json({ success: true, data: { count: result.count, preview: result.preview } });
  } catch (err) {
    next(err);
  }
};

export const importData = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File required' });
    }
    const { rows } = importExportService.previewImport(req.file.buffer, req.body.type);
    const result =
      req.body.type === 'owners'
        ? await importExportService.importOwners(rows, req.user._id)
        : await importExportService.importFlats(rows, req.user._id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const exportData = async (req, res, next) => {
  try {
    const { type, format = 'xlsx' } = req.query;
    const data = await importExportService.exportData(type, format);
    if (format === 'csv') {
      res.setHeader('Content-Disposition', `attachment; filename=${type}.csv`);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(data);
    }
    res.setHeader('Content-Disposition', `attachment; filename=${type}.xlsx`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(data);
  } catch (err) {
    next(err);
  }
};
