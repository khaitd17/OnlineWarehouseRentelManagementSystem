import '@testing-library/jest-dom';

// Mock axios (ESM package) for Jest/CRA compatibility.
jest.mock('axios', () => {
  const createMockInstance = () => ({
    defaults: {},
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn()
      },
      response: {
        use: jest.fn(),
        eject: jest.fn()
      }
    },
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} }))
  });

  const mockAxios = {
    create: jest.fn(() => createMockInstance()),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} }))
  };

  return {
    __esModule: true,
    default: mockAxios,
    ...mockAxios
  };
});

// Mock SignalR for notification service tests.
jest.mock('@microsoft/signalr', () => {
  class MockHubConnection {
    constructor() {
      this.on = jest.fn();
      this.start = jest.fn(() => Promise.resolve());
      this.stop = jest.fn(() => Promise.resolve());
      this.onreconnecting = jest.fn();
      this.onreconnected = jest.fn();
      this.onclose = jest.fn();
    }
  }

  class MockHubConnectionBuilder {
    withUrl() {
      return this;
    }

    configureLogging() {
      return this;
    }

    withAutomaticReconnect() {
      return this;
    }

    build() {
      return new MockHubConnection();
    }
  }

  return {
    HubConnectionBuilder: MockHubConnectionBuilder,
    LogLevel: {
      Information: 'Information'
    }
  };
});

// Provide Notification API for jsdom tests.
if (typeof global.Notification === 'undefined') {
  class MockNotification {
    constructor() {
      this.close = jest.fn();
    }

    static permission = 'granted';

    static requestPermission = jest.fn(() => Promise.resolve('granted'));
  }

  global.Notification = MockNotification;
}
