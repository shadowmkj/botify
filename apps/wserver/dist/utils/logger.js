"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logToFile = void 0;
const pino_1 = __importDefault(require("pino"));
const dayjs_1 = __importDefault(require("dayjs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const log = (0, pino_1.default)({
    transport: {
        target: "pino-pretty",
    },
    enabled: process.env.NODE_ENV !== "production",
    base: {
        pid: false,
    },
    timestamp: () => `,"time":"${(0, dayjs_1.default)().format()}"`,
});
const logToFile = ({ message }) => {
    const logFilePath = path_1.default.join(__dirname, "logs.txt");
    const logMessage = `${(0, dayjs_1.default)().format()}: ${message}\n`;
    fs_1.default.appendFileSync(logFilePath, logMessage);
};
exports.logToFile = logToFile;
exports.default = log;
