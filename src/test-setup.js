import '@testing-library/jest-dom';

// jsdom doesn't implement Canvas — provide a minimal stub
HTMLCanvasElement.prototype.getContext = () => ({
  fillStyle: '',
  fillRect: () => {},
  strokeStyle: '',
  lineWidth: 0,
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
});
HTMLCanvasElement.prototype.toDataURL = () => '';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
