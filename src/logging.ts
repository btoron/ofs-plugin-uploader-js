// Created to isolate the logging module used by the application

import * as winston from "winston";

export class Logger {
    static _instance: Logger;
    _logger: winston.Logger;
    constructor() {
        console.error("Creating logger");
        this._logger = Logger.buildLogger();
    }

    static buildLogger(): winston.Logger {
        let _logger = winston.createLogger({
            level: "info",
            format: winston.format.combine(
                winston.format.label({ label: "worker" }),
                winston.format.timestamp({
                    format: "HH-MM:ss YYYY-MM-DD",
                })
            ),
            defaultMeta: { service: "user-service" },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(
                            (info) =>
                                `${info.timestamp} ${info.level}: ${info.message}`
                        )
                    ),
                }),
            ],
        });
        return _logger;
    }
}

export var defaultLogger = Logger.buildLogger();
