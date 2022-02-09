////////////// Sensahub utilities.js miscellaneous utilities used in various places
//source: https://gist.github.com/bgrins/6194623
// Detecting data URLs
// data URI - MDN https://developer.mozilla.org/en-US/docs/data_URIs
// The "data" URL scheme: http://tools.ietf.org/html/rfc2397
// Valid URL Characters: http://tools.ietf.org/html/rfc2396#section2
function isDataURL(s) {
    return !!s.match(isDataURL.regex);
}
isDataURL.regex = /^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/ig

// Capitalise the first word in a sentence
// TODO if this is used for UI it should be used using the CSS capitalize
function capFirstLetter(str) {
    var usrArr = str.split(" ").map(function (arr) {
        return arr.charAt(0).toUpperCase() + arr.slice(1);                                                                  // Convert string to upper case first character in word
    });
    return usrArr.join(" ");
}

/**
 * Checks if any screen events have been registered for the screen to run on change.
 * 
 * @param {object} widgets, All dashboard widgets.
 * @param {string} screenName, Current screen name.
 */
function checkScreenEvents(widgets , screenName) {
    // Fire change screen event first. If all true, change;
    // Loop over all widgets for widgets on the current screen that are a script.
    // Run, if returns false, do not change screen.
    for (var widget in widgets) {
        var wObject = widgets[widget];
        if (wObject.screen.toLowerCase() === screenName.toLowerCase()) {
            if (wObject.type.toLowerCase() === "scripting"
                && typeof wObject.defView !== "undefined" // May not have loaded yet
                && typeof wObject.defView.screenChangeEvent === "function") {
                if (!wObject.defView.screenChangeEvent()) {
                    return false;;
                }
            }
        }
    }

    return true;
}

// Efficient Queue function (more efficient than shift/push for larger queues)
function Queue() {
    var q = [];
    var off = 0;

    this.getLen = function () {
        return (q.length - off);
    }

    this.add = function (val) {
        q.push(val);
    }

    this.remove = function () {
        if (q.length === 0) {
            return undefined;
        }

        // Add to front
        var entry = q[off];                  
        if (++off * 2 >= q.length) {
            // Adjust Q to save space
            q = q.slice(off);           
            off = 0;
        }
        return entry;
    }
}

/**
 * Takes in a string url for the respective and returns a dictionary of the values.
 *
 * Example: urlString = dashboard.html?dashboard-hello=world&world=hello?3235
 * Output:
 *          { 'hello': 'world', 'world': 'hello' }
 */
var parseURL = function (urlString) {

    var params = urlString.split("?");

    // No params found.
    if (params.length === 1) {
        return null;
    }

    // Remove debug from the end.
    //params = params[1].split('?');
    var values = params[1];
    var attribs = values.split('&');
    var kv = {};
    for (var i = 0; i < attribs.length; i++) {
        var vals = attribs[i].split('=');
        // Check for debug and breaking case.
        if (vals.length < 2)
            continue;

        var k = vals[0];
        var v = vals[1];
        kv[k] = v;
    }
    return kv;
};

// check that this is used
function selectText(node) {
    node = document.getElementById(node);

    var range;
    if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(node);
        range.select();
    } else if (window.getSelection) {
        var selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        console.warn("Could not select text in node: Unsupported browser.");
    }
}

function dynamicallyLoadScript(url, loadEvent, async) {
    // Make a script DOM node
    var script = document.createElement("script");  
    // Set it's src to the provided URL
    script.src = url; 
    script.async = async ?? false;
    if (loadEvent) {
        script.onreadystatechange= function () {
            if (this.readyState === "complete") loadEvent();
        }
        script.onload = loadEvent;
    }

    // Add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)
    document.head.appendChild(script);  
}


async function dynamicallyLoadScriptAsync(url, async) {
    return new Promise(function(myResolve, myReject) {
        // Make a script DOM node
        var script = document.createElement("script");  
        // Set it's src to the provided URL
        script.src = url; 
        script.async = async ?? false;
        script.onload = myResolve;
        script.onerror = myReject;
        // Add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)
        document.head.appendChild(script);  
    });
}



function dynamicallyLoadCSS(url, loadEvent, async) {
    var style = document.createElement("link"); // Make a script DOM node

    style.href = url; // Set it's src to the provided URL
    style.rel = "stylesheet";
    style.async = async ?? false;
    if (loadEvent) {
        style.onreadystatechange= function () {
            if (this.readyState === "complete") loadEvent();
        }
        style.onload = loadEvent;
    }
    document.head.appendChild(style); // Add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)
}

/**
 *  Test for URL, returns true / false
 * @param {any} string
 */
function isURL(string) {
    return string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g) === null ? false : true;
}


/**
 * @author Elijah Blowes
 * @description Used to update the state of the various dependencies for compiling markdown
 * to HTML.
 * @param {String} dependency
 */
function markdownDependeciesState(dependency) {
    if (dependency === "remarkable") {
        parent.stateStore.set("remarkable", true);
    }
    if (dependency === "highlight") {
        parent.stateStore.set("highlight", true);
    }
    if (dependency === "highlightStyle") {
        parent.stateStore.set("highlightStyle", true);
    }

    if (dependency === "helpStylesheet") {
        parent.stateStore.set("helpStylesheet", true);
    }

    if (
        parent.stateStore.get("highlight") &&
        parent.stateStore.get("highlightStyle") &&
        parent.stateStore.get("remarkable") &&
        parent.stateStore.get("helpStylesheet")
    ) {
        parent.stateStore.set("markdownDependencies", true);
    }
}

/**
 * @author Elijah Blowes
 * @param {String} string
 * @param {HTMLDocument} document
 */
function isScriptLoaded(string, document) {
    for (var i = 0; i < document.scripts.length; i++) {
        if (document.scripts[i].src === window.location.origin + "/" + string) {
            return true;
        }
    }
    return false;
}

/**
 * @author Elijah Blowes
 * @param {String} string
 * @param {HTMLDocument} document
 */
function isStyleSheetLoaded(string, document) {
    for (var i = 0; i < document.styleSheets.length; i++) {
        if (document.styleSheets[i].href === window.location.origin + "/" + string) {
            return true;
        }
    }
    return false;
}

/**
 * @author Elijah Blowes
 * @description Dynamically loads all dependencies for compiling markdown to html
 */
function dynamicallyLoadMarkdownDependencies() {

    // Need to add check to make sure all files aren't being double loaded.

    var remarkableLib = "js/remarkable/remarkable.min.js";
    var highlightLib = "js/highlight/highlight.pack.js";
    var highlightStylesheet = "css/highlight/sensahub.css";
    var helpStylesheet = "css/help.min.css";

    // Markdown parser and renderer for widget help files. Source URL: https://github.com/jonschlinkert/remarkable
    if (!isScriptLoaded(remarkableLib, document)) {
        dynamicallyLoadScript(remarkableLib + parent.sess.debugURL, function () {
            markdownDependeciesState("remarkable");
        });
    } else {
        markdownDependeciesState("remarkable");
    }
    // Markdown highlighter. https://highlightjs.org/
    if (!isScriptLoaded(highlightLib, document)) {
        dynamicallyLoadScript(highlightLib + parent.sess.debugURL, function () {
            markdownDependeciesState("highlight");
        });
    } else {
        markdownDependeciesState("highlight");
    }

    // default syntax highlighting supplied by https://highlightjs.org/
    if (!isStyleSheetLoaded(highlightStylesheet, parent.document)) {
        parent.dynamicallyLoadCSS(highlightStylesheet + parent.sess.debugURL, function () {
            markdownDependeciesState("highlightStyle");
        });
    } else {
        markdownDependeciesState("highlightStyle");
    }

    if (!isStyleSheetLoaded(helpStylesheet, parent.document)) {
        parent.dynamicallyLoadCSS(helpStylesheet + parent.sess.debugURL, function () {
            markdownDependeciesState("helpStylesheet");
        })
    }
}

/**
 * @author Elijah Blowes
 * @description Creates a new FileReader object used to read in a blob file as text. Optional param 'callback' is set to be called on the onload event.
 * @param {Blob} blob
 * @param {Function} callback
 * @returns {FileReader} The file reader used to read in the Blob.
 */
function readBlobAsText(blob, callback) {
    // TODO Add error checking
    var reader = new FileReader();
    reader.onload = callback;
    reader.readAsText(blob);
    return reader;
}

/**
 * @author Elijah Blowes
 * @description Used to convert a string in markdown format to a html file format.
 * @param {String} string
 * @returns {String} returns a HTML formatted string
 */
function parseToMarkdown(string) {
    var md = new remarkable.Remarkable({
        html: true,
        typographer: true,
    });
    // highlighting library uses ES6 so need to do a browser check first.
    // window.document.documentMode is only used in IE
    if (!window.document.documentMode) {
        // This code comes directly from https://github.com/jonschlinkert/remarkable
        // Might want to implement our own highlighting function
        md.highlight = function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(lang, str).value;
                } catch (err) { }
            }
            try {
                return hljs.highlightAuto(str).value;
            } catch (err) { }

            return ''; // use external default escaping
        }
    }
    return md.render(string);
}

/**
 * @author Elijah Blowes
 * @description Used to parse a blob file to HTML depending on the Blob type.
 * This is mainly used for the help documents but can be expanded for other uses.
 * @param {any} blob
 */
function parseBlob(blob, callback) {
    switch (blob.type) {
        case "text/markdown":
            if (!parent.stateStore.get("markdownDependencies")) {
                dynamicallyLoadMarkdownDependencies();
                parent.stateStore.subscribe("markdownDependencies", function () {
                    readBlobAsText(blob, callback);
                });
            } else {
                readBlobAsText(blob, callback);
            }
            break;
        case "text/plain":
        case "text/html":
            readBlobAsText(blob, function (e) {
                displayHelpHtml(e.target.result);
            });
            break;
        default:
            console.log("Unkown Blob type.");
            break;
    }
}

/**
 * @author Elijah Blowes
 * @description Proccesses a XMLHttpRequest.
 * If the status is "OK" proceed by calling param 'callback' on XMLHttpRequest.response.
 * @param {XMLHttpRequest} event
 * @param {CallableFunction} process
 */
function processRequest(request, callback) {
    // Add error checking
    var response = request.response;
    switch (request.statusText) {
        case "OK":
            callback(response);
            break;
        default:
            console.log("Error processing request: " + request);
            console.log("Request status returned - " + request.statusText + ":" + request.status);
            break;
    }
}


/**
* @author Elijah Blowes
* @description Creates a XMLHttpRequest. Sets the responseType as blob.
* Sets the onload event to callback and calls XMLHttpRequest.send()
* @param {String} url Url of file to request
* @param {CallableFunction} callback function to call on XMLHttpRequest
* @returns Soemthing
*/
function getFileAsBlob(url, callback) {
    if (url === null) return null;
    if (typeof url !== "string") return null;

    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "blob";
    if(typeof callback === "function") request.onload = callback;
    request.send();
    return request.response;
}

/**
 * XML HTTP Request wrapper
 * @author Elijah Blowes    
 * @param {String} method  - HTTP Request Method To Use
 * @param {String} url - Request URL
 * @param {Object} options - Dictionary containing options for request.
 * Looks for:
 *  options.type which must be a string
 *  options.headers which is a dictionary with header: value. Where value is a string.
 *  options.data which is the data to be sent in the request.
 * @param {Function} callback - Callback function to be called on readyStateChange
 */
