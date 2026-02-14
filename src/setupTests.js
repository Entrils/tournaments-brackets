import '@testing-library/jest-dom';

const originalConsoleError = console.error.bind(console);

beforeAll(() => {
  console.error = (...args) => {
    const [firstArg] = args;
    const message = String(firstArg || "");

    if (/ReactDOMTestUtils\.act.*deprecated.*React\.act/i.test(message)) {
      return;
    }

    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
