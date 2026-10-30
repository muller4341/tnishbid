const fs = require('fs');
const path = require('path');

const PREF_FILE = path.join(__dirname, '../../uploads/notification_preferences.json');

const DEFAULT_PREFS = {
  bidDrops: true,
  wins: true
};

const readAllPreferences = () => {
  try {
    if (!fs.existsSync(PREF_FILE)) {
      return {};
    }
    const data = fs.readFileSync(PREF_FILE, 'utf8');
    return JSON.parse(data) || {};
  } catch (err) {
    console.error('Error reading notification preferences:', err);
    return {};
  }
};

const getUserPreferences = (userId) => {
  if (!userId) return { ...DEFAULT_PREFS };
  const all = readAllPreferences();
  return { ...DEFAULT_PREFS, ...(all[String(userId)] || {}) };
};

const setUserPreferences = (userId, prefs) => {
  if (!userId) return { ...DEFAULT_PREFS };
  const all = readAllPreferences();
  all[String(userId)] = {
    ...DEFAULT_PREFS,
    ...(all[String(userId)] || {}),
    ...(prefs || {})
  };
  try {
    fs.mkdirSync(path.dirname(PREF_FILE), { recursive: true });
    fs.writeFileSync(PREF_FILE, JSON.stringify(all, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving notification preferences:', err);
  }
  return all[String(userId)];
};

module.exports = {
  getUserPreferences,
  setUserPreferences
};
