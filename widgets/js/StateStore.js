import Logger from "./Logger.js";
import SensaCollection from "./SensaCollection.js";

// Observable design pattern.
export default class StateStore {
	constructor(location, name) {
		this.handlers = {};
		this.values = {};
		this.persist = {};
		this.logger = new Logger(name ?? location);
		this.location = location;
		this.setQueue = [];

		if (typeof location === "string" && window.localStorage.getItem(location) !== null) {
			// If exists, load
			var data = window.localStorage.getItem(location);
			this.persist = JSON.parse(data);
			this.values = JSON.parse(data);
		}
	}

	subscribe(channel, fn, important) {
		if (this.handlers[channel] === undefined) {
			this.handlers[channel] = [];
		}

		if (important === "true") {
			this.handlers[channel].unshift(fn);
		} else {
			this.handlers[channel].push(fn);
		}

		return this.get(channel);
	}

	unsubscribe(channel, fn) {
		if (!(channel in this.handlers)) return;
		this.handlers[channel] = this.handlers[channel].filter(function (item) {
			if (item !== fn) {
				return item;
			}
		});
	}

	clearSubscriptions() {
		this.handlers = {};
	}

	clearStateStore() {
		this.values = {};
		this.handlers = {};
		this.persist = {};
		if (typeof this.location === "string" || this.location instanceof String) {
			window.localStorage.removeItem(this.location);
		}
	}

	fire(channel, value) {
        if (this.handlers[channel] === undefined) {
            return;
        }

        this.logger.info(`Firing event ${channel} with value '${value}' to ${this.handlers[channel].length} subscribers.`);

        this.handlers[channel].forEach((item) => {
            // Inlcuded an Object.assign() polyfill for IE compatibility
            // Have to use Object.assign to handle all types of variables;
            var cloneValue = value;
            if (value.value instanceof SensaCollection) {
                cloneValue = Object.assign({}, value);
                cloneValue.value = value.value.clone();
            } else if (typeof value === "object") {
                cloneValue = Object.assign({}, value);
            }

            if (typeof item !== "function") {
                this.logger.warn(`Function not found for channel ${channel}. A widget's client event API has changed. Please reselect and save the widget's events.`);
                return;
            }

            try {
                item(value);
            } catch (err) {
                this.logger.error(`Function through an error when firing an event for the channel ${channel}.`);
                this.logger.error(err.stack);
            }
        });
	}

	publish(channel, value, persist) {
		if (persist !== undefined && persist === false) {
			this.fire(channel, value);
		} else {
			this.set(channel, value, false);
		}
	}

	_set(channel, value, persist) {
		this.values[channel] = value;
		// If persist save to localStorage.
		try {
			if (typeof persist === "boolean" && persist === true) {
				this.persist[channel] = value;
				window.localStorage.setItem(this.location, JSON.stringify(this.persist));
			}
		} catch (err) {
			this.logger.warn("Unable to save value '" + value + "' for channel '" + channel + "' to localStorage.");
		}

		this.fire(channel, value);
	}

	set(channel, value, persist) {
		this.setQueue.push([channel, value, persist]);
		while (this.setQueue.length > 0) {
			var setArgs = this.setQueue.shift();
			this._set(setArgs[0], setArgs[1], setArgs[2]);
		}
	}

	get(channel) {
		return this.values[channel];
	}

	remove(channel) {
		var val = undefined;
		if (typeof channel !== "string") {
			throw new TypeError("Channel should be of type 'string', found '" + typeof channel + "'.");
		}

		if (this.values[channel]) {
			val = this.values[channel];
			delete this.values[channel];
		} else {
			return null;
		}

		if (this.persist[channel]) {
			delete this.persist[channel];
			window.localStorage.setItem(this.location, JSON.stringify(this.persist));
		}

		if (this.handlers[channel]) {
			delete this.handlers[channel];
		}
		return val;
	}

	/**
	 * Check if SensaCollection is the correct structure.
	 *
	 * @param {SensaCollection} sensaCollection - Collection to check.
	 *
	 * @return {number} returns the error code, 0 if successful.
	 *      0 - Is valid
	 *      1 - Sensacollection variable must be of type object.
	 *      2 - Sensacollection variable can't be null/undefined.
	 *      3 - Sensacollection structure is invalid. Headers, pk, or data attributes could not be found.
	 *      4 - Sensacollection strucuture has invalid types, header must be a string[], pk must a string, data must be an object.
	 *      5 - Primary key not found or is not a string.
	 *      6 - Invalid row type. SensaData must be an array.
	 *      7 - Record key required as it is in the header but not found in a record.
	 */
	_isValidSensaCollection(sensaCollection) {
		// Check input types
		if (typeof sensaCollection !== "object") {
			return 1;
		}

		if (!sensaCollection) {
			return 2;
		}

		// Sensacollection requirements and types.
		var required = {
			headers: "array",
			pk: "string",
			data: "object",
		};

		var keys = Object.keys(required);

		// Loop over required keys and check that they are present.
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var value = sensaCollection[key];
			// Check if key is in required
			if (value === null) {
				return 3;
			}
			// Check type
			if (typeof value !== required[key] && Array.isArray(value) && key !== "headers") {
				return 4;
			}
		}

		// Check the pk is valid
		var pkCol = true;
		if (typeof sensaCollection.pk !== "string") {
			return 5;
		}
		var pkIndex = sensaCollection.headers.indexOf(sensaCollection.pk);
		if (pkIndex === -1) {
			this.logger.verbose("Primary column key has not been included.");
			pkCol = false;
		}

		// Check data structure.
		var data = sensaCollection.data;
		var dataKeys = Object.keys(data);

		// Loop over ever record in .data and check that the primary key is correct and data is an array.
		for (var i = 0; i < dataKeys.length && pkCol; i++) {
			var key = dataKeys[i];
			if (!Array.isArray(data[key])) {
				return 6;
			}

			if (data[key][pkIndex] !== key) {
				return 7;
			}
		}

		return 0;
	};
}