function sendXmlHttpRequest(method, url, options, callback) {
    switch(arguments.length) {
        case 2:
            options = null;
            callback = null;
            break;
        case 3:
            // If third argument is Object set options to argument 3
            if (Object.prototype.toString.call(arguments[2]) === "[object Object]") {
                options = arguments[2];
                callback = null;
            }
            // If third argument is a function set callback to be argument 3
            if (typeof arguments[2] === "function" || arguments[2] instanceof Function) {
                callback = arguments[2];
                options = null;
            }
            break;
        case 4:
            break;
        default:
            throw new Error("only '" + arguments.length + "' passed. Expected at least 2 and no more than 4.");
    }

    // Add error checking here;
    if (typeof method !== "string" && !(method instanceof String)) {
        throw new TypeError("method is of type '" + typeof method + "'.Expected type 'string'.");
    }
    if (typeof url !== "string" && !(url instanceof String)) {
        throw new TypeError("url is of type '" + typeof url + "'.Expected type 'string'.");
    }
    if (options !== null && Object.prototype.toString.call(options) !== "[object Object]") {
        throw new TypeError("options is not a JSON object.");
    }
    if (callback !== null && typeof callback !== "function") {
        throw new TypeError("callback is not a function");
    }

    method = method.toUpperCase();
    var data = null;

    var request = new XMLHttpRequest();
    request.open(method, url, true);
    
    if (callback !== null) {
        request.onreadystatechange = callback;
    }

    if (options !== null) {

        if (options.type !== undefined && (typeof options.type === "string" || options.type instanceof String)) {
            request.responseType = options.type;
        }
    
        if (options.headers !== undefined && Object.prototype.toString.call(options.headers) === "[object Object]") {
            Object.keys(options.headers).forEach(function (key) {
                var value = options.headers[key];
                request.setRequestHeader(key, value);
            });   
        }
    
        if (options.data !== undefined) {
            data = options.data;
        }
    }

    request.send(data);
}

/******************************************************************************
 *                              END
 *****************************************************************************/

 /**
 * HTMLElement Factory. Used to create HTML elements.
 * @author https://kyleshevlin.com/how-to-write-your-own-javascript-dom-element-factory
 * @param {String} type 
 * @param {Object} attributes 
 * @param {Array} children 
 */
