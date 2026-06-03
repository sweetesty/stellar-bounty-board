import pino from "pino";

const logger = pino({ name: "frontend" });

export function logError(component: string, error: unknown) {
  if (error instanceof Error) {
    logger.error({ component, err: { message: error.message, stack: error.stack } }, "Component error");
  } else {
    logger.error({ component, err: String(error) }, "Component error");
  }
}

export default logger;
