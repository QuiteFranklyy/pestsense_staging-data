/**
 * @file Manages the Log API that can be used throughout the system.
 *
 * @author Daniel Gormly
 */

/**
 * Main Logging Class.
 * 
 * @param {string} source - Source/name of the logger.
 */
 export default class Logger {

    constructor (source) {
        if (typeof source !== "string") {
            throw new TypeError("Expected type to be a string. Found: " + typeof source);
        }

        this.source = source
    }

    _messageFormatter(messageObj) {
        return `${messageObj.timestamp.toLocaleTimeString('en-AU')} [${messageObj.source}] \t ${messageObj.level.toUpperCase()} ${messageObj.message}`
    }

    info(message) {
        console.log(this._messageFormatter({
            level: "INFO",
            source: this.source,
            message: message,
            timestamp: new Date()
        }));
    }

    verbose(message) {
        console.debug(this._messageFormatter({
            level: "VERBOSE",
            source: this.source,
            message: message,
            timestamp: new Date()
        }));
    }

    warn(message) {
        console.warn(this._messageFormatter({
            level: "WARN",
            source: this.source,
            message: message,
            timestamp: new Date()
        }));
    }

    error(message) {
        console.error(this._messageFormatter({
            level: "ERROR",
            source: this.source,
            message: message,
            timestamp: new Date()
        }));
    }
}