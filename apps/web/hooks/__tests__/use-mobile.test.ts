import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

describe("useIsMobile hook", () => {
  let matchMediaListeners: Array<(e: { matches: boolean }) => void> = [];

  beforeEach(() => {
    matchMediaListeners = [];
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: window.innerWidth < 768,
        media: query,
        onchange: null,
        addEventListener: jest.fn((event, handler) => {
          matchMediaListeners.push(handler);
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it("should return false on desktop screens", () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("should return true on mobile screens", () => {
    window.innerWidth = 500;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("should update when window size changes", () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      window.innerWidth = 500;
      matchMediaListeners.forEach((listener) => listener({ matches: true }));
    });

    expect(result.current).toBe(true);
  });
});
