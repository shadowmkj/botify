import logger, { Logger } from "pino";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";

const log = logger({
    transport: {
        target: "pino-pretty",
    },
    enabled: process.env.NODE_ENV !== "production",
    base: {
        pid: false,
    },
    timestamp: () => `,"time":"${dayjs().format()}"`,
});

export const logToFile = ({ message }: { message: string }) => {
    const logFilePath = path.join(__dirname, "logs.txt");
    const logMessage = `${dayjs().format()}: ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
};

export default log;