function ElementFactory (type, attributes, children) {
    const element = document.createElement(type);

    Object.keys(attributes).forEach(function (key) {
        element.setAttribute(key, attributes[key]);
    });

    children.forEach(function (child) {
        if (typeof child === "string") {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });

    return element;
}

var EventHandler = function (atTargetCallback, bubbleCallback, captureCallback) {
    this.atTarget = atTargetCallback;
    this.bubbling = bubbleCallback;
    this.capturing = captureCallback;
}

EventHandler.prototype = {
    handleEvent: function (args, event) {
        event = event || window.event;
        switch (event.eventPhase) {
            case Event.NONE:
                break;
            case Event.CAPTURING_PHASE:
                this.capturing(args);
                break;
            case Event.AT_TARGET:
                this.atTarget(args);
                break;
            case Event.BUBBLING_PHASE:
                if (typeof this.bubbling !== "function" || !(this.bubbling instanceof Function)) {
                    console.error(this + "does not contain a callback function 'bubbling'. \
                    bubbling is of type '" + typeof this.bubbling + "'");
                    return false;
                }
                this.bubbling(args, event);
                break;
            default:
                console.error("unknown event phase '" + event.eventPhase + "'");
                return false;
        }
        return true;
    } 
}

/**
 * @author Sebastian Young
 * @description Used to check the size of input strings, if too large sets status message, also cuts the end off the input to fit in required space
 * @param {Number} maxLength // define the desired maximum length
 * @param {Bool} checkDefault // set to true to check the default value
 * @param {Bool} checkPlaceholder // set to true to check the placeholder value
 * @param {Bool} checkValue // set to true to check the input value
 * @param {Var} framework // insert the framework variable (fw)
 * @param {Element} textInput // insert the text input element
 */

function checkByteLength(maxLength, checkDefault, checkPlaceholder, checkValue, fw, textInput) {
    // check default value
    var checkedDefault = false; // if the default has been checked, and was the issue, don't need to check the value
    if (checkDefault) {
        byteLength = fw.attribs("default value").length;
        if (byteLength > maxLength) {
            var newValue = fw.attribs("default value").substring(0, maxLength);
            fw.func("SETATTRIB", "default value", newValue);
            if (maxLength === 1000000) {
                fw.func("STATUS", "Default value exceeds maximum (1MB), text shortened", "IMPORTANT");
            } else {
                fw.func("STATUS", "Default value exceeds maximum (10KB), text shortened", "IMPORTANT");
            }
            console.log("Default Value");
            checkedDefault = true;
        }
    }
    if (checkPlaceholder) {
        // check placholder value
        byteLength = fw.attribs("placeholder").length;
        if (byteLength > maxLength) {
            var newValue = fw.attribs("placeholder").substring(0, maxLength);
            fw.func("SETATTRIB", "placeholder", newValue);
            if (maxLength === 1000000) {
                fw.func("STATUS", "Default value exceeds maximum (1MB), text shortened", "IMPORTANT");
            } else {
                fw.func("STATUS", "Placeholder value exceeds maximum (10KB), text shortened", "IMPORTANT");
            }
            console.log("Placeholder Value");
        }
    }
    if (checkValue && !checkedDefault){
        // check input value, but if the default was already found to be the issue, don't check the input value
        byteLength = (textInput.value).length;
        if (byteLength > maxLength) {
            if (maxLength === 1000000) {
                fw.func("STATUS", "Default value exceeds maximum (1MB), text shortened", "IMPORTANT");
            } else {
                fw.func("STATUS", "Text exceeds maximum (10KB), text shortened", "IMPORTANT");
            }
            var newValue = textInput.value.substring(0, maxLength);
            textInput.value = newValue;
            console.log("Input Value");
        }
    }
   
}

Date.prototype.format = function (format, utc) {
    return formatDate(this, format, utc);
};
function formatDate(date, format, utc) {
    var MMMM = ["\x00", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var MMM = ["\x01", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dddd = ["\x02", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var ddd = ["\x03", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    function ii(i, len) { var s = i + ""; len = len || 2; while (s.length < len) s = "0" + s; return s; }

    var y = utc ? date.getUTCFullYear() : date.getFullYear();
    format = format.replace(/(^|[^\\])yyyy+/g, "$1" + y);
    format = format.replace(/(^|[^\\])yy/g, "$1" + y.toString().substr(2, 2));
    format = format.replace(/(^|[^\\])y/g, "$1" + y);

    var M = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    format = format.replace(/(^|[^\\])MMMM+/g, "$1" + MMMM[0]);
    format = format.replace(/(^|[^\\])MMM/g, "$1" + MMM[0]);
    format = format.replace(/(^|[^\\])MM/g, "$1" + ii(M));
    format = format.replace(/(^|[^\\])M/g, "$1" + M);

    var d = utc ? date.getUTCDate() : date.getDate();
    format = format.replace(/(^|[^\\])dddd+/g, "$1" + dddd[0]);
    format = format.replace(/(^|[^\\])ddd/g, "$1" + ddd[0]);
    format = format.replace(/(^|[^\\])dd/g, "$1" + ii(d));
    format = format.replace(/(^|[^\\])d/g, "$1" + d);

    var H = utc ? date.getUTCHours() : date.getHours();
    format = format.replace(/(^|[^\\])HH+/g, "$1" + ii(H));
    format = format.replace(/(^|[^\\])H/g, "$1" + H);

    var h = H > 12 ? H - 12 : H == 0 ? 12 : H;
    format = format.replace(/(^|[^\\])hh+/g, "$1" + ii(h));
    format = format.replace(/(^|[^\\])h/g, "$1" + h);

    var m = utc ? date.getUTCMinutes() : date.getMinutes();
    format = format.replace(/(^|[^\\])mm+/g, "$1" + ii(m));
    format = format.replace(/(^|[^\\])m/g, "$1" + m);

    var s = utc ? date.getUTCSeconds() : date.getSeconds();
    format = format.replace(/(^|[^\\])ss+/g, "$1" + ii(s));
    format = format.replace(/(^|[^\\])s/g, "$1" + s);

    var f = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
    format = format.replace(/(^|[^\\])fff+/g, "$1" + ii(f, 3));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])ff/g, "$1" + ii(f));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])f/g, "$1" + f);

    var T = H < 12 ? "AM" : "PM";
    format = format.replace(/(^|[^\\])TT+/g, "$1" + T);
    format = format.replace(/(^|[^\\])T/g, "$1" + T.charAt(0));

    var t = T.toLowerCase();
    format = format.replace(/(^|[^\\])tt+/g, "$1" + t);
    format = format.replace(/(^|[^\\])t/g, "$1" + t.charAt(0));

    var tz = -date.getTimezoneOffset();
    var K = utc || !tz ? "Z" : tz > 0 ? "+" : "-";
    if (!utc) {
        tz = Math.abs(tz);
        var tzHrs = Math.floor(tz / 60);
        var tzMin = tz % 60;
        K += ii(tzHrs) + ":" + ii(tzMin);
    }
    format = format.replace(/(^|[^\\])K/g, "$1" + K);

    var day = (utc ? date.getUTCDay() : date.getDay()) + 1;
    format = format.replace(new RegExp(dddd[0], "g"), dddd[day]);
    format = format.replace(new RegExp(ddd[0], "g"), ddd[day]);

    format = format.replace(new RegExp(MMMM[0], "g"), MMMM[M]);
    format = format.replace(new RegExp(MMM[0], "g"), MMM[M]);

    format = format.replace(/\\(.)/g, "$1");

    return format;
};

