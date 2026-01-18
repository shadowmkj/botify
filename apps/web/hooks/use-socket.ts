"use client";
import { useEffect, useReducer } from "react";
import { io } from "socket.io-client";

type State = {
    qrCode: string | null;
    status: string;
    profilePic: string;
};

const initialState: State = {
    qrCode: null,
    status: "Loading..",
    profilePic: "",
};

type ActionType = {
    type: string;
    qr?: string;
    profile?: string;
    [key: string]: unknown;
};

const reducer = (state: State, action: ActionType): State => {
    switch (action.type) {
        case "QR":
            return {
                ...state,
                qrCode: action.qr,
                profilePic: "",
                status: "QR code received",
            };
        case "OPEN":
            return {
                ...state,
                qrCode: null,
                profilePic: action.profile || "",
                status: "Connected",
            };
        case "LOGOUT":
            return {
                ...state,
                qrCode: null,
                profilePic: "",
                status: "Disconnected",
            };
        case "CONNECTING":
            return {
                ...state,
                qrCode: null,
                profilePic: "",
                status: "Connecting...",
            };
        default:
            return state;
    }
};

const useSocket = (sessionId: string) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        // Create socket connection with proper configuration
        const socketUrl =
            process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        
        const socket = io(socketUrl, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
        });

        dispatch({ type: "CONNECTING" });

        // Set up event listeners
        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            // Subscribe to QR updates after connection is established
            socket.emit("subscribe-to-qr", { sessionId });
        });

        socket.on("qr-update", (message: string) => {
            try {
                const data = JSON.parse(message);
                console.log("QR Update received:", data);
                dispatch({ type: data.event, ...data });
            } catch (error) {
                console.error("Error parsing QR update:", error);
            }
        });

        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
        });

        // Cleanup function - properly disconnect socket
        return () => {
            console.log("Cleaning up socket connection");
            socket.disconnect();
        };
    }, [sessionId]);

    return state;
};

export default useSocket;
