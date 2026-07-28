import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

const logDir = path.join(__dirname, "../../logs");

// Custom format cho log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    let log = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    
    // Thêm metadata nếu có
    if (Object.keys(metadata).length > 0) {
      log += `\n${JSON.stringify(metadata, null, 2)}`;
    }
    
    // Thêm stack trace nếu có error
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Transport cho rotate logs theo ngày
const dailyRotateTransport = new DailyRotateFile({
  dirname: logDir,
  filename: "bot-service-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxSize: "20m",
  maxFiles: "7d", // Xóa log sau 7 ngày
  format: logFormat,
});

// Transport cho error logs riêng
const errorRotateTransport = new DailyRotateFile({
  dirname: logDir,
  filename: "error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxSize: "20m",
  maxFiles: "7d",
  level: "error",
  format: logFormat,
});

// Tạo logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: [
    dailyRotateTransport,
    errorRotateTransport,
    // Console transport cho development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      ),
    }),
  ],
});

// Telegram webhook logger với context
export const telegramLogger = {
  info: (message: string, data?: any) => {
    logger.info(`[Telegram] ${message}`, data || {});
  },
  error: (message: string, error?: any) => {
    logger.error(`[Telegram] ${message}`, error || {});
  },
  warn: (message: string, data?: any) => {
    logger.warn(`[Telegram] ${message}`, data || {});
  },
  debug: (message: string, data?: any) => {
    logger.debug(`[Telegram] ${message}`, data || {});
  },
};

export default logger;
