const prisma = require('../config/prismaClient');

class SettingsService {
  async getAll() {
    const list = await prisma.systemSetting.findMany();
    const settings = {};
    list.forEach(function (s) {
      try {
        settings[s.key] = JSON.parse(s.value);
      } catch (e) {
        settings[s.key] = s.value;
      }
    });
    return settings;
  }

  async getByKey(key) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    if (!setting) return null;
    try {
      return JSON.parse(setting.value);
    } catch (e) {
      return setting.value;
    }
  }

  async upsert(key, value) {
    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value: valStr },
      create: { key, value: valStr }
    });
  }
}

module.exports = new SettingsService();
