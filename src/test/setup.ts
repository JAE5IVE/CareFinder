import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  geolocation: {
    getCurrentPosition: vi.fn((_success, error) => error?.({ code: 1, message: 'denied' })),
  },
});

window.URL.createObjectURL = vi.fn(() => 'blob:carefinder');
window.URL.revokeObjectURL = vi.fn();
HTMLAnchorElement.prototype.click = vi.fn();
