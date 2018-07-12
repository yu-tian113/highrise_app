let _sessionStorageStore = {}
let _localStorageStore = {}
module.exports = {
  verbose: true,
  collectCoverage: true,
  globals: {
    ZAFClient: {
      init: () => ({on: () => {}})
    }
  },
  roots: ['./spec']
}
