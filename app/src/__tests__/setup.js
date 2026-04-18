import '@testing-library/jest-dom';

// jsdom defaults window.innerWidth to 0 which makes HeartVisualization
// produce a 0-capacity grid. Override to a realistic desktop width.
Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