/**
 * Used to toggle the help sidebar in and out of view. Used in client.html, and the widget version is placed in client.js
 * @author Elijah Blowes, Sebastian Young
 */
function openHelpSidebar(helpFile) {
    // run the load function to load help sidebar if necessary
    loadHelpSidebar(helpFile);

    // hide or show the help sidebar based on it's current properties
    var helpDiv = document.getElementById("helpSidebar");
    var rightStyle = parseInt(helpDiv.style.getPropertyValue("right"));
    if (rightStyle !== 0) {
        helpDiv.style.setProperty("right", "0px");
    }

    // if a help file path is given (ie "help/widgets/Table.md"), open it
    if (typeof helpFile === "string"){
        var helpIframe = document.getElementById("helpSidebariFrame");
        helpIframe.contentWindow.open_markdown(helpFile);
        helpIframe.contentWindow.sidebar.close();
    }
}

/**
 * Used to load the help sidebar iframe using help.html template
 * @author Elijah Blowes, Sebastian Young
 */
function loadHelpSidebar(helpFile) {
    // Check if iFrame has help.html src and is loaded.
    var helpIframe = document.getElementById("helpSidebariFrame");
    if (helpIframe.src !== window.location.origin + "/help.html") {
        helpIframe.onload = function () {
            // add an event listener so when the title of the help sidebar is clicked, the help sidebar will close
            helpIframe.contentWindow.sidebar.title.setEventListener("click", closeHelpSidebar);
            // run the getHelpFiles function in help.html
            helpIframe.contentWindow.getHelpFiles(sess.permissions);

            if (typeof helpFile === "string") {
                // if helpFile is set, open that helpFile
                helpIframe.contentWindow.open_markdown(helpFile);
                // set the file explorer to be closed by default
                helpIframe.contentWindow.sidebar.close();

            } else if (sess.permissions.includes("design")) {
                // open the default help file for 
                helpIframe.contentWindow.open_markdown("help/help overview.md");

            } else {
                // otherwise open the default application help file
                helpIframe.contentWindow.open_markdown("help/application/welcome.md");
            }   
        }
        helpIframe.src = "help.html";
    }
}

/**
 * Used to close the help sidebar.
 * @author Elijah Blowes
 */
function closeHelpSidebar() {
    // set the properties of the help sidebar so it is hidden
    var helpDiv = document.getElementById("helpSidebar");
    var rightStyle = parseInt(helpDiv.style.getPropertyValue("right"));
    if (rightStyle !== -1410) {
        helpDiv.style.setProperty("right", "-1410px");
    }
    return false;
}


/**
 * Used to toggle the help sidebar in and out of view. Used in client.html, and the widget version is in client.js
 * @author Elijah Blowes
 */
function toggleHelpSidebar(helpFile) {
    // load the help sidebar if necessary
    loadHelpSidebar(helpFile);
    // get the properties of the help sidebar, close if it is open, open if it is closed.
    var helpDiv = document.getElementById("helpSidebar");
    var rightStyle = parseInt(helpDiv.style.getPropertyValue("right"));
    if (rightStyle === 0) {
        closeHelpSidebar();
    } else {
        openHelpSidebar(helpFile);
    }
}