import Logger from "./Logger.js";

/**
 * SensaCollection class used to send data to and from the table.
 * 
 * @param {string[]} columns - array containing all the column names
 * @param {string} primaryKeyColumn - The primary key column that contains a unique value for each row in the collection
 * @param {object} options - Options object
 * @param {object} options.data - Import data object, key-value with key being the primary key and value array of each row.
 */
 export default class SensaCollection {
    constructor(columns, primaryKeyColumn, options) {

        this.defaultOptions = {
            data: {},
            lazy: true
        };

        this.logger = new Logger("SensaCollection");

        if (Array.isArray(columns) !== true) {
            this.logger.error("Headers must be a string[]");
            throw new TypeError("Headers must be a string[]");
        }

        if (typeof primaryKeyColumn === "undefined") {
            this.logger.error("primaryKeyColumn must be defined.");
            throw new TypeError("primaryKeyColumn must be defined.");
        }

        if (typeof options !== "undefined" && typeof options !== "object") {
            this.logger.error("Options is optional however must be an object. Found: " + typeof options);
            throw new TypeError("Data is optional however must be an object. Found: " + typeof options);
        }

        if (typeof options === "object" && typeof options.data !== "undefined" && typeof options.data !== "object") {
            this.logger.error("options.data is optional however must be an object. Found: " + typeof options.data);
            throw new TypeError("options.data is optional however must be an object. Found: " + typeof options.data);
        } 

        this.defaultOptions = Object.assign(this.defaultOptions, options);

        this.pk = primaryKeyColumn;
        this.headers = Object.assign([], columns);
        this.columns = this.headers;
        this._columnMap = {};

        // map headers to dict for quick lookup.
        for (let i = 0; i < this.columns.length; i++) {
            this._columnMap[this.columns[i]] = i;
        }

        this.data = Object.assign({}, this.defaultOptions.data);
        this._options = this.defaultOptions;
        delete this._options.data;
    }

    /**
     * Loads a SensaCollection object into the SensaCollection Class
     * 
     * @param {SensaCollection} sensacollection
     * 
     * @returns {SensaCollection} SensaCollection class representing the given object.
     */
    static load(sensacollection) {
        // For pre-existing scripts that are still converting.
        if (sensacollection instanceof SensaCollection) return sensacollection;

        return new SensaCollection(sensacollection.headers, sensacollection.pk, {data:sensacollection.data});
    }


    /**
     * Sets the column values for the SensaCollection.
     * 
     * @param {string[]} columns - Columns to set the SensaCollection. The array must have the same number of columns as the current SensaCollection.
     */ 
    setColumns(columns) {
        if (!Array.isArray(columns)) {
            throw new TypeError("Columns must be String[].");
        }

        if (columns.length !== this.columns.length) {
            throw new Error("Expected " + this.columns.length + "columns but found " + columns.length + ".");
        }

        this.columns = Object.assign([], columns);
        this.headers = Object.assign([], columns);

        // map headers to dict for quick lookup.
        this._columnMap = {};
        for (let i = 0; i < this.columns.length; i++) {
            this._columnMap[this.columns[i]] = i;
        }
    }


    /**
     * Adds a new column to the SensaCollection with the given default value.
     * 
     * @param {string} columnName - Name of the column to add
     * @param {string} [defaultValue=''] - The default value for the column. The default is an empty string ''
     */
    addColumn(columnName, defaultValue) {
        if (typeof defaultValue === "undefined") {
            defaultValue = "";
        }

        if (typeof columnName !== "string") {
            throw new TypeError("columnName must be a string, found '" + typeof columnName + "' instead.");
        }

        if (this.columns.indexOf(columnName) !== -1) {
            throw new TypeError("'" + columnName + "' already exists in the SensaCollection.");
        }

        this.columns.push(columnName);
        this._columnMap[columnName] = this.columns.length;

        let keys = Object.keys(this.data);
        for (let i = 0; i < keys.length; i++) {
            this.data[keys[i]].push(defaultValue);
        }

    }

    /**
     * Removes a column in the SensaCollection.
     * 
     * @param {string} originalColumnName - The name of the column to rename.
     * @param {string} newColumnName - The new name of the column.
     */ 
    renameColumn(originalColumnName, newColumnName) {
        if (typeof originalColumnName !== "string") {
            return false
        }

        if (typeof newColumnName !== "string") {
            return false
        }

        if (this.columns.indexOf(originalColumnName) === -1) {
            return false
        }

        if (this.columns.indexOf(newColumnName) !== -1) {
            return false
        }

        this.columns[this._columnMap[originalColumnName]] = newColumnName;
        this._columnMap[newColumnName] = this._columnMap[originalColumnName];
        delete this._columnMap[originalColumnName];

        return true;
    }

    /**
     * Adds a new row to the SensaCollection
     * 
     * @param {object} dataObj, Key-value pair with each key representing the associated column. The row primary key must be present.
     */
    add(dataObj) {
        if (typeof dataObj !== "object") {
            this.logger.error("dataObj must be an object. Found " + typeof dataObj + ".");
            throw new TypeError("dataObj must be an object. Found " + typeof dataObj + ".");
        }

        if (this.columns.length !== Object.keys(dataObj).length) {
            this.logger.error("dataObj data must be the same number items as the collection columns. Columns is of length " + this.columns.length + " but found " + Object.keys(dataObj).length + ".");
            throw new TypeError("dataObj data must be the same number of items as the columns. Columns is of length " + this.columns.length + " but found " + Object.keys(dataObj).length + ".");
        }

        if (typeof dataObj[this.pk] === undefined) {
            this.logger.error("Primary key column could not be found in the row data.");
            throw new TypeError("Primary key column could not be found in the row data.");
        } 

        let primaryKey = dataObj[this.pk];
        let dataArray = Object.keys(dataObj);

        this.data[primaryKey] = Object.assign([], dataArray);

        this.set(dataObj);

    }


    /**
     * Removes a row from the SensaCollection;
     * @param {any} primaryKey, the primary key of the row you want to remove.
     * 
     * @returns {boolean} returns true of the item is successfully removed from the SensaCollection, False otherwise.
     */
    remove (primaryKey) {
        if (this.data[primaryKey]) {
            delete this.data[primaryKey];
            return true;
        }
        return false;
    }


    /**
     * Reduces the SensaCollection by columnns and rows. The new filtered SensaCollection is then returned.
     * 
     * @param {any} columns, The columns of the new SensaCollection, all missing columns will be removed.
     * @param {array} [rowKeys=*] Option array containing all the rows that you would like to keep. Otherwise all rows will be kept.
     * 
     * @returns {SensaCollection} Collection containing the filtered results.
     */
    filter(columns, primaryKeys) {
        if (!Array.isArray(columns)) {
            this.logger.error("Columns must be an array. Found " + typeof columns + ".");
            throw new TypeError("Columns must be an array. Found " + typeof columns + ".");
        }

        if (columns === this.columns && typeof primaryKeys === "undefined")
            return this;

        // Check that column items are actually in the array.
        let valid = [];
        let indexes  = [];
        for (let i in columns) {
            let value = columns[i];
            if (this.columns.indexOf(value) === -1) {
                this.logger.warn("Columns '" + value + "' could not be found in the SensorCollection.");               
            } else {
                valid.push(value);
                indexes.push(this.columns.indexOf(value));
            }
        };

        let data = {}

        if (primaryKeys === undefined) {
            primaryKeys = Object.keys(this.data);
        }

        for (let i in primaryKeys){
            let key = primaryKeys[i];
            let row = this.data[key];
            let resultArr = indexes.map(function (i) {
                return row[i];
            });
            data[key] = resultArr;
        };

        return new SensaCollection(valid, this.pk, {data:data});
    }

    /**
     * Function that receives the record as a column-value pair and primary key as paramaters. If the function returns true the row is added to the returned collection.
     * @callback queryCallback
     * @param {string} record
     * @param {string} pk
     */

    /**
     * Query the SensaCollection.
     * 
     * @param {queryCallback} callback
     * 
     * @returns {sensacollection} Contains all rows that returned true in the callback.
     */
    query(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("callback must of type 'function'. Found '" + typeof callback + "'.");
        }

        let returnCollection = new SensaCollection(this.columns, this.pk);

        this.forEach(function(record, pk) {
            if (callback(record, pk) === true) {
                returnCollection.add(record);
            }   
        });
        return returnCollection;
    }


    /**
     * Returns the row and column values for a given primary key.
     * 
     * @param {string} primaryKey - Primary key of the row to reteive.
     * @param {string} [column=*] If a column is specified, the specific column value for the row is return.
     * 
     * @returns {any} Returns a key-value object where the keys represent the columns. If the column parameter is used the column value is returned. If the primary key does not exist then null is returned.
     */
    get(primaryKey, column) {

        if (typeof primaryKey !== "string") {
            this.logger.error("primaryKey must be of type 'string'. Found '" + typeof primaryKey + "'.");
            throw new TypeError("primaryKey must be of type 'string'. Found '" + typeof primaryKey + "'.");
        }

        let row = this.data[primaryKey]
        if (row === undefined) {
            return null;
        }

        if (typeof column === "string") {
            let index = this._columnMap[column];
            if (typeof index === "undefined") {
                return null;
            }
            return row[index];
        }

        let retObj = {};
        for (let i = 0; i < this.columns.length; i++) {
            retObj[this.columns[i]] = row[i];
        }

        return retObj;
    }

    
    /**
     * Returns an array of all the columns values.
     * 
     * @param {string} column - Column to return
     * 
     * @returns {array} - Array of all the values in the column. Null If the column does not exist.
     */
    getColumn (column) {
        if (this.columns.indexOf(column) === -1) {
            return null
        }

        let results = [];

        this.forEach(function(row) {
            results.push(row[column]);
        });
        return results;
    }


    /**
     * Returns the first item in the SensaCollection
     * 
     * @returns {object} Returns an object with keys representing columns, and values the row value.
     */
    getFirst() {
        let keys = Object.keys(this.data);

        if (keys.length === 0) {
            return null;
        }

        let firstRow = this.data[Object.keys(this.data)[0]];

        // Create object
        let retObj = {};
        for (let i = 0; i < this.columns.length; i++) {
            retObj[this.columns[i]] = firstRow[i];
        }

        return retObj;
    }

    /**
     * Sets the value for given row and column.
     * 
     * @param {string} primaryKey - The primary key associated with the row.
     * @param {object} dataObj - Key-Value pair containing the column names and values. dataObj must contain the row's primary key.
     */
    set(dataObj) {
        if (typeof dataObj[this.pk] === undefined) {
            this.logger.error("Primary key column could not be found in the row data.");
            throw new TypeError("Primary key column could not be found in the row data.");
        } 

        if (typeof dataObj !== "object") {
            this.logger.error("dataObj must be of type 'object'. Found '" + typeof dataObj + "'.");
            throw new TypeError("dataObj must be of type 'object'. Found '" + typeof dataObj + "'.");
        }

        let primaryKey = dataObj[this.pk];

        // iterate over each item in collection and update.
        let keys = Object.keys(dataObj);
        for (let i = 0; i < keys.length; i++) {
            let column = keys[i];
            let value = dataObj[column];

            // Check type.
            if (typeof value !== "string" && typeof value !== "number") {
                throw new TypeError("All SensaCollection entries must be either a number or string. " + column + " is of type " + typeof value);
            }

            let index = this.columns.indexOf(column);
            if (index === -1) {
                throw new TypeError("Column '" + column + "' does not exist in the SensaCollection.");
            }

            let row = this.data[primaryKey];
            if (row === undefined) {
                throw new TypeError("Primary key '" + primaryKey + "' does not exist in the SensaCollection.");
            }

            row[index] = value;
        }

    }


    /**
     * Merges two SensaCollections together. Both collections must have the same primary key. 
     * Additional columns will be added if collection contains additional columns. 
     * Collection values will overwrite the current values. If this is unwanted behaviour consider using the filter function first.
     * 
     * @param {SensaCollection} collection - Collection to merge
     * 
     * @returns {SensaCollection} A new SensaCollection containing the merged data is returned.
     */
    merge(collection) {
        if (!(collection instanceof SensaCollection)) {
            throw new TypeError("Invalid input type. Expected a SensaCollection.");
        }

        if (this.pk !== collection.pk) {
            throw new Error("Both collections must have the same primary keys.");
        }

        // Add columns that do not exist already.
        let differenceColumns = difference(new Set(collection.columns), new Set(this.columns));
        let differenceColumnsInverse = difference(new Set(this.columns), new Set(collection.columns));

        // Convert set to array es5 style
        let diffArray = [];
        differenceColumns.forEach(function (value) {
            diffArray.push(value);
        })

        let diffArrayInverse = [];
        differenceColumnsInverse.forEach(function (value) {
            diffArrayInverse.push(value);
        });

        let newCollection = new SensaCollection(this.headers, this.pk, {data: this.data});

        // Add additional columns
        for (let i = 0; i < diffArray.length; i++) {
            let column = diffArray[i];
            newCollection.addColumn(column, "");
        }

        // Merge new data over.
        collection.forEach(function (value, pk) {
            if (newCollection.has(pk)) {
                newCollection.set(value);
            } else {
                for (let i = 0; i < diffArrayInverse.length; i++) {
                    value[diffArrayInverse[i]] = "";                    
                }

                newCollection.add(value);
            }
        });

        return newCollection;
    }


    /**
     * Checks if a row exists in the SensaCollection
     * @param {string} primaryKey - Primary key of the row.
     * 
     * @returns {boolean} true if it exists, false otherwise.
     * 
     */
    has(primaryKey) {
        if (typeof this.data[primaryKey] !== "undefined") {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns all row primary keys in the SensaCollection.
     * 
     * @returns {string[]} - Array of row keys.
     */
    keys() {
        return Object.keys(this.data);
    }


    /**
     * Returns all the primary keys are not in or are different from the original collection.
     * 
     * @param {SensaCollection} otherCollection - Collection to check the difference against.
     * 
     * @returns {SensaCollection} - returns an array of all the primary keys that need to be added or updated.
     */
    difference(otherCollection) {
        if (!(otherCollection instanceof SensaCollection)) {
            this.logger.error('Could not calculate difference in SensaCollections. otherCollection must be a SensaCollection class.');
            throw new TypeError('Could not calculate difference in SensaCollections. otherCollection must be a SensaCollection class.');
        }

        // Similar columns
        let col1 = new Set(this.columns);
        let col2 = new Set(otherCollection.headers);

        let sameHeaders = intersection(col1, col2); 
        let compareCollection = this.filter(sameHeaders);
        otherCollection = otherCollection.filter(sameHeaders);

        let set2 = new Set(Object.keys(otherCollection.data));
        let set1 = new Set(Object.keys(this.data));
        
        let checkSet = new Set();
        let updateArray = [];
        set2.forEach(function(item) {
            if (set1.has(item)) {
                checkSet.add(item);
            } else {
                updateArray.push(item);
            }
        });

        let newCol = new SensaCollection(sameHeaders, otherCollection.pk);

        // Check if arrays are different.
        checkSet.forEach(function(item) {
            let origRow = compareCollection.get(item);
            let row2 = otherCollection.get(item);
            if (JSON.stringify(origRow) !== JSON.stringify(row2)) {
                // Difference - Needs to be updated.
                newCol.add(row2);
            }
        });

        updateArray.forEach(function(item) {
            newCol.add(otherCollection.get(item));
        });

        return newCol;
    }



    /**
     * For Each function for the SensaCollection to iterate over the rows in a SensaCollection. The callback provides 2 letiables:
     *  - 1. A key-value pair with the keys representing the columns
     *  - 2. The row primary key
     *  
     * @param {any} callbackFn - The function that is called for each row in the SensaCollection.

     */
    forEach(callbackFn) {

        if (typeof callbackFn !== "function") {
            this.logger.error("Expected a callback function but found '" + typeof callbackFn + "'.");
            throw new TypeError("Expected a callback function but found '" + typeof callbackFn + "'.");
        }

        let dataKeys = Object.keys(this.data);

        for (let i in dataKeys) {
            let key = dataKeys[i];
            let row = this.data[key];
            // Map headers to row object.
            let result = {};
            this.columns.forEach(function (key, i) {
                return result[key] = row[i];
            });

            try {
                callbackFn(result, key);
            } catch(err) {
                this.logger.error("Error executing SensaCollection forEach function. " + err.message);
                throw err;
            }
        }
    }

    /**
     * Returns the number of rows in the SensaCollection.
     * 
     * @returns {number} Number of rows.
     */
    size() {
        return Object.keys(this.data).length;
    }

    /**
     * Exports a stripped down object of the SensaCollection ideal for sending to the server.
     * 
     * @returns {object} Object containing only the necessary items required for a SensaCollection.
     */
    export() {
        return {
            headers: this.columns,
            pk: this.pk,
            data: this.data
        };
    }


    /**
     * Returns a clone of the current SensaCollection without any references.
     */
    clone () {
        return new SensaCollection(this.columns, this.pk, { data: JSON.parse(JSON.stringify(this.data)) });
    }

    /**
     * Exports a csv string  of the SensaCollectio n
     * 
     * @returns {string} - Formatted string
     */
    toCSV() {
        let csv = [];

        // Add headers
        let row = this.columns
        csv.push(row.join(","));

        // Get rows
        let keys = Object.keys(collection.data);
        for (let i = 0; i < keys.length; i++) {
            row = this.data[keys[i]]
            csv.push(row.join(","))
        }

        return csv.join("\n");
    }
}


/* Basic Set operations */

/**
 * 
 * @param {Set} set
 * @param {Set} subset
 * 
 * @returns {Set}
 */
function isSuperset(set, subset) {
    for (let elem of subset) {
        if (!set.has(elem)) {
            return false
        }
    }
    return true
}


/**
 * Returns the union of two sets.
 * 
 * @param {Set} setA
 * @param {Set} setB
 *
 * @example
 *   let setA = new Set([1, 2, 3, 4])
 *   let setB = new Set([3, 4, 5, 6])
 *   union(setA, setB) // => Set [1, 2, 3, 4, 5, 6]
 *
 * @returns {Set}
 */
function union(setA, setB) {
    let _union = new Set(setA)
    for (let elem of setB) {
        _union.add(elem)
    }
    return _union
}


/**
 * Returns the intersecting items between two sets.
 * 
 * @param {any} setA
 * @param {any} setB
 * 
 * @example
 *   let setA = new Set([1, 2, 3, 4])
 *   let setB = new Set([3, 4, 5, 6])
 *   intersection(setA, setB) // => Set [3, 4]
 *   
 * @returns {array}
 */
function intersection(setA, setB) {
    let _intersection = []
    for (let elem of setB) {
        if (setA.has(elem)) {
            _intersection.push(elem)
        }
    }
    return _intersection;
}


/**
 * Returns the elements missing from either set.
 * 
 * @param {Set} setA
 * @param {Set} setB
 * 
 * @example
 *   let setA = new Set([1, 2, 3, 4])
 *   let setB = new Set([3, 4, 5, 6])
 *   symmetricDifference(setA, setB) // => Set [1, 2, 5, 6]
 *   
 * @returns {Set}
 */
function symmetricDifference(setA, setB) {
    let _difference = new Set(setA)
    for (let elem of setB) {
        if (_difference.has(elem)) {
            _difference.delete(elem)
        } else {
            _difference.add(elem)
        }
    }
    return _difference
}

/**
 * Returns the elements in setA that setB does not have.
 * 
 * @param {Set} setA
 * @param {Set} setB
 * 
 * @example
 *   let setA = new Set([1, 2, 3, 4])
 *   let setB = new Set([3, 4, 5, 6])
 *   difference(setA, setB) // => Set [1, 2]
 *   
 * @returns {Set}
 */
function difference(setA, setB) {
    let _difference = new Set(setA)
    for (let elem of setB) {
        _difference.delete(elem)
    }
    return _difference
}