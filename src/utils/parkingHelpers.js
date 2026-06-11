export const generateNumber = async (Model, field, prefix) => {
  const year = new Date().getFullYear();
  const count = await Model.countDocuments();
  return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
};

export const generatePassCode = () =>
  `PKG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
