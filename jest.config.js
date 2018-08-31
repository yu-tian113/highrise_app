module.exports = {
  verbose: true,
  collectCoverage: true,
  globals: {
    ZAFClient: {
      init: () => ({on: () => {}})
    }
  },
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/spec/mocks/svgMock.js'
  },
  coveragePathIgnorePatterns: [
    '<rootDir>/spec'
  ],
  roots: ['./spec']
}
