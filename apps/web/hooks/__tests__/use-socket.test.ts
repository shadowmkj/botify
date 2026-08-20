import { renderHook, act } from "@testing-library/react";
import useSocket from "@/hooks/use-socket";
import { io } from "socket.io-client";

jest.mock("socket.io-client", () => {
  const listeners: Record<string, Function[]> = {};
  const mockSocket = {
    id: "socket_123",
    on: jest.fn((event: string, cb: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    }),
    emit: jest.fn(),
    disconnect: jest.fn(),
    _trigger: (event: string, ...args: any[]) => {
      listeners[event]?.forEach((cb) => cb(...args));
    },
    _clear: () => {
      Object.keys(listeners).forEach((k) => delete listeners[k]);
    },
  };

  return {
    io: jest.fn(() => mockSocket),
    __mockSocket: mockSocket,
  };
});

describe("useSocket hook", () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = (require("socket.io-client") as any).__mockSocket;
    mockSocket._clear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
  });

  it("should initialize socket and subscribe to qr on connect", () => {
    const { result } = renderHook(() => useSocket("session_123"));

    expect(io).toHaveBeenCalled();
    expect(result.current.status).toBe("Connecting...");

    act(() => {
      mockSocket._trigger("connect");
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("subscribe-to-qr", {
      sessionId: "session_123",
    });
  });

  it("should handle QR update event", () => {
    const { result } = renderHook(() => useSocket("session_123"));

    act(() => {
      mockSocket._trigger(
        "qr-update",
        JSON.stringify({ event: "QR", qr: "qr_code_data" })
      );
    });

    expect(result.current.status).toBe("QR code received");
    expect(result.current.qrCode).toBe("qr_code_data");
  });

  it("should handle OPEN event (connected)", () => {
    const { result } = renderHook(() => useSocket("session_123"));

    act(() => {
      mockSocket._trigger(
        "qr-update",
        JSON.stringify({ event: "OPEN", profile: "http://example.com/pic.jpg" })
      );
    });

    expect(result.current.status).toBe("Connected");
    expect(result.current.profilePic).toBe("http://example.com/pic.jpg");
    expect(result.current.qrCode).toBeNull();
  });

  it("should handle LOGOUT event", () => {
    const { result } = renderHook(() => useSocket("session_123"));

    act(() => {
      mockSocket._trigger("qr-update", JSON.stringify({ event: "LOGOUT" }));
    });

    expect(result.current.status).toBe("Disconnected");
    expect(result.current.qrCode).toBeNull();
  });

  it("should handle disconnect and connect_error events", () => {
    renderHook(() => useSocket("session_123"));

    act(() => {
      mockSocket._trigger("disconnect", "io client disconnect");
      mockSocket._trigger("connect_error", new Error("Connection failed"));
      mockSocket._trigger("qr-update", "invalid-json");
    });
  });

  it("should disconnect socket on unmount", () => {
    const { unmount } = renderHook(() => useSocket("session_123"));
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
