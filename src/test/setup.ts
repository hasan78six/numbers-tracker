import '@testing-library/jest-dom'

// @ts-ignore
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} 