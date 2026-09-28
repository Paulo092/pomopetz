const STORAGE_VERSION_KEY = 'pomopetz_version'
const CURRENT_VERSION = 1
const migrations = {}

export function useDataMigration() {
  const getStorageVersion = () => {
    try {
      const version = localStorage.getItem(STORAGE_VERSION_KEY)
      return version ? parseInt(version) : 0
    } catch {
      return 0
    }
  }

  const runMigrations = () => {
    const userVersion = getStorageVersion()
    if (userVersion === CURRENT_VERSION) return
    console.log(`Migrando dados de v${userVersion} para v${CURRENT_VERSION}`)
    for (let v = userVersion; v < CURRENT_VERSION; v++) {
      if (migrations[v]) {
        try {
          migrations[v]()
        } catch (error) {
          console.error(`Erro durante migração v${v}:`, error)
        }
      }
    }
    localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION))
  }

  const initialize = () => {
    if (getStorageVersion() === 0) {
      localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION))
    } else {
      runMigrations()
    }
  }

  const clearAllData = () => {
    const keysToRemove = ['pomopetz_version', 'pomopetz_pomodoro', 'pomopetz_rewards', 'pomopetz_streak', 'pomopetz_excursions']
    keysToRemove.forEach(key => localStorage.removeItem(key))
    localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION))
  }

  return { getStorageVersion, runMigrations, initialize, clearAllData, CURRENT_VERSION }
}
