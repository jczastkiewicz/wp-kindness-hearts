import '@testing-library/jest-dom';

// jsdom defaults window.innerWidth to 0 which makes HeartVisualization
// produce a 0-capacity grid. Override to a realistic desktop width.
Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });

// Force the i18n stack into English for unit tests so existing assertions
// (which match against English literals like "Kindness Points", "school-wide",
// "Access required", etc.) keep working. Polish-side correctness is verified
// by reading the .po files directly and by language-switcher unit tests.
import i18n from '../i18n/index.js';
i18n.changeLanguage('en');
