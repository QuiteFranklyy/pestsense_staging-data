///// { sel_dontScroll } from "../codemirror-5.39.2/src/util/misc";

// Javascript functions / setup for design and flows, loaded dynamically when design is chosen (so running inline with dashboard.html)
//#region ////////////////////////////////////////////////////////// Initialisation
importCodemirrorDeps("Javascript");

var toolboxContents = document.getElementById("toolboxContents");

// Constants
var GRABSIZE = 10;                                                           // size of the grab rectangle block in design mode
var DESIGNGRID = 5;                                                         // grid size in design mode
var TBWIDGETWIDTH = 100;                                                    // width of the objects in the toolbox
var TBYOFFSET = document.getElementById("widgetToolboxDiv").offsetTop;                                 // Offset caused by toolbox header              //TODO: CAN BUT THIS IN THE DESIGN LOAD SECTION
var COMPLETED_LINK_COLOUR = "#999";                                         // Color to draw the link once it has been completed drawn
var HIGHLIGHT_LINK_COLOUR = "rgb(100, 171, 232)";                           // Highlighted link colour
var FLOW_ZINDEX = 110;                                                      // index for flow links

// Globals
var tbWidth;                                                                // Width of toolbox (variable depending if the screen tabs are open or closed)
var tabIconSelected = "";                                                   // Save the name of the icon selected for savingim
var copyPasteTarget;                                                        // Target the name of the item clicked for CopyPaste()
var editData = {};                                                          // Global object for tracking edit state
var dragData = {};                                                          // Global object for tracking dragging state
///var TBRetryCnt = [];                                                        // Global array to track number of retries per TB widget when not fully loaded (can't use widget array in TB)
var colorCounter, COLORS, fontSize;                                         // Text editing
var toolboxWidgets = [];                                                    // Array of all the widgets in the toolbox
var numTBWidgets = 0;                                                       // Keep track of the loaded toolbox widgets so we can work out if any failed to load
var toolboxTimeout;                                                         // Timer for the toolbox not finishing loading
var toolboxWidgetsReady = 0;                                                // Number of widgets loaded
var toolboxWidgetsCount = 0;                                                // Number of widgets to load in the toolbox.

// Global boolean Flags
g.codeToolboxOpen = false;                                                  // Flag if we are editing code to turn off the handler for keys
///g.fileToBeSaved = false;                                                    // Flag to avoid reloading a file each time a widget that does file upload closes their settings menu
g.menuOpen = false;                                                         // widget edit menu state
g.snapToGrid = true;                                                        // Flag to snap to grid for dragging widgets
g.dragLink = false;                                                         // Dragging a flow link so don't drag the widget

// Only show the sidebar minimise chevron in the dashboard not in design
minButton.style.display = "none";
touchButton.style.display = "none";
canvasSectionDiv.classList.add("grid-paper");                                // Show the background as graph paper

setDesign(state.mode);                                                      // As we are dynamically loaded, run the design mode function once we are loaded

//#endregion
//#region ////////////////////////////////////////////////////////// Widget design menu
var evtGroup = document.getElementById("eventGroup");
var exiEvents = document.getElementById("existingEvents");
var outerContainer = document.getElementById("outerEventContainer");
var newEvtBtn = document.getElementById("newEventButton");
var evSpan = document.getElementById("eventSpan");
var newEvtContainer = document.getElementById("newEventContainer");
var evtType = document.getElementById("eventType");
var eventName = document.getElementById("eventName");
var custOptions = document.getElementById("customOptions");
var evtScope = document.getElementById("eventScope");
var clientChan = document.getElementById("clientChannel");
var genAttribs = document.getElementById("generalAttribContainer");
var widgetOpts = document.getElementById("attribContainer");
var custom = document.getElementById("customOptions");
var nameDiv = document.getElementById("widgetNameDiv");

// flag for editing an event to write back over entry, rather than create a new record
var editEvent = false;
var oldEventName = "";

// Display margin if in phone mode.
if (parent.sess.deviceType === "Phone") {
    document.getElementById("widgetPhone").style.setProperty("display", "block");
}

/**
 * creates a unique event name
 */
function getUniqueEventName(widgetName) {
    var evName = "New Event #";
    var position = 0;
    var allEvents = [];
    var outputPosition = 0;
    // get all the event names, checking if they exist first, put into array, and check for the lowest possible new event name number
    if (typeof widgets[widgetName].events !== "undefined") {
        // check for server events in the widget
        if (typeof widgets[widgetName].events.serverEvents !== "undefined") {
            if (typeof widgets[widgetName].events.serverEvents.inputEvents !== "undefined") {
                for (var i = 0; i < Object.keys(widgets[widgetName].events.serverEvents.inputEvents).length; i++) {
                    allEvents[position++] = Object.keys(widgets[widgetName].events.serverEvents.inputEvents)[i];
                }
            }
            if (typeof widgets[widgetName].events.serverEvents.outputEvents !== "undefined") {
                for (var i = 0; i < Object.keys(widgets[widgetName].events.serverEvents.outputEvents).length; i++) {
                    allEvents[position++] = Object.keys(widgets[widgetName].events.serverEvents.outputEvents)[i];
                }
            }
        }
        // check for client events in the widget
        if (typeof widgets[widgetName].events.clientEvents !== "undefined") {
            if (typeof widgets[widgetName].events.clientEvents.inputEvents !== "undefined") {
                for (var i = 0; i < Object.keys(widgets[widgetName].events.clientEvents.inputEvents).length; i++) {
                    allEvents[position++] = Object.keys(widgets[widgetName].events.clientEvents.inputEvents)[i];
                }
            }
            if (typeof widgets[widgetName].events.clientEvents.outputEvents !== "undefined") {
                for (var i = 0; i < Object.keys(widgets[widgetName].events.clientEvents.outputEvents).length; i++) {
                    allEvents[position++] = Object.keys(widgets[widgetName].events.clientEvents.outputEvents)[i];
                }
            }
        }
    }
    // check if the array contains each name/number combination
    for (outputPosition = 0; outputPosition < allEvents.length; outputPosition++) {
        if (allEvents.indexOf(evName + (outputPosition + 1)) === -1) {
            // break if the name/number combination is not used
            break;
        }
    }
    return String(evName + (outputPosition + 1)); //index from 1, it's an object not an array
}

/**
 * toggle the events folder in the widget settings toolbox
 * only masks/unmasks. doesn't clear any values. --> Chosen behaviour
 */
function toggleEvents() {
    if (evtGroup.classList.contains("hidden")) {
        evtGroup.classList.remove("hidden");                                                                        // show the event menu
        outerContainer.style.height = "auto";
        evSpan.innerHTML = "&#9650;";
    } else {
        evtGroup.classList.add("hidden");
        outerContainer.style.height = "31px";
        evSpan.innerHTML = "&#9660;";
    }
}

/**
 * Hides all event items except existing event pills and the newEvtBtn
 */
function hideEventItems() {
    // this needs to be here as a toggle in case you wish to simply view an event
    // opening the event pills sets the editEvent flag as true
    // if you then cancel you have to set it back to false
    if (editEvent) {
        editEvent = false;
    }
    newEvtContainer.classList.add("hidden");
    newEvtBtn.innerText = "New Event";
    document.getElementById("serverAttribs").innerHTML = "";

    var sc = document.getElementById("Server Channels");
    if (sc) {
        var chan = sc.querySelector("a");
        chan.setAttribute("data-selected", "");
        //chan.innerHTML = "None";
    }

    var items = document.querySelectorAll("#clientinput, #clientoutput, #serverinput, #serveroutput, #Server Channels");
    for (i = 0; i < items.length; i++) {
        if (items[i].classList && !(items[i].classList.contains("hidden"))) {
            items[i].classList.add("hidden");
        }
    }

    var inputs = newEvtContainer.querySelectorAll("input");
    for (i = 0; i < inputs.length; i++) {
        inputs[i].value = "";
    }
}

/**
 * Initial function to start opening containers when creating a new event. Triggered by the newEvtBtn
 */
function newEvent() {
    if (newEvtContainer.classList.contains("hidden")) {
        newEvtContainer.classList.remove("hidden");
        newEvtBtn.innerText = "Cancel";
        evtType.classList.remove("hidden");
        showCustom();
        g.dirty = true;
    } else {
        document.getElementById("serverAttribs").innerHTML = "";
        hideEventItems();
    }
    eventName.value = getUniqueEventName(editData.widgetName);
    showCustom();
    document.getElementById("important-input").checked = false;
}

/**
 * Function that shows the dynamically loaded menu elements
 */
function showCustom() {
    var toWork = evtType[evtType.selectedIndex].value;
    document.getElementById("serverAttribs").innerHTML = "";

    if (custOptions.classList.contains("hidden")) {
        custOptions.classList.remove("hidden");
    } else {
        var items = document.querySelectorAll("#clientinput, #clientoutput, #serverinput, #serveroutput, #Server\\ Channels");
        for (i = 0; i < items.length; i++) {
            if (items[i].classList && !(items[i].classList.contains("hidden"))) {
                items[i].classList.add("hidden");
            }
        }
    }

    document.getElementById(toWork).classList.remove("hidden");

    if (toWork.toUpperCase().indexOf("OUTPUT") !== -1) {
        evtScope.classList.remove("hidden");
        evtScope.querySelector("input").classList.remove("hidden");
        evtScope.querySelector("input").value = "receive value";
    } else {
        if (!(evtScope.classList.contains("hidden"))) {
            evtScope.classList.add("hidden");
            evtScope.querySelector("input").classList.add("hidden");
        }
    }

    if (toWork.toUpperCase().indexOf("SERVER") !== -1) {
        evtScope.classList.add("hidden");
        var serverChan = document.getElementById("Server Channels");
        serverChan.classList.remove("hidden");

        document.getElementById("clientChannel").classList.add("hidden");
        document.querySelector("#clientChannel > input").classList.add("hidden");

        evtScope.querySelector("input").classList.remove("hidden");
        evtScope.querySelector("input").value = "receive value";
    } else {
        if (serverChan && !(serverChan.classList.contains("hidden"))) {
            serverChan.classList.add("hidden");
        }
        if (clientChan.classList.contains("hidden")) {
            clientChan.classList.remove("hidden");
            clientChan.querySelector("input").classList.remove("hidden");
        }
    }

    if (toWork.toUpperCase() === "SERVERINPUT") {
        var si = document.getElementById("serverinput");
        var evt = si.querySelector("select");
        var serverEvt = evt.options[evt.selectedIndex].value;

        if ("attribs" in widgets[editData.widgetName].defView.options.serverEvents.inputEvents[serverEvt]) {
            var attribVal, attribName, attribType, options;
            Object.keys(widgets[editData.widgetName].defView.options.serverEvents.inputEvents[serverEvt].attribs).forEach(function (attrib) {
                var menuItem = document.createElement("li");
                attribVal = widgets[editData.widgetName].defView.options.serverEvents.inputEvents[serverEvt].attribs[attrib].default;
                attribType = widgets[editData.widgetName].defView.options.serverEvents.inputEvents[serverEvt].attribs[attrib].type;
                attribName = attrib;

                if (attribType.toUpperCase() === "DROPDOWN") {
                    options = widgets[editData.widgetName].defView.options.serverEvents.inputEvents[serverEvt].attribs[attrib].options.trim();
                } else {
                    options = "";
                }

                var tooltip;
                if ("tooltip" in widgets[editData.widgetName].defView.options.serverEvents.inputEvents[serverEvt].attribs[attrib]) {
                    tooltip = widgets[editData.widgetName].defView.options.serverEvents.inputEvents[serverEvt].attribs[attrib].tooltip;
                } else {
                    tooltip = "";
                }

                menuItem.innerHTML = createMenuElement(editData.widgetName, attribName, attribType, attribVal, options, tooltip);
                document.getElementById("serverAttribs").appendChild(menuItem);
            });
        }
    } else {
        document.getElementById("serverAttribs").innerHTML = "";
    }

    //eventName.value = getUniqueEventName(editData.widgetName);

    // $('[data-toggle="tooltip"]').tooltip({
    //     trigger: 'hover'
    // });
}

function closestParent(elem, selector) {
    if (!Element.prototype.matches) {
        Element.prototype.matches =
            Element.prototype.matchesSelector ||
            Element.prototype.mozMatchesSelector ||
            Element.prototype.msMatchesSelector ||
            Element.prototype.oMatchesSelector ||
            Element.prototype.webkitMatchesSelector ||
            function (s) {
                var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                    i = matches.length;
                while (--i >= 0 && matches.item(i) !== this) { }
                return i > -1;
            };
    }
    while (true) {
        if (elem.matches(selector)) {
            return elem;
        }
        elem = elem.parentElement;
    }
}

function constructChannel(widgetType, selectedKey) {
    // This code is for when we need to construct the widget attrib channel of the form Category/Class/Instance/Scope.
    // It gets all the channel selection inputs and constructs the single channel string.
    if (selectedKey) {
        selector = "[data-key='" + selectedKey + "']";
    }

    var div = closestParent(document.querySelector(selector), "div");

    // Have to find the ID of the DIV it's stored in.
    var id = "#" + div.id;
    id = id.replace(" ", "\\ ");

    var inputs = (widgetType.toUpperCase() === "FLOW" ? document.querySelectorAll(id + " > li > li") : document.querySelectorAll(id + " > li"));
    var channel = "";
    for (var i = 1; i < inputs.length - 1; i++) {
        channel += inputs[i].lastElementChild.value + "/";
    }
    channel += inputs[inputs.length - 1].lastElementChild.value;
    return channel;
}

/**
 * Takes the items filled in the toolbox for creating a new event and attempts to create a new event, pending error checking
 * @param {string} widgetName -
 * @returns {boolean} successful save
 */
async function saveEvent(widgetName) {
    function checkExistence(source, type, name) {
        var loc = widgets[widgetName].events[source + "Events"][type + "Events"];
        return ((name in loc) && !editEvent);
    }

    var toWork = evtType[evtType.selectedIndex].value;
    var evt = document.querySelector("#" + toWork + " > select");
    var evtVal = evt[evt.selectedIndex].value;

    var channel, name, trigger, event;

    var source = (toWork.toUpperCase().indexOf("CLIENT") !== -1) ? "client" : "server";
    var type = (toWork.toUpperCase().indexOf("INPUT") !== -1) ? "input" : "output";
    var clientChannel = document.querySelector("#clientChannel:not(.hidden) > input");
    if (clientChannel && clientChannel.value === "") {
        await parent.alertModal("Channel name cannot be left blank.<br />If you don't wish to save the event simply press cancel", "Empty Channel Name:");
        return;
    }

    if (editEvent) {
        if (typeof widgets[widgetName].events.clientEvents !== "undefined") {
            if (typeof widgets[widgetName].events.clientEvents.inputEvents !== "undefined" && oldEventName in widgets[widgetName].events.clientEvents.inputEvents) {
                delete widgets[widgetName].events.clientEvents.inputEvents[oldEventName];
            }
            if (typeof widgets[widgetName].events.clientEvents.outputEvents !== "undefined" && oldEventName in widgets[widgetName].events.clientEvents.outputEvents) {
                delete widgets[widgetName].events.clientEvents.outputEvents[oldEventName];
            }
        }

        if (typeof widgets[widgetName].events.serverEvents !== "undefined") {
            if (typeof widgets[widgetName].events.serverEvents.inputEvents !== "undefined" && oldEventName in widgets[widgetName].events.serverEvents.inputEvents) {
                delete widgets[widgetName].events.serverEvents.inputEvents[oldEventName];
            }
            if (typeof widgets[widgetName].events.serverEvents.outputEvents !== "undefined" && oldEventName in widgets[widgetName].events.serverEvents.outputEvents) {
                delete widgets[widgetName].events.serverEvents.outputEvents[oldEventName];
            }
        }
        oldEventName = "";
    }

    switch (toWork.toUpperCase()) {
        case "SERVERINPUT":
            channel = constructChannel("WIDGET", "Channel");
            name = eventName.value;
            event = evtVal;
            break;
        case "CLIENTINPUT":
            channel = document.querySelector("#clientChannel > input").value + "/" + evtVal;
            name = eventName.value;
            event = evtVal;
            break;
        case "SERVEROUTPUT":
            trigger = evtVal;
            //var scope = evtScope.querySelector("input").value.toLowerCase().trim();
            channel = constructChannel("WIDGET", "Channel");
            event = evtVal;
            name = eventName.value;
            break;
        case "CLIENTOUTPUT":
            trigger = evtVal;
            var scope = evtScope.querySelector("input").value.toLowerCase().trim();
            channel = document.querySelector("#clientChannel > input").value + "/" + scope;
            name = eventName.value;
            event = evtVal;
            break;
    }


    if (typeof name === "undefined" || name === "") {
        await parent.alertModal("Event name cannot be left blank.<br />If you don't wish to save the event simply press cancel", "Invalid Event Name");
        return false;
    }

    if (toWork.toUpperCase().indexOf("OUTPUT") !== -1) {
        if (typeof trigger === "undefined" || trigger === "") {
            await parent.alertModal("You must select a trigger for output events", "Invalid or blank trigger");
            return false;
        }
    }

    var important = "" + document.getElementById("important-input").checked + "";

    if (String(source + "Events") in widgets[widgetName].events) {
        if (String(type + "Events") in widgets[widgetName].events[source + "Events"]) {
            if (checkExistence(source, type, name)) {
                var invalidString = "<b>" + name + "</b> cannot be used as it already exists as an " + type + " event" +
                    " on the " + source + ".<br/><br/>" +
                    "Please select a unique name for this location.";

                parent.modalMessage("Invalid Event Name", invalidString);
                return;
            }
            widgets[widgetName].events[source + "Events"][type + "Events"][name] = {
                "channel": channel,
                "trigger": trigger,
                "event": event,
                "important": important,
            };
        } else {
            widgets[widgetName].events[source + "Events"][type + "Events"] = {};
            widgets[widgetName].events[source + "Events"][type + "Events"][name] = {
                "channel": channel,
                "trigger": trigger,
                "event": event,
                "important": important,
            };
        }
    } else {
        widgets[widgetName].events[source + "Events"] = {};
        widgets[widgetName].events[source + "Events"][type + "Events"] = {};
        widgets[widgetName].events[source + "Events"][type + "Events"][name] = {
            "channel": channel,
            "trigger": trigger,
            "event": event,
            "important": important,
        };
    }

    if (toWork.toUpperCase() === "SERVERINPUT") {
        if ("attribs" in widgets[editData.widgetName].defView.options.serverEvents.inputEvents[event]) {                // check if the generic widget has attribs
            if (!("attribs" in widgets[editData.widgetName].events.serverEvents.inputEvents[name])) {                   // if it has no attribs make the attribs object
                widgets[editData.widgetName].events.serverEvents.inputEvents[name].attribs = {};
            }
            var startNode = document.getElementById("serverAttribs");                                                   // save the attribs accordingly
            saveServerEventSettings(editData.widgetName, name, startNode);
        }
    }

    // in this block we want to populate the pills and hide the event creation items
    //showWidgetMenu(widgetName);
    hideEventItems();
    createAndGenerateEventPills(widgetName);
    editEvent = false;
    return true;
}

/**
 * deletes the event provided from the widget events object
 * @param widgetName
 * @param details
 */
function deleteEvent(widgetName, details) {
    var source = details[0];
    var type = details[1];
    var name = details[2];

    if (type === "inputEvents" && source === "clientEvents") {
        var funcName = widgets[widgetName].events.clientEvents.inputEvents[name].event;
        var func = widgets[widgetName].defView.options.clientEvents.inputEvents[funcName]
        var channel = widgets[widgetName].events.clientEvents.inputEvents[name].channel.split('/')[0];

        appStateStore.unsubscribe(channel.toUpperCase(), func);
    }

    // delete from the widgets object
    delete widgets[widgetName].events[source][type][name];

    // if we are deleting an event and it is open, clear the inputs and hide
    if (editEvent) {
        hideEventItems();
    }

    // then re create the event pills
    createAndGenerateEventPills(widgetName);
    //showWidgetMenu(widgetName);
}

/**
 * grabs the attributes/settings when an existing event is selected, and populates the HTMLElement values in the toolbox
 * @param widgetName
 * @param event
 */
function populateAttribFields(widgetName, event) {
    event = event.split(",");
    var source = event[0];
    var type = event[1];
    var name = event[2];

    var evtObj = widgets[widgetName].events[source][type][name];
    if (evtObj.important && evtObj.important === "true") {
        document.getElementById("important-input").checked = true;
    } else {
        document.getElementById("important-input").checked = false;
    }

    source = (event[0].toUpperCase().indexOf("CLIENT") !== -1) ? "client" : "server";
    type = (event[1].toUpperCase().indexOf("INPUT") !== -1) ? "input" : "output";
    var toWork = source + type;
    var evt = document.querySelector("#" + toWork + " > select");

    for (i = 0; i < evtType.options.length; i++) {
        if (evtType.options[i].value === toWork) {
            evtType.selectedIndex = i;
        }
    }

    showCustom();

    switch (toWork.toUpperCase()) {
        case "SERVERINPUT":
            document.getElementById("serverAttribs").innerHTML = "";
            document.querySelector("#Server\\ Channels > li > a").attributes["data-selected"].value = evtObj.channel;

            updateServerChannelFields(evtObj.channel, document.querySelector("#Server\\ Channels"));
            eventName.value = name;
            for (i = 0; i < evt.options.length; i++) {
                if (evt.options[i].value === evtObj.event) {
                    evt.selectedIndex = i;
                }
            }

            if ("attribs" in widgets[widgetName].defView.options.serverEvents.inputEvents[evtObj.event]) {
                var attribVal, attribName, attribType, options;
                Object.keys(widgets[widgetName].defView.options.serverEvents.inputEvents[evtObj.event].attribs).forEach(function (attrib) {
                    var menuItem = document.createElement("li");
                    if ("attribs" in evtObj && attrib in evtObj.attribs) {
                        attribVal = evtObj.attribs[attrib];
                    } else {
                        attribVal = widgets[widgetName].defView.options.serverEvents.inputEvents[evtObj.event].attribs[attrib].default;
                    }
                    attribType = widgets[widgetName].defView.options.serverEvents.inputEvents[evtObj.event].attribs[attrib].type;
                    attribName = attrib;

                    if (attribType.toUpperCase() === "DROPDOWN") {
                        options = widgets[widgetName].defView.options.serverEvents.inputEvents[evtObj.event].attribs[attrib].options.trim();
                    } else {
                        options = "";
                    }

                    var tooltip;
                    if ("tooltip" in widgets[editData.widgetName].defView.options.serverEvents.inputEvents[evtObj.event].attribs[attrib]) {
                        tooltip = widgets[editData.widgetName].defView.options.serverEvents.inputEvents[evtObj.event].attribs[attrib].tooltip;
                    } else {
                        tooltip = "";
                    }

                    menuItem.innerHTML = createMenuElement(widgetName, attribName, attribType, attribVal, options, tooltip);
                    document.getElementById("serverAttribs").appendChild(menuItem);
                });
            }

            break;
        case "CLIENTINPUT":
            for (i = 0; i < evt.options.length; i++) {
                if (evt.options[i].value === evtObj.channel.split("/")[1].trim()) {
                    evt.selectedIndex = i;
                }
            }
            document.querySelector("#clientChannel > input").value = evtObj.channel.split("/")[0].trim();
            evtScope.querySelector("input").value = evtObj.channel.split("/")[1].trim();
            eventName.value = name;
            break;
        case "SERVEROUTPUT":
            for (var i = 0; i < evt.options.length; i++) {
                if (evt.options[i].value === evtObj.trigger) {
                    evt.selectedIndex = i;
                }
            }
            eventName.value = name;
            document.querySelector("#Server\\ Channels > li > a").attributes["data-selected"].value = evtObj.channel;
            updateServerChannelFields(evtObj.channel, document.querySelector("#Server\\ Channels"));
            break;
        case "CLIENTOUTPUT":
            for (var i = 0; i < evt.options.length; i++) {
                if (evt.options[i].value === evtObj.trigger) {
                    evt.selectedIndex = i;
                }
            }
            evtScope.querySelector("input").value = evtObj.channel.split("/")[1].trim();
            document.querySelector("#clientChannel > input").value = evtObj.channel.split("/")[0].trim();
            eventName.value = name;
            break;
    }

    // if we're hiding the event container show it all
    if (newEvtContainer.classList.contains("hidden")) {
        newEvtContainer.classList.remove("hidden");
        newEvtBtn.innerText = "Cancel";
        evtType.classList.remove("hidden");
    }

    // $('[data-toggle="tooltip"]').tooltip({
    //     trigger: 'hover'
    // });
}

/**
 * @description Creates a label menu element for use within the widget settings
 * pane.
 * @author Elijah Blowes
 * @param {string} innerHtml
 * @param {Object} styles
 */

function createMenuElementLabel(innerHtml, styles) {
    var label = document.createElement("label");
    label.setAttribute("tab-index", "-1");
    label.setAttribute("href", "#");

    if (typeof styles !== "undefined") {
        Object.keys(styles).forEach(function (key) {
            label.style.setProperty(key, styles[key]);
        });
    }

    label.innerHTML = (typeof innerHtml === "string") ? innerHtml : "";
    return label;
}

/**
 * @description Creates a link element to be used in the settings toolbox.
 * @author Elijah Blowes
 * @param {string} widgetName Name of the widget
 * @param {string} attribName The attribute Name
 * @param {string} attribValue
 * @param {string} tooltip
 */

function createMenuElementLink(widgetName, attribName, attribValue, tooltip) {
    var onclickString = "parent.loadToolbox(\"channels\", \"\", 0," +
        "\"" + widgets[widgetName].defView.options.settings.category +
        "\"," + "\"" + attribName + "\")";

    var link = document.createElement("a");
    link.setAttribute("data-toggle", "tooltip");
    link.setAttribute("title", tooltip);
    link.setAttribute("data-container", "#widgetOptionList");
    link.setAttribute("data-delay", "2500");
    link.setAttribute("tabindex", "-1");
    link.setAttribute("href", "#");
    link.setAttribute("data-selected", attribValue);
    link.setAttribute("data-type", "channel");
    link.setAttribute("data-key", attribName);
    link.setAttribute("onclick", onclickString);
    // Change this to a variable
    link.innerHTML = "Select Channel";
    return link;
}

/**
 * Creates an Input Element for the widget settings toolbar. Used in events
 * attribs, widget properties etc.
 * @author  Elijah Blowes
 * @param {string} attribName
 * @param {string} attribType
 * @param {string} attribValue
 * @param {string} tooltip
 */

function createMenuElementInput(attribName, attribType, attribValue, tooltip) {
    var input = document.createElement("input");
    input.setAttribute("data-toggle", "tooltip");
    input.setAttribute("title", tooltip);
    input.setAttribute("data-container", "#widgetOptionList");
    input.setAttribute("data-delay", "2500");
    input.setAttribute("data-type", attribType);
    input.setAttribute("type", "text");
    input.setAttribute("class", "form-control form-control-sm");
    input.setAttribute("value", attribValue);
    input.setAttribute("data-key", attribName);
    input.setAttribute("autocomplete", "off");

    return input;
}

/**
 * Appends children to node parent
 * @author Elijah Blowes
 * @param {HTMLNode} parent
 * @param {Array} children
 */
function appendChildren(parent, children) {
    children.forEach(function (child) {
        parent.appendChild(child);
    });
}

/**
 * Creates innerHTML for a menu item
 * @param widgetName
 * @param attribName
 * @param attribType
 * @param attribValue
 * @param options
 * @returns {string}
 */
function createMenuElement(widgetName, attribName, attribType, attribValue, options, tooltip) {
    let placeholderValue = widgets[widgetName].defView.options.attribs[attribName]?.placeholder;
    // Prevent the placeholder from appearing as undefined
    placeholderValue = placeholderValue == undefined ? "" : placeholderValue;
    function isEmpty(obj) {
        for (var x in obj) { return false; }
        return true;
    }
    if (typeof tooltip === "undefined") {
        tooltip = "";
    }
    var innerHTML = "";
    switch (attribType.toUpperCase()) {
        case "DROPDOWN":
            options = options.split(",");
            innerHTML = "<label tab-index='-1' href='#'>" + attribName + "</label>" +
                "<select data-toggle='tooltip' title='" + tooltip + "' data-container='#widgetOptionList' data-delay='2500' data-type='" + attribType + "' data-key='" + attribName + "' class='form-control form-control-sm' data-type='dropdown'>";
            var selectedVal;
            for (i = 0; i < options.length; i++) {
                if (attribValue.trim().toUpperCase() === options[i].trim().toUpperCase()) {
                    selectedVal = " selected";
                } else {
                    selectedVal = "";
                }
                innerHTML += "<option" + selectedVal + ">" + options[i].trim() + "</option>";
            }
            innerHTML += "</select>";
            break;

        case "CHECKBOX":
            if (typeof attribValue === "string") {
                attribValue = (attribValue.toUpperCase() === "TRUE");
            }
            var checked = attribValue ? "checked" : "";
            innerHTML = "<div class='form-check-inline' style='display:inline-flex; flex-direction: row;'><input data-toggle='tooltip' title='" +
                tooltip + "' data-container='#widgetOptionList'" + " data-delay='2500' data-type='" + attribType + "' data-key='" + attribName +
                "' class='form-check-input' style='margin-right: 0.3125rem !important;' type='checkbox'" + checked + " <label class='form-check-inline'>" + attribName + "</label></input></div>";
            break;

        case "CHANNEL":
        // Fallthrough just incase I missed any channels called Flow_channel
        case "FLOW_CHANNEL":
            var attribs = [];
            var widgetType = widgets[widgetName].defView.options.settings["category"].toUpperCase();

            // Create the input fields
            var categoryInputField = document.createElement("li");
            categoryInputField.innerHTML = createMenuElement(widgetName, "category", "INPUT", "");
            var classInputField = document.createElement("li");
            classInputField.innerHTML = createMenuElement(widgetName, "class", "INPUT", "");
            var instanceInputField = document.createElement("li");
            instanceInputField.innerHTML = createMenuElement(widgetName, "instance", "INPUT", "");
            var scopeInputField = document.createElement("li");
            scopeInputField.innerHTML = createMenuElement(widgetName, "scope", "INPUT", "");

            // Create channel Select link
            var channelSelectA = createMenuElementLink(widgetName, attribName, attribValue, tooltip);
            // Creates the label for the select Channel link
            var channelSelectLabel = createMenuElementLabel(
                "Server Channels",
                { "display": "block", "margin": "0px" }
            );
            // Creates a list element for for the channel select link and label.
            var channelSelectLi = document.createElement("li");
            appendChildren(channelSelectLi, [channelSelectLabel, channelSelectA]);

            // Package it all in a div so we can hide it easily.
            var serverChannelDiv = document.createElement("div");
            appendChildren(serverChannelDiv, [
                channelSelectLi,
                categoryInputField,
                classInputField,
                instanceInputField,
                scopeInputField
            ]);
            if (widgetType === "FLOW") {
                updateServerChannelFields(attribValue, serverChannelDiv);
            }
            innerHTML = serverChannelDiv.innerHTML;
            // This sets the search settings for the channel select
            parent.toolBoxItemSearchCat = widgets[widgetName].defView.options.settings.category;
            parent.channelKeySelect = attribName;
            break;
        case "TOOLTIP":
        case "SCOPE":
        case "PASSWORD":
        case "INPUT":
            var li = document.createElement("li");
            var label = createMenuElementLabel(attribName);
            var input = createMenuElementInput(attribName, attribType, attribValue, tooltip);
            input.setAttribute("placeholder", placeholderValue);
            if (attribType.toUpperCase() === "PASSWORD") {
                input.setAttribute("type", "password");
            }
            appendChildren(li, [label, input]);
            innerHTML = li.innerHTML;

            break;

        case "COLOR":
            innerHTML = "<label tabindex='-1' href='#'>" + attribName + "</label><input data-toggle='tooltip' title='" + tooltip + "' data-container='#widgetOptionList' " +
                " data-delay='2500' data-type='" + attribType + "' type='color' class='form-control form-control-sm'" +
                " value='" + attribValue + "' data-key='" + attribName + "' autocomplete='off'>";
            break;
        case "DATA":
            innerHTML = "<span data-type='data' data-key='" + attribName + "' style='display:none'>" + attribValue + "</span>";
            break;

        case "FILE":
            var fileName = attribValue;
            if (attribValue === "")
                fileName = "none";
            innerHTML = "<div>" + attribName + "</div><a id='menuFile' tabindex='-1' href='#' onclick='fileInputHelper()'>" + fileName.split(".")[0] +
                "</a><input data-toggle='tooltip' title='" + tooltip + "' data-container='#widgetOptionList' data-delay='2500' " +
                "data-key='" + attribName + "' data-type='" + attribType + "' hidden id='selectedFile' type='file' accept='image/jpeg,image/png,image/gif,image/svg,application/pdf,video/mp4,video/mov,video/webm,video/ogg' size='1' data-type='file'/>";
            break;

        case "LABEL":
            innerHTML = "<div data-toggle='tooltip' title='" + tooltip + "' data-container='#widgetOptionList' data-delay='2500' " +
                "data-key='" + attribName + "' data-type='label'>" + attribValue + "</div>";
            break;

        case "TEXT":
            let containingDiv = document.createElement("div");
            let textLabel = createMenuElementLabel(attribName);
            let textArea = document.createElement('textarea');
            textArea.setAttribute("data-toggle", "tooltip");
            textArea.setAttribute("title", tooltip);
            textArea.setAttribute("data-container", "#widgetOptionList");
            textArea.setAttribute("data-key", attribName);
            textArea.setAttribute("data-type", "text");
            textArea.setAttribute("rows", "4");
            textArea.setAttribute("placeholder", placeholderValue);
            textArea.style.setProperty("resize", "vertical");
            textArea.style.setProperty("height", "auto");
            textArea.classList.add("form-control");
            // Using innerHTML to allow html templates.
            textArea.innerHTML = attribValue

            containingDiv.appendChild(textLabel);
            containingDiv.appendChild(textArea);
            innerHTML = containingDiv.innerHTML;
            break;

        case "SECTION":
            innerHTML = "<hr>";
            break;

        case "CODE":
            this.editor.setValue(attribValue);
            this.editor.refresh();
            var doc = editor.getDoc();
            doc.clearHistory();                 // Stop Ctrl-Z clearing the data unintentionally
            innerHTML = "<span data-type='code' data-key='" + attribName + "'></span>";
            //innerHtml = "<label for='codeBtn'>Run Code:</label><br />" +
            //    "<button id='codeBtn' type='button' class='btn btn-primary btn-sm' data-type='code' onclick=\"toggleToolbox('codeToolboxDiv', 'open')\">Open Editor</button ><br />";
            toggleToolbox("codeToolboxDiv", "open");
            break;
    }

    return innerHTML;
}

function createAndGenerateEventPills(widgetName) {
    // first clear the div containing the pills
    exiEvents.innerHTML = "";

    // allocate an array to grab all of the existing events from the widgets object
    var existingEvents = [];

    // grab any existing widget events and store them
    for (var evSource in widgets[widgetName].events) {
        for (var evType in widgets[widgetName].events[evSource]) {
            for (var ev in widgets[widgetName].events[evSource][evType]) {
                existingEvents.push(String(evSource + "," + evType + "," + ev));
            }
        }
    }

    // creates the pills for the existing events with relevant tooltips and action listeners
    existingEvents.forEach(function (event, index) {
        var details = event.split(",");
        var srcIcon = (details[0].toUpperCase().indexOf("CLIENT") === -1) ? "<i class='material-icons'>domain</i>" : "<i class='material-icons'>desktop_mac</i>";
        var typeIcon = (details[1].toUpperCase().indexOf("INPUT") === -1) ? "<i class='material-icons'>file_upload</i>" : "<i class='material-icons'>file_download</i>";

        var menuItem = document.createElement("p");
        var displayName = (details[2].length > 15) ? details[2].substring(0, 15) : details[2];

        menuItem.innerHTML = "<span id='" + widgetName + "event" + index + "'>" + displayName + "</span>" +
            "<span id='deleteEvent" + index + "' class='spanHover' style='float: right; pointer-events: all'>&#11199;</span>" +
            "<span style='float: right'>" + "&nbsp;" + srcIcon + "&nbsp;" + typeIcon + "&nbsp;</span>";
        menuItem.className = "existingEvent";
        menuItem.setAttribute("event-data", event);
        menuItem.id = widgetName + "event" + index;
        exiEvents.appendChild(menuItem);
        document.getElementById("deleteEvent" + index).addEventListener("click", function () {
            deleteEvent(widgetName, details);
        });
        document.getElementById(menuItem.id).addEventListener("click", function (e) {
            if (e.target.id.toUpperCase() !== String("deleteEvent" + index).toUpperCase()) {
                document.getElementById("serverAttribs").innerHTML = "";
                populateAttribFields(widgetName, event);
                editEvent = true;
                oldEventName = event.split(",")[2];
            }
        })
    });
}

/**
 * @description Builds and displays the entire WidgetOptionsList div element for widgets[widgetName],
 * based off of the widgets stored and default values.
 * @param {string} widgetName Name of widget to build attributes for.
 */
var widgetNameInput;
function showWidgetMenu(widgetName) {
    // Reads the events object for the widget and creates a selectable HTMLElement for selection
    function readEvents(events) {
        var eventOptions = "";
        if (Array.isArray(events)) {
            for (i = 0; i < events.length; i++) {
                eventOptions += events[i] + ",";
            }
            eventOptions = eventOptions.substring(0, (eventOptions.length - 1));
        } else if (typeof events === "object") {
            for (var event in events) {
                eventOptions += event + ",";
            }
            eventOptions = eventOptions.substring(0, (eventOptions.length - 1));
        }

        var menuItem = document.createElement("li");
        menuItem.innerHTML = createMenuElement(widgetName, "Event", "DROPDOWN", "", eventOptions, "");
        return menuItem;
    }

    // toggle the design toolbox (ie channels so it closes)
    parent.toggleToolbox("close");

    // variable assignment for ease of writing
    var settingsTitle = document.getElementById("settingsToolboxTitle");
    var menuItem, attribVal, attribType, tooltip;
    //var existingEvents = []; // [0] = source, [1] = type, [2] = name

    setEdit(widgetName);
    g.menuOpen = true;

    settingsTitle.innerHTML = widgets[widgetName].type;

    // cleans the toolbox divs and refreshes
    widgetOpts.innerHTML = "";
    custom.innerHTML = "";
    exiEvents.innerHTML = "";
    nameDiv.innerHTML = "";
    genAttribs.innerHTML = "";
    document.getElementById("serverAttribs").innerHTML = "";
    document.getElementById("widgetZIndex").selectedValue = 2;
    document.getElementById("widgetTooltip").value = "";
    document.getElementById("widgetEnabled").checked = false;
    document.getElementById("widgetVisible").checked = true;

    // clears the values of all the input fields
    var inputsToClear = newEvtContainer.querySelectorAll("input");
    for (i = 0; i < inputsToClear.length; i++) {
        inputsToClear[i].value = "";
    }
    // sets the dropbox selected values to the first available
    var dropdownsToClear = newEvtContainer.querySelectorAll("select");
    for (i = 0; i < dropdownsToClear.length; i++) {
        dropdownsToClear[i].selectedIndex = 0;
    }
    // clear the event type dropdown
    evtType.innerHTML = "";
    // if open hide event items
    hideEventItems();

    // we want to be able to edit the name of the widget in the settings menu
    // use data key of title to flag for the widget name
    var nameField = document.createElement("li");
    nameField.innerHTML = createMenuElement(widgetName, "name", "INPUT", widgetName, "", "Widget name");
    nameDiv.appendChild(nameField);
    widgetNameInput = nameField.childNodes[1];
    // Create the exisiting event 'Pills' these are the events that are already saved in the widgets[widgetName] object.
    createAndGenerateEventPills(widgetName);

    // This builds out the events div sections.

    // first append the input/output event options to the custom element in the DOM
    // this will be displayed based off user actions in the settings toolbox
    if ("clientEvents" in widgets[widgetName].defView.options) {
        if (typeof widgets[widgetName].defView.options.clientEvents.inputEvents !== "undefined") {
            var evtOption = document.createElement("option");
            var t = readEvents(widgets[widgetName].defView.options.clientEvents.inputEvents);
            t.className = "hidden";
            t.id = "clientinput";
            evtOption.value = t.id;
            evtOption.text = "Client Input";
            evtType.add(evtOption);
            custom.appendChild(t);
        }

        if (typeof widgets[widgetName].defView.options.clientEvents.outputEvents !== "undefined") {
            var evtOption = document.createElement("option");
            var t = readEvents(widgets[widgetName].defView.options.clientEvents.outputEvents);
            t.className = "hidden";
            t.id = "clientoutput";
            evtOption.value = t.id;
            evtOption.text = "Client Output";
            evtType.add(evtOption);
            custom.appendChild(t);
        }
    }

    if ("serverEvents" in widgets[widgetName].defView.options) {
        var sc = document.createElement("div");
        if (typeof widgets[widgetName].defView.options.serverEvents.inputEvents !== "undefined") {
            var evtOption = document.createElement("option");
            var t = readEvents(widgets[widgetName].defView.options.serverEvents.inputEvents);
            t.className = "hidden";
            t.id = "serverinput";
            custom.appendChild(t);
            sc.innerHTML = createMenuElement(widgetName, "Channel", "FLOW_CHANNEL", "", "", "Specify the channel");
            sc.className = "hidden";
            sc.id = "Server Channels";
            evtOption.value = t.id;
            evtOption.text = "Server Input";
            evtType.add(evtOption);
            custom.appendChild(sc);
            updateServerChannelFields("", document.querySelector("#Server\\ Channels"));
        }

        if (typeof widgets[widgetName].defView.options.serverEvents.outputEvents !== "undefined") {
            var evtOption = document.createElement("option");
            var t = readEvents(widgets[widgetName].defView.options.serverEvents.outputEvents);
            t.className = "hidden";
            t.id = "serveroutput";
            custom.appendChild(t);
            sc.innerHTML = createMenuElement(widgetName, "Channel", "CHANNEL", "", "", "Specify the channel");
            sc.className = "hidden";
            sc.id = "Server Channels";
            evtOption.value = t.id;
            evtOption.text = "Server Output";
            evtType.add(evtOption);
            custom.appendChild(sc);
            updateServerChannelFields("", document.querySelector("#Server\\ Channels"));
        }
    }

    var attribGroups = [];
    // populate a list of attribute groups (unique)
    // Loops through the widgets attribs and checks to see if the group key exists.
    // If it does it compares it with the already found groups. if it is unique it adds
    // it to the array attribGroups.
    for (var key in widgets[widgetName].defView.options.attribs) {
        if ("group" in widgets[widgetName].defView.options.attribs[key]) {
            if (attribGroups.indexOf(widgets[widgetName].defView.options.attribs[key].group) === -1) {
                attribGroups.push(widgets[widgetName].defView.options.attribs[key].group);
            }
        }
    }

    // for each attribute group, create a div/folder
    attribGroups.forEach(function (group) {
        var folderDiv = document.createElement("div");
        folderDiv.id = group;

        var folderTitle = document.createElement("div");
        folderTitle.className = "categoryTitle";
        folderTitle.innerHTML = group + "<span class='categoryTitle'>&#9650;</span>";
        folderTitle.addEventListener("click", function () {
            if (document.getElementById(folderDiv.id).classList.contains("hidden")) {
                document.getElementById(folderDiv.id).classList.remove("hidden");
                folderTitle.innerHTML = group + "<span class='categoryTitle'>&#9650;</span>";
            } else {
                document.getElementById(folderDiv.id).classList.add("hidden");
                folderTitle.innerHTML = group + "<span class='categoryTitle'>&#9660;</span>";
            }
        });

        var folderContainer = document.createElement("div");
        folderContainer.className = "categoryGroup";
        folderContainer.appendChild(folderTitle);

        // loop through the attributes in that group and populate the value, type, default, etc of that attribute

        // Builds out the Widget Specific, General (also does the Chart Details section for the Graph widget).
        // each attrib is a new key. e.g. is a new element.
        for (var key in widgets[widgetName].defView.options.attribs) {
            if ("group" in widgets[widgetName].defView.options.attribs[key]) {
                if (group.toUpperCase() === widgets[widgetName].defView.options.attribs[key].group.toUpperCase()) {
                    // Performing a heap of tests and set some variables.
                    if ("type" in widgets[widgetName].defView.options.attribs[key]) {
                        attribType = widgets[widgetName].defView.options.attribs[key].type;
                    } else {
                        alert(key + " in " + widgetName + " options has no type. Removing from settings toolbox");
                    }
                    if (key in widgets[widgetName].attribs && widgets[widgetName].attribs[key] !== null) {
                        attribVal = widgets[widgetName].attribs[key];
                    } else {
                        if ("default" in widgets[widgetName].defView.options.attribs[key]) {
                            attribVal = widgets[widgetName].defView.options.attribs[key].default;
                        } else {
                            alert(key + " in " + widgetName + " options has no value or default. Removing from settings toolbox");
                            continue;
                        }
                    }
                    if (typeof attribVal === "string") {
                        attribVal = attribVal.trim();
                    }
                    if (attribType.toUpperCase() === "DROPDOWN") {
                        var options = widgets[widgetName].defView.options.attribs[key].options;
                    }

                    if ("tooltip" in widgets[widgetName].defView.options.attribs[key]) {
                        tooltip = widgets[widgetName].defView.options.attribs[key].tooltip;
                    } else {
                        tooltip = "Menu item";
                    }

                    if ("readonly" in widgets[widgetName].defView.options.attribs[key] && widgets[widgetName].defView.options.attribs[key].readonly === "true") {
                        menuItem = document.createElement("li");
                        var t = createMenuElement(widgetName, key, "text", attribVal, "", tooltip);
                        t += "<div><b>" + attribVal + "</b> (readonly)</div>";
                        menuItem.innerHTML = t;
                    } else {
                        // This is where you actually create each menu element.
                        menuItem = document.createElement("li");
                        menuItem.innerHTML = createMenuElement(widgetName, key, attribType, attribVal, options, tooltip);
                    }
                    folderDiv.appendChild(menuItem);
                }
            } else {
                alert("Attribute group required. Settings item being removed from the toolbox.");
                continue;
            }
        }
        folderContainer.appendChild(folderDiv);
        if (group.toUpperCase() === "GENERAL") {
            genAttribs.appendChild(folderContainer);
        } else {
            widgetOpts.appendChild(folderContainer);
        }
    });

    var zi = document.getElementById("widgetZIndex");
    var dis = document.getElementById("widgetEnabled");
    var vis = document.getElementById("widgetVisible");
    var toolt = document.getElementById("widgetTooltip");
    var prop = document.getElementById("widgetProperty");
    var scalingEnabledCheck = document.getElementById("scalingEnabled");
    var scalingDiv = document.getElementById("scalingDiv");

    // Build out div depending on type of scaling selected. Proportional scaling stuff.
    // Talk to Dan.
    if (widgets[widgetName].defView.options.settings.scaling) {
        scalingDiv.style.setProperty("display", "block");

        scalingEnabledCheck.checked = widgets[widgetName].scaling.enabled;
        var scalingXInput = document.getElementById("scalingXInput");
        var scalingYInput = document.getElementById("scalingYInput");
        var scalingWidthInput = document.getElementById("scalingWidthInput");
        var scalingHeightInput = document.getElementById("scalingHeightInput");

        if (widgets[widgetName].scaling.x.indexOf("px") === -1 && widgets[widgetName].scaling.x.indexOf("%") === -1) {
            scalingXInput.value = Math.round(parseFloat(dragData.widgetObj.style.left) / widgetContainer.offsetWidth * 10000) / 100 + "%";
        } else {
            scalingXInput.value = widgets[widgetName].scaling.x;
        }

        if (widgets[widgetName].scaling.y.indexOf("px") === -1 && widgets[widgetName].scaling.y.indexOf("%") === -1) {
            scalingYInput.value = Math.round(parseFloat(dragData.widgetObj.style.top) / widgetContainer.offsetHeight * 10000) / 100 + "%";
        } else {
            scalingYInput.value = widgets[widgetName].scaling.y;
        }

        if (widgets[widgetName].scaling.width.indexOf("px") === -1 && widgets[widgetName].scaling.width.indexOf("%") === -1) {
            scalingWidthInput.value = Math.round(parseFloat(dragData.widgetObj.offsetWidth) / widgetContainer.offsetWidth * 10000) / 100 + "%";
        } else {
            scalingWidthInput.value = widgets[widgetName].scaling.width;
        }

        if (widgets[widgetName].scaling.height.indexOf("px") === -1 && widgets[widgetName].scaling.height.indexOf("px") === -1) {
            scalingHeightInput.value = Math.round(parseFloat(dragData.widgetObj.offsetHeight) / widgetContainer.offsetHeight * 10000) / 100 + "%";
        } else {
            scalingHeightInput.value = widgets[widgetName].scaling.height;
        }

    } else {
        scalingDiv.style.setProperty("display", "none");
    }

    // check for existence of a z-index and append
    if ("zIndex" in widgets[widgetName] && typeof widgets[widgetName].zIndex !== "undefined") {
        for (i = 0; i < zi.options.length; i++) {
            if (String(zi.options[i].value) === String(widgets[widgetName].zIndex)) {
                zi.selectedIndex = i;
            }
        }
    } else {
        // make the selected option reflect the options stored in the static settings object.
        for (i = 0; i < zi.options.length; i++) {
            if (String(zi.options[i].value) === String(widgets[widgetName].defView.options.settings.zIndex)) {
                zi.selectedIndex = i;
            }
        }
    }

    // check for existence of disabled and append
    if ("disabled" in widgets[widgetName] && typeof widgets[widgetName].disabled !== "undefined") {
        dis.checked = widgets[widgetName].disabled;
    } else {
        if ("disabled" in widgets[widgetName].defView.options.settings) {
            dis.checked = widgets[widgetName].defView.options.settings.disabled;
        } else {
            dis.checked = false;
        }
    }

    // check for existence of visible and append
    if ("visible" in widgets[widgetName] && typeof widgets[widgetName].visible !== "undefined") {
        vis.checked = widgets[widgetName].visible;
    } else {
        if ("visible" in widgets[widgetName].defView.options.settings) {
            vis.checked = widgets[widgetName].defView.options.settings.visible;
        } else {
            vis.checked = true;
        }
    }

    // check for existence of tooltip and append
    if ("tooltip" in widgets[widgetName] && typeof widgets[widgetName].tooltip !== "undefined") {
        toolt.value = widgets[widgetName].tooltip;
    } else {
        if ("tooltip" in widgets[widgetName].defView.options.settings) {
            toolt.value = widgets[widgetName].defView.options.settings.tooltip;
        } else {
            toolt.value = "";
        }
    }

    // check for existence of property and append
    if ("property" in widgets[widgetName] && typeof widgets[widgetName].property !== "undefined") {
        prop.value = widgets[widgetName].property;
    } else {
        if ("property" in widgets[widgetName].defView.options.settings) {
            prop.value = widgets[widgetName].defView.options.settings.property;
        } else {
            prop.value = "";
        }
    }

    // remove the events-based menu elements if we are showing the menu for a flow node
    if (widgets[widgetName].defView.options.settings.category.toUpperCase() !== "WIDGET") {
        document.getElementById("outerEventContainer").classList.add("hidden");
        document.getElementById("eventDivider").classList.add("hidden");
    }

    // if our options are empty remove one of the <hr>s so we don't get double separators
    if (widgetOpts.innerHTML === "") {
        document.getElementById("widgetSettingsDivider").classList.add("hidden");
    } else {
        if (document.getElementById("widgetSettingsDivider").classList.contains("hidden")) {
            document.getElementById("widgetSettingsDivider").classList.remove("hidden");
        }
    }

    // set the widget version text at the bottom of the toolbox
    document.getElementById("widgetVersion").innerHTML = "version: " + widgets[widgetName].defView.options.settings.version;

    // need to initialise our bootstrap tooltip
    // $('[data-toggle="tooltip"]').tooltip({
    //     trigger: 'hover'
    // });

    // Change the icons at the bottom.
    changeSideScreenTools("widget");
}

/**
 * Changes the icons at the bottom of the toolbox contextually to screens or widget
 * @param mode
 */
function changeSideScreenTools(mode) {
    if (mode.toUpperCase() === "WIDGET") {
        document.getElementById("sideScreenTools").style.display = "none";
        document.getElementById("widgetMenuTools").style.display = "inline";
    } else {
        document.getElementById("sideScreenTools").style.display = "inline";
        document.getElementById("widgetMenuTools").style.display = "none";
    }
}

/**
 * Rename screen & save the contents of an edited sidebar tab & update widget screen names
 * @param me
 */
function saveScreenText(me) {
    var tabInDom = me.parentNode.parentNode.parentNode;
    var oldName = tabInDom.id.split("~")[1].trim().replace("<p>", "").replace("</p>", "");
    var newName = me.innerHTML.trim().replace("<p>", "").replace("</p>", "");

    

    if (oldName !== newName) {                                                                          // Did I edit?
        if (newName.indexOf("'") !== -1 || newName.indexOf("~") !== -1 || newName.indexOf("\"") !== -1) {
            alert("Invalid character in screen name: No ~ or ' or \"");
            me.innerHTML = oldName;
            return false;
        }

        // if new name is empty, don't change the name. Revert it back to the old name
        if (newName == "") {
            me.innerHTML = oldName;
            return false;
        }

        Object.keys(screens).forEach(function (screen) {                                                // Check for uniqueness
            if (screen.toLowerCase() === newName.toLowerCase()) {
                alert("WARNING - new screen name '" + newName + "' is already a screen name. Please choose a unique screen name instead");
                me.innerHTML = oldName;                                                                 // revert back to old name
            }
        });

        if (me.innerHTML.trim() !== oldName) {                                                          // Passed uniqueness test
            screens[newName] = JSON.parse(JSON.stringify(screens[oldName]));                             // Copy old screen object into screen with new key name
            screens[newName].index = screens[oldName].index;
            delete screens[oldName];

            Object.keys(widgets).forEach(function (widget) {                                            // Rename the old screen in all widgets
                if (widgets[widget].screen === oldName) {
                    widgets[widget].screen = newName;
                }
            });

            if (g.flowEditor) {                                                                         // Adjust links to the new screen name
                for (var link = 0; link < links.length; link++) {
                    if (links[link].screen === oldName) {
                        links[link].screen = newName;
                    }
                }
            }

            tabInDom.id = "screenTab~" + newName;                                                       // Change name in the DOM

            selScreenName = newName;                                                                    // Change current screen global to the new name
            g.dirty = true;                                                                             // Due to the change, screens have to be saved back to server
        }
    }
}

// Helper for menu to select files. click the hidden file input tag and display selected file
function fileInputHelper() {
    var selFile = document.getElementById("selectedFile");
    selFile.addEventListener("change", function _setupImg(evt) {
        if (!evt) {
            evt = window.event;                                       // firefox
        }
        document.getElementById("menuFile").innerText = evt.currentTarget.files[0].name.split(".")[0];
        showImage(evt.currentTarget.files[0]);
        selFile.removeEventListener("change", _setupImg);
    });
    selFile.click();                                                                                                                // Emulate clicking on the hidden input to get the file dialogue
}

// Show the image after selecting the file, rather than waiting for the server upload (we still check upload worked by reloading the image with the server version)
function showImage(imgFile) {
    var reader = new FileReader();
    reader.onload = (function () {

        if (imgFile.name.endsWith(".mp4") || imgFile.name.endsWith(".mov")
            || imgFile.name.endsWith(".ogg") || imgFile.name.endsWith(".webm")) {
            // We have a video instead of image
            console.log(imgFile.size);
            if (imgFile.size > 40000000) {
                alert("ERROR - File Size of " + parseInt(imgFile.size / 1024) + "K Bytes for video file '" +
                    imgFile.name + "' is too large. Select a video of size less than 40M Bytes instead.");
                document.getElementById("menuFile").innerText = "none";
            } else {
                editData.defView.fw_designAction("LOCAL_RELOAD", reader.result);                   // Call the image load input function directly to show image
            }
        } else {
            if (imgFile.size > 2000000) {
                alert("ERROR - File Size of " + parseInt(imgFile.size / 1024) + "K Bytes for image file '" +
                    imgFile.name + "' is too large. Select an image of size less than 2M Bytes instead.");
                ///g.fileToBeSaved = false;
                document.getElementById("menuFile").innerText = "none";
            } else {
                editData.defView.fw_designAction("LOCAL_RELOAD", reader.result);                   // Call the image load input function directly to show image
                ///g.fileToBeSaved = true;
            }
        }
    });
    reader.readAsDataURL(imgFile);                                                                                  // Read in as base64
}

// Save widget attribute data based on the values set in the widget option menu (only save if not defaults)
function walkList(node, optionCnt) {
    var children = node.childNodes;
    for (var i = 0; i < children.length; i++) {
        optionCnt = walkList(children[i], optionCnt);                                                                                       // recursive find lowest sibling
    }

    if (node.attributes && node.attributes["data-type"] && node.attributes["data-key"]) {
        var attribKey = node.attributes["data-key"].value;
        switch (node.attributes["data-type"].nodeValue.toUpperCase().trim()) {                                                                                 // build the widget property menu based on attributes for the widget
            case "CHECKBOX":
                g.dirty = g.dirty || ((typeof widgets[editData.widgetName].attribs[attribKey] === "undefined") ? (String(widgets[editData.widgetName].defView.options.attribs[attribKey].default) !== String(node.checked)) : (String(widgets[editData.widgetName].attribs[attribKey]) !== (String(node.checked))));
                //g.dirty = g.dirty || (String(widgets[editData.widgetName].defView.options.attribs[attribKey]) !== String(node.checked)) || (widgets[editData.widgetName].attribs[attribKey] !== node.checked);
                widgets[editData.widgetName].attribs[attribKey] = String(node.checked);
                break;

            case "CHANNEL":                                                                                                         // Flows use a channel attribute
                g.dirty = g.dirty || ((typeof widgets[editData.widgetName].attribs[attribKey] === "undefined") ? (String(widgets[editData.widgetName].defView.options.attribs[attribKey].default) !== String(node.getAttribute("data-selected"))) : (String(widgets[editData.widgetName].attribs[attribKey]) !== (String(node.getAttribute("data-selected")))));
                //g.dirty = g.dirty || (widgets[editData.widgetName].attribs[attribKey] !== node.getAttribute("data-selected"));
                widgets[editData.widgetName].attribs[attribKey] = node.getAttribute("data-selected");
                widgets[editData.widgetName].attribs[attribKey] = constructChannel("FLOW", attribKey);
                //node.parentElement.parentElement.childNodes.forEach(function (child) {
                //    widgets[editData.widgetName].attribs[child.lastElementChild.attributes["data-key"]] = child.lastElementChild.value;
                //});
                var chChilds = node.parentElement.parentElement.childNodes;
                for (var i = 0; i < chChilds.length; i++) {
                    widgets[editData.widgetName].attribs[chChilds[i].lastElementChild.attributes["data-key"]] = chChilds[i].lastElementChild.value;
                }
                //TODO: The scope element in a channel is set as [object attrib] as the key instead of the key name "scope", it seems to work but could be a workaround somewhere else.
                break;

            case "SECTION":
                break;                                                                                                                      // No user editable option but need to increment optionCnt

            case "DROPDOWN":
                // if (typeof widgets[editData.widgetName].attribs[attribKey] !== "undefined") {
                //     g.dirty = (String(widgets[editData.widgetName].attribs[attribKey].trim().toLowerCase()) !== (String(node.value.trim().toLowerCase())));
                // } else {
                //     g.dirty = (String(widgets[editData.widgetName].defView.options.attribs[attribKey].default) !== String(node.value.trim().toLowerCase()));
                // }
                g.dirty = g.dirty || ((typeof widgets[editData.widgetName].attribs[attribKey] === "undefined") ? (String(widgets[editData.widgetName].defView.options.attribs[attribKey].default) !== String(node.value.trim().toLowerCase())) : (String(widgets[editData.widgetName].attribs[attribKey].trim().toLowerCase()) !== (String(node.value.trim().toLowerCase()))));
                //g.dirty = g.dirty || (widgets[editData.widgetName].attribs[attribKey] !== node.value.trim().toLowerCase());
                widgets[editData.widgetName].attribs[attribKey] = node.value.trim().toLowerCase();
                break;

            case "FILE":
                ///if (typeof node.files[0] !== "undefined" && g.fileToBeSaved) {
                if (node.files.length !== 0 && document.getElementById("menuFile").innerText !== "none") {
                    ///JAN19 need a timeout on readyToSave in case of problems else no saving will be allowed....
                    g.readyToSave = false;                                                          // Flag to stop saving widget collection until all the image is uploaded
                    var reader = new FileReader();
                    reader.onload = (function (myName) {
                        return function (evt) {
                            if (!evt) {
                                evt = window.event;                                       // firefox
                            }

                            var usrmeta = {};
                            var time = new Date();
                            usrmeta.fileName = node.files[0].name;
                            var fileType = node.files[0].type.split("/")[1].toUpperCase();
                            usrmeta.fileType = fileType == "PDF" ? fileType : "IMAGE";
                            usrmeta.location = "USERFILES";
                            usrmeta.metadata = {};
                            usrmeta.metadata.user = parent.sess.user.toUpperCase();
                            usrmeta.metadata.time = Math.round(time.getTime() / 1000).toString();

                            var sysmeta = {
                                source: "widget/" + myName,
                                label: "string"
                            }
                            parent.publishCmd("SAVEIMAGE", evt.currentTarget.result, sysmeta, usrmeta);
                            //g.dirty = g.dirty || (widgets[myName].attribs[attribKey] !== node.files[0].name);
                            g.dirty = true;                                                                             // Set to dirty even if name isn't changed (could be a new image old name)
                            widgets[myName].attribs[attribKey] = node.files[0].name;
                            ///g.fileToBeSaved = false;
                        };
                    })(editData.widgetName);
                    parent.status("Please wait while image file is uploaded to the server...", "IMPORTANT");                                     // See recvHost for image uploaded finalisation
                    reader.readAsDataURL(node.files[0]);                                                                                  // Read in as base64
                }
                break;

            case "TOOLTIP":
            case "TIME":
            case "DATE":
            case "SCOPE":
            case "COLOR":
            case "PASSWORD":
            case "TEXT":
            case "INPUT":
                g.dirty = g.dirty || ((typeof widgets[editData.widgetName].attribs[attribKey] === "undefined") ? (String(widgets[editData.widgetName].defView.options.attribs[attribKey].default) !== String(node.value.trim())) : (String(widgets[editData.widgetName].attribs[attribKey])) !== (String(node.value.trim())));
                widgets[editData.widgetName].attribs[attribKey] = node.value.trim();
                break;
                
            case "LABEL":
            case "DATA":
                g.dirty = g.dirty || ((typeof widgets[editData.widgetName].attribs[attribKey] === "undefined") ? (String(widgets[editData.widgetName].defView.options.attribs[attribKey].default) !== String(node.innerHTML)) : (String(widgets[editData.widgetName].attribs[attribKey].trim().toLowerCase()) !== (String(node.innerHTML))));
                //g.dirty = g.dirty || (widgets[editData.widgetName].attribs[attribKey] !== node.innerHTML);
                widgets[editData.widgetName].attribs[attribKey] = node.innerHTML;
                break;

            case "CODE":
                var newCode = editor.getValue();
                g.dirty = g.dirty || (widgets[editData.widgetName].attribs[attribKey] !== newCode);
                widgets[editData.widgetName].attribs[attribKey] = newCode;
                break;

            default:
                alert("ERROR - Incorrect Widget attribute tag '" + node.attributes["data-type"].nodeValue + "' value not set for widget");
        }
        optionCnt += 1;
    }
    return optionCnt;
}

function saveServerEventSettings(widgetName, name, node) {
    var children = node.childNodes;
    for (var i = 0; i < children.length; i++) {
        saveServerEventSettings(widgetName, name, children[i]);                                                                                       // recursive find lowest sibling
    }
    if (node.attributes && node.attributes["data-type"] && node.attributes["data-key"]) {
        var inputType = document.getElementById("serverinput").childNodes[1].value;                                                // Get the value of the server input type (eg. history, feed)
        var attribKey = node.attributes["data-key"].value;
        switch (node.attributes["data-type"].nodeValue.toUpperCase().trim()) {                                                                                 // build the widget property menu based on attributes for the widget
            case "CHECKBOX":
                g.dirty = g.dirty || ((typeof widgets[editData.widgetName].events.serverEvents.inputEvents[name].attribs[attribKey] === "undefined") ?
                    (String(widgets[editData.widgetName].defView.options.serverEvents.inputEvents[inputType].attribs[attribKey].default) !== String(node.value.trim().toLowerCase())) :
                    (String(widgets[editData.widgetName].events.serverEvents.inputEvents[name].attribs[attribKey].trim().toLowerCase()) !== (String(node.value.trim().toLowerCase()))));
                widgets[editData.widgetName].events.serverEvents.inputEvents[name].attribs[attribKey] = node.checked;
                break;

            case "TEXT":
                break;                                                                                                                      // No user editable option but need to increment optionCnt

            case "DROPDOWN":
                // TODO: Only caters for input events.....
                g.dirty = g.dirty || ((typeof widgets[editData.widgetName].events.serverEvents.inputEvents[name].attribs[attribKey] === "undefined") ?
                    (String(widgets[editData.widgetName].defView.options.serverEvents.inputEvents[inputType].attribs[attribKey].default) !== String(node.value.trim().toLowerCase())) :
                    (String(widgets[editData.widgetName].events.serverEvents.inputEvents[name].attribs[attribKey].trim().toLowerCase()) !== (String(node.value.trim().toLowerCase()))));
                widgets[editData.widgetName].events.serverEvents.inputEvents[name].attribs[attribKey] = node.value.trim().toLowerCase();
                break;

            case "INPUT":
                g.dirty = g.dirty || ((typeof widgets[editData.widgetName].events.serverEvents.inputEvents[name].attribs[attribKey] === "undefined") ?
                    (String(widgets[editData.widgetName].defView.options.serverEvents.inputEvents[inputType].attribs[attribKey].default) !== String(node.value.trim().toLowerCase())) :
                    (String(widgets[editData.widgetName].events.serverEvents.inputEvents[name].attribs[attribKey].trim().toLowerCase()) !== (String(node.value.trim().toLowerCase()))));
                widgets[editData.widgetName].events.serverEvents.inputEvents[name].attribs[attribKey] = node.value.trim();
                break;

            default:
                alert("ERROR - Incorrect Widget server event attribute tag '" + node.attributes["data-type"].nodeValue + "' value not set for widget");
        }
    }
}

// Delete widget button in settings toolbox
async function delWidgetClick() {
    if (typeof editData.widgetName === "undefined") {
        return;
    }
    let res = await parent.confirmModal("Confirm that you want to delete '" + editData.widgetName + "' (" + widgets[editData.widgetName].type.toUpperCase() + ")?", "Delete " + (g.flowEditor ? "Node" : "Widget"), { confirmText: "Delete" });
    if (res) {
        deleteWidgets([editData.widgetName]);
    }
}

/**
 * Delete widget and reset edit mode. (Needs to be in dashboard as brokenwidgets uses it)
 * @param widgetArr WidgetArr to remove widget from.
 */
function deleteWidgets(widgetArr) {
    widgetArr.forEach(function (widget) {
        var delWidget = document.getElementById(widget);

        if (delWidget) {
            if (g.design) {
                resetEdit(widget, "delete");

                parent.status("Deleted widget '" + widget + "' (" + widgets[widget].type + ")");

                if (g.flowEditor) {
                    delNode(widget);
                    // If I'm a flow node (and not in the toolbox), also delete my links
                }

                g.dirty = true;
            }
            // if widget exists in clipboard, delete clipboard
            if (Object.keys(clipboard)[0] != undefined) {
                if (Object.keys(clipboard)[0] === widget) {
                    delete clipboard[Object.keys(clipboard)[0]];
                }
            }
            delWidget.parentNode.removeChild(delWidget);
            // remove widget from DOM (if it exists). Used with error management as well, to delete a faulty widget on the dashboard
            delete widgets[widget];
            getScreenWidgets();
            // Refresh widgets on screen cache
        }
    });
}

function sideScreenTooltipShow(event) {
    var targetElem;
    if (event.target.tagName == "I") {
        targetElem = event.target.parentNode;
    } else if (event.target.tagName == "A") {
        targetElem = event.target;
    } else {
        return;
    }
    setTimeout(function () {
        let d = new Date();
        // Ensure at least 2s have passed before showing another tooltip
        if (d.getTime() - lastGlobalTooltipToggle < 2000) {
            return;
        }
        lastGlobalTooltipToggle = d.getTime();
        globalTooltip.classList.add("active");
        globalToolTipContent.innerHTML = targetElem.dataset.originalTitle;
        var targetDimensions = targetElem.getBoundingClientRect();

        // Position tooltip above icons
        globalTooltip.style.left = `${targetDimensions.x + 5}px`;
        globalTooltip.style.top = (targetDimensions.y - 25 - (globalTooltip.clientHeight / 2)) + 'px';
        globalTooltip.setAttribute('data-placement', 'right');

    }, 2000);
}

//#endregion
//#region ////////////////////////////////////////////////////////// Design mode

// Setup design
function setDesign(mode) {
    g.design = true;

    if (mode === "flows") {                                                                                                             // Set the global variables for mode
        g.flowEditor = true;

        // check for mobile and flow editing. Don't want to display the red line
        if (parent.sess.deviceType.toUpperCase() === "PHONE" || parent.sess.deviceType.toUpperCase() === "TABLET") {
            document.getElementById("widgetPhone").style.setProperty("visibility", "hidden");
        }

        document.getElementById("sidebarTitle").textContent = "Flows";
    } else {
        g.flowEditor = false;
        document.getElementById("sidebarTitle").textContent = "Screens";
    }

    //TODO: Could do this with a selector
    document.getElementById("toolboxIcon").setAttribute("data-original-title", (g.flowEditor) ? "Functions Toolbox" : "Widgets Toolbox");
    document.getElementById("toolboxTitle").innerHTML = (g.flowEditor) ? "Functions" : "Widgets";
    document.getElementById("sideScreenEditor").style.setProperty("display", "inline");
    document.getElementById("bold").addEventListener("mousedown", textBut);
    document.getElementById("italic").addEventListener("mousedown", textBut);
    document.getElementById("colorBut").addEventListener("mousedown", textBut);
    document.getElementById("setColorBut").addEventListener("mousedown", textBut);
    document.getElementById("incFont").addEventListener("mousedown", textBut);
    document.getElementById("decFont").addEventListener("mousedown", textBut);
    document.getElementById("remFormat").addEventListener("mousedown", textBut);
    document.getElementById("insChr").addEventListener("mousedown", textBut);
    colorCounter = 0;
    COLORS = ["txtBlack", "txtGrey", "txtGreen", "txtRed", "txtYellow", "txtBlue", "txtWhite"];

    var sideScreenLinks = document.querySelectorAll(".sidescreenlink");
    Array.from(sideScreenLinks).forEach(function(element) {
        element.addEventListener("mouseover", sideScreenTooltipShow);
        element.addEventListener("mouseout", hideGlobalTT);
    });
}

// Setup for text label formatting
function textBut(evt) {
    if (!evt)
        evt = window.event;                                       // firefox
    switch (evt.currentTarget.id) {
        case "bold":
            formatSel("bold");
            break;
        case "italic":
            formatSel("italic");
            break;
        case "setColorBut":
            if (editData.widgetObj.contentDocument.getSelection().getRangeAt(0) !== "") {
                var swatchColor = editData.widgetObj.contentDocument.defaultView.getComputedStyle(document.getElementById("colorBut"), null).getPropertyValue("background-color");
                var splitRgb = swatchColor.split(",");                              // Work around Edge bug, convert to hex
                formatSel("ForeColor", "#" + (+splitRgb[0].split("(")[1]).toString(16) + (+splitRgb[1]).toString(16) + parseInt(splitRgb[2]).toString(16));
            }
            break;
        case "colorBut":
            colorCounter = colorCounter + 1;                        // no text selected, so increment the color swatch
            if (typeof COLORS[colorCounter] === "undefined") colorCounter = 0;
            document.getElementById("colorBut").className = "buttonStyle " + COLORS[colorCounter];
            break;
        case "incFont":
            formatSel('fontSize', 1);
            break;
        case "decFont":
            formatSel('fontSize', -1);
            break;
        case "remFormat":
            formatSel('removeFormat', '0');
            break;
        case "insChr":
            var selRange = editData.widgetObj.contentDocument.getSelection().getRangeAt(0);
            var node = editData.widgetObj.contentDocument.createTextNode("[#]");
            selRange.insertNode(node);
            break;
    }
    evt.preventDefault();                                   // Allow editing to continue
}

// Format text using contenteditable execCommand
function formatSel(func, val) {
    if (func === "fontSize") {
        fontSize = editData.widgetObj.contentDocument.queryCommandValue("FontSize");                        // DOES NOT WORK IN IE
        fontSize = +fontSize + val;
        if (fontSize > 7) fontSize = 7;
        if (fontSize < 1) fontSize = 1;
        val = fontSize;
    }
    editData.widgetObj.contentDocument.execCommand(func, false, val);
    parent.status("Setting text to" + func + " " + val);
}

//#endregion
//#region ////////////////////////////////////////////////////////// Screens

//TODO: if the value in the widgets array is different to the setting in the DOM, then set the dirty flag, but don't set it to false if it is

async function deleteScreen() {
    let res = await parent.confirmModal("Confirm deletion of screen '" + selScreenName + "'.", "Delete Screen", { confirmText: "Delete" });
    if (res) {
        removeScreen(selScreenName);
    }
}

// Callback from delete screen modal
function removeScreen(screenName) {
    resetEdit();

    Object.keys(screens).forEach(function (screen) {
        if (screens[screen].index > screens[screenName].index) {
            screens[screen].index = screens[screen].index - 1;                                                                                    // Decrease screen index
        }
    });

    delete screens[screenName];

    Object.keys(widgets).forEach(function (widget) {
        if (widgets[widget].screen === screenName) {
            delete widgets[widget];
            if (g.flowEditor) {
                delNode(widget);
            }
        }
    });

    // bug caused by the fact that we don't remove parent.g.OldScreens.screen
    if (Object.keys(screens).length > 0) {
        var newIndex = Object.keys(screens).length - 1;
        Object.keys(screens).forEach(function (screen) {
            if (screens[screen].index === newIndex) {
                parent.setOldScreen(screen);
                //parent.g.oldScreens[0].screen = screen;
            }
        });
    }

    initScreens(screens);

    parent.status("Screen '" + screenName + "' deleted.");
    g.dirty = true;
}

//#endregion
//#region ////////////////////////////////////////////////////////// load toolbox widgets


/**
 * Create toolbox widget iFrames and labels
 */
function createToolboxWidgets() {
    ///JAN19 TODO: Cater for no widget filenames sent from server. Needs a timeout to show an error / backdrop if this function doesn't complete
    showWaiting("visible", "Please wait while toolbox is setup...", "NO_TIMEOUT");                                                                 // Set timeout removes chrome cache loading system message that overwrites status msg
    var names = (g.flowEditor) ? nodeNames : widgetNames;
    numTBWidgets = names.length;

    for (var num = 0; num < names.length; num++) {
        var widgetObj = document.createElement("iframe");
        widgetObj.src = (g.flowEditor ? "flownodes/" : "widgets/") + names[num] + ".html" + parent.sess.debugURL;                          // location of widget (and not from cache if debugging)
        widgetObj.id = "widgetObjTB#" + num;
        widgetObj.name = "widgetObjTB#" + num;
        widgetObj.addEventListener("load", function (event) {
            // Check for fw => no fw means syntax error.
            if (typeof event.target.contentDocument.defaultView.fw === "undefined") {
                badTbLoad(event.target.name);
            }
        }, true);

        widgetObj.addEventListener("error", (event) => {
            badTbLoad(event.target.name)
        }, true);

        var title = document.createElement("p");
        title.innerHTML = "<span><b>" + names[num] + "</b></span>";
        title.id = "TBTitle" + num;
        toolboxWidgets.push([widgetObj, title]);
    }

    displayToolboxContents(toolboxWidgets);
}

function badTbLoad(widgetName) {
    let badElem = document.getElementById(widgetName);
    badElem.parentNode.removeChild(badElem);
    numTBWidgets--;

    if (numTBWidgets === 0) {
        //clearTimeout(toolboxTimeout);
        showWaiting("hidden", "MODE", "");
        //widgetContainer.classList.add("grid-paper");                                // Show the background as graph paper
        categoriseWidgets();
    }
}


/**
 * Once the toolbox widgets are loaded we take them all and categorise
 * Create a folder div with container and title for each widget category
 * Option to just put all of the widget divs in the HTML to save space in this function
 */
function categoriseWidgets() {
    var container = document.createElement("div");                                                              // outer container for entire section
    container.className = "toolBoxContainer";

    // Use flowgroups or widgetgroups list of folder groups
    // Sort into alphabetical order
    var folderNameList = (g.flowEditor ? flowGroups : widgetGroups)
        .split(",")
        .sort(function (a, b) {
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            if (b.toLowerCase() < a.toLowerCase()) return 1;
            return 0;
        });

    folderNameList.forEach(function (folder) {
        var tbWidgets = document.querySelectorAll("#toolboxContents > div > div > iframe");                     // querySelectorAll is static. Once the DOM item is moved its reference still exists in the QS.
        var folderDiv = document.createElement("div");
        folderDiv.id = folder.toLowerCase();

        var folderTitle = document.createElement("div");
        folderTitle.className = "categoryTitle";
        folderTitle.innerHTML = folder + "<span class='categoryTitle'>&#9660;</span>";
        folderTitle.addEventListener("click", function () {
            if (document.getElementById(folderDiv.id).classList.contains("hidden")) {
                document.getElementById(folderDiv.id).classList.remove("hidden");
                folderTitle.innerHTML = folder + "<span class='categoryTitle'>&#9650;</span>";
            } else {
                document.getElementById(folderDiv.id).classList.add("hidden");
                folderTitle.innerHTML = folder + "<span class='categoryTitle'>&#9660;</span>";
            }
        });

        var folderContainer = document.createElement("div");
        folderContainer.className = "categoryGroup";
        folderContainer.appendChild(folderTitle);
        for (i = 0; i < tbWidgets.length; i++) {
            if (typeof tbWidgets[i].contentDocument.defaultView.options !== "undefined") {
                var opts = tbWidgets[i].contentDocument.defaultView.options;
                if (opts.settings.group.toUpperCase() === folder.toUpperCase()) {
                    folderTitle.innerHTML = folder + "<span class='categoryTitle'>&#9650;</span>";
                    folderDiv.appendChild(tbWidgets[i].parentNode);
                }
            }
        }

        folderContainer.appendChild(folderDiv);
        container.appendChild(folderContainer);
    });

    toolboxContents.innerHTML = "";
    toolboxContents.appendChild(container);

    // remove all the empty categories
    folderNameList.forEach(function (folder) {
        var elem = document.getElementById(folder.toLowerCase());
        var group = elem.parentNode;
        if (elem.childElementCount === 0) {
            group.parentNode.removeChild(group);
        }
    });
    toolboxLoaded = "LOADED";
}

function displayToolboxContents(widgetsArray) {
    toolboxContents.innerHTML = "";
    var docFrag = document.createDocumentFragment();

    // container for entire section
    var container = document.createElement("div");
    container.className = "toolBoxContainer";

    // main loop to parse through widgets
    for (var i = 0; i < widgetsArray.length; i++) {
        var item = document.createElement("div");

        item.appendChild(widgetsArray[i][0]);
        item.appendChild(widgetsArray[i][1]);

        container.appendChild(item);
    }

    console.log(`Loading toolbox widgets. Creating ${widgetsArray.length} widgets.`)
    docFrag.appendChild(container);
    toolboxContents.appendChild(docFrag);

    // Set globaltooltip to be of same width of toolbox
    // 2px for better presentation
    globalTooltip.style.width = (toolboxContents.childNodes[0].getBoundingClientRect().width + 5) + 'px';
}

var lastGlobalTooltipToggle = 0;
var globalTooltip = document.getElementById("global-dasb-tooltip");
var globalToolTipContent = document.getElementById("global-dasb-tooltip-text");

function hideGlobalTT() {
    globalTooltip.classList.remove("active");
    globalTooltip.style.left = '-100px';
    globalTooltip.style.top = '-100px';
    let d = new Date();
    lastGlobalTooltipToggle = d.getTime();
}

// finish toolbox widget load (note - loads twice as widget is moved between containers)
function widgetTBloaded(widgetName) { // event object won't persist outside function so use num as a parameter if recursion via timeout   
    console.log(`Toolbox widget '${widgetName}'s iframe loaded.`);

    var TBObj = document.getElementById(widgetName);

    var TBWidgetBody = TBObj.contentWindow.document.body;
    TBWidgetBody.addEventListener("mouseover", function (event) {
        try {
            var loadDoc = TBObj.contentDocument;
            var defView = loadDoc.defaultView;
            var tbTooltip = defView.options.settings.tbTooltip;
            if (typeof tbTooltip === "undefined") {
                tbTooltip = defView.options.settings.tooltip;                                                           // If no specific tooltip for the toolbox, use the general one instead
            }

            setTimeout(function () {
                let d = new Date();
                // Ensure at least 2s have passed before showing another tooltip
                if (d.getTime() - lastGlobalTooltipToggle < 2000) {
                    return;
                }
                lastGlobalTooltipToggle = d.getTime();

                globalTooltip.classList.add("active");
                globalToolTipContent.innerHTML = tbTooltip;
                var widgetElem = document.getElementById(event.view.name);
                var widgetDimensions = widgetElem.parentElement.getBoundingClientRect();

                globalTooltip.style.left = '0px';
                globalTooltip.style.top = (widgetDimensions.y - 40) + 'px';
                globalTooltip.setAttribute('data-placement', 'top');

            }, 2000);

        } catch (err) {
            alert("WARNING - widget type '" + defView.options.settings.type + "' is corrupt and taken out of the toolbox. Please check widget code to rectify.\nDETAILS:\n" + err.stack);
        }
    });
    TBWidgetBody.addEventListener("mouseout", hideGlobalTT);

    try {
        var loadDoc = TBObj.contentDocument;
        var defView = loadDoc.defaultView;

        TBObj.width = Math.min(TBWIDGETWIDTH, defView.options.settings.iniWidth);                                   // Set object size
        TBObj.height = Math.min(TBWIDGETWIDTH, defView.options.settings.iniHeight);

        if (typeof defView.fw_scale === "function") {
            defView.fw_scale(1, 1);
        }

        if (typeof defView.fw_toolStart === "function") {
            defView.fw_toolStart();
        }

        /* Disable the pins of flow nodes in the flows toolbox. Also changes
         * the cursor from the crosshair to the move cursor.
         *
         * --> Checks if the loaded document in a flow widget.
         * --> Gets the style sheets for the document.
         * --> Loops though the styles sheets.
         *  --> Loops through the rules of the stylesheet looking for the pins:hover rule.
         *      --> If found it changes the cursor style.
         * --> Removes the onmousedown attribute for the elements with the pins class.
         */
        if (defView.options.settings.category === "flow") {
            var sheets = defView.document.styleSheets;
            var slen = sheets.length;
            for (var i = 0; i < slen; i++) {
                var rules = defView.document.styleSheets[i].cssRules;
                var rlen = rules.length;
                for (var j = 0; j < rlen; j++) {
                    if (rules[j].selectorText === ".pins:hover") {
                        rules[j].style["cursor"] = "move";
                    }
                }
            }
            var pins = defView.document.getElementsByClassName("pins");
            var plen = pins.length;
            for (var i = 0; i < plen; i++) {
                defView.document.getElementById(pins[i].id).setAttribute("onmousedown", "");
            }
        }

        loadDoc.getElementById("widget").style.setProperty("cursor", "move");

        var myGroup = loadDoc.getElementById("group");                                                              // All widgets need to be wrapped with a DIV id of 'group' as we can't change SVG styles from the parent.
        if (myGroup) {
            myGroup.style.setProperty("cursor", "move");                                                            // Set cursor on group DIV (can't test for widget as SVG won't set cursor in style)
        }

        widgetListeners(loadDoc);

        var tbTooltip = defView.options.settings.tbTooltip;
        if (typeof tbTooltip === "undefined") {
            tbTooltip = defView.options.settings.tooltip;                                                           // If no specific tooltip for the toolbox, use the general one instead
        }

        // $('[id="' + widgetName + '"]').tooltip({
        //     title: defView.options.settings["tbTooltip"] ?? defView.options.settings.type,                                                           // Static tooltip for display in the widgets toolbox
        //     delay: {show: parent.g.TOOLTIPDELAY},
        //     boundary: "window",
        //     trigger: 'hover'
        // });


        numTBWidgets--;
        console.log(`Toolbox Widget ${defView.options.settings.type} loaded. (${numTBWidgets} remaining)`);
    } catch (err) {
        //TODO: In chrome, the error messages will be displayed twice because TBLoaded is run twice (once on load, another when moved to the folder container - Chrome behaviour)
        numTBWidgets--;
        var num = widgetName.split("#")[1]
        try {
            TBObj.parentNode.removeChild(document.getElementById("TBTitle" + num));                                                   // remove title
            TBObj.parentNode.removeChild(document.getElementById(widgetName));                                                                            // remove widget
        } catch (e) {
            Log.error(`Failed to remove widget '${defView.options.settings.type}' from the toolbox.`);
        }

        alert("WARNING - widget type '" + defView.options.settings.type + "' is corrupt and taken out of the toolbox. Please check widget code to rectify.\nDETAILS:\n" + err.stack);
    }
    // Count the widgets loaded and clear wait indicators as toolbox is loaded
    if (numTBWidgets === 0) {
        //clearTimeout(toolboxTimeout);
        showWaiting("hidden", "MODE", "");
        //widgetContainer.classList.add("grid-paper");                                // Show the background as graph paper
        categoriseWidgets();
    }
}

function searchToolbox(search) {
    toolboxContents.scrollTop = 0;

    for (var i = 0; i < toolboxWidgets.length; i++) {
        if (typeof toolboxWidgets[i][0].contentDocument !== "undefined" &&
            toolboxWidgets[i][0].parentElement !== null &&
            typeof toolboxWidgets[i][0].parentElement.parentElement !== "undefined") {
            if (search !== "" && toolboxWidgets[i][1].innerText.toUpperCase().trim().indexOf(search.toUpperCase().trim()) === -1) {
                toolboxWidgets[i][1].style.display = "none";
                toolboxWidgets[i][0].style.display = "none";
            } else {
                if (toolboxWidgets[i][1].parentElement.parentElement.classList.contains("hidden")) {
                    toolboxWidgets[i][1].parentElement.parentElement.classList.remove("hidden");
                    toolboxWidgets[i][1].parentElement.parentElement.parentElement.querySelector("span").innerHTML = "&#9650;";
                }

                toolboxWidgets[i][0].style.display = "initial";
                toolboxWidgets[i][1].style.display = "block";
            }
        }
    }
}

// Sets or resets waiting spinner indicator for the toolbox
function showWaiting(visibility, mode1, mode2) {
    spinner.style.setProperty("visibility", visibility);
    parent.status(mode1, mode2);
}

// Initialise a new widget created from dragging out the toolbox (called from dashboard.html)
function newWidgetLoaded(widgetName, loadObj) {
    ///JAN19 CHecking for 0 length may be a problem if a new widget or no attributes are specifically set, as we don't load defaults. Test this! May not be needed now
    if (Object.keys(widgets[widgetName].attribs).length > 0) {                                                                       // Chrome specific workaround as Chrome will call this load event twice, so remove previous attribs second time around to avoid duplicating settings
        widgets[widgetName].attribs = {};
    }

    widgetListeners(loadObj.contentDocument);                                                                           // Load listeners for new widget (we don't do it in loadWidget for speed)

    dragData.widgetObj = loadObj;                                                                                   // drag from toolbox needs to wait until widget created

    var myGroup = loadObj.contentDocument.getElementById("group");                                                       // All widgets need to be wrapped with a DIV id of 'group' as we can't change SVG styles from the parent.
    if (myGroup) {
        myGroup.style.setProperty("cursor", "move");                                                                                // Set cursor on group DIV (can't test for widget as SVG won't set cursor in style)
    }

    if (typeof loadObj.contentDocument.defaultView.fw_newWidget === "function") {
        //FEB20: THis isn't working as fw_xx isn't available at this point
        //loadObj.contentDocument.defaultView.fw_newWidget(widgetName.indexOf("TB#") !== -1 ? "DESIGN" : "TOOLBOX");
    }

    dragData.finishNewLoading = true;                                        // Sometimes mouseup is faster than load
}

//#endregion
//#region ////////////////////////////////////////////////////////// design mouse events

function designMouseDown(event) {
    // Reset edit before new change
    dragData = {};
    // Hide tooltip so it isn't stuck
    hideGlobalDasbTT();
    globalTooltipHidden = true;
    // In the event that the widget is corrupt, use the default name
    dragData.widgetName = event.target.ownerDocument.defaultView.fw != undefined ? 
        event.target.ownerDocument.defaultView.fw.widgetName : event.target.ownerDocument.defaultView.name;

    dragData.widgetObj = document.getElementById(dragData.widgetName);
    dragData.defView = dragData.widgetObj.contentDocument.defaultView;
    // hideTooltip(dragData.widgetName);

    tbWidth = document.getElementById("widgetSection").offsetLeft;                                                  // Width of toolbox

    if (dragData.widgetName.indexOf("TB#") === -1) {            // ---------- Dragging existing widget

        // convert back to pixels if in %
        if (widgets[dragData.widgetName].scaling.enabled) {
            return;
        }

        if (dragData.widgetObj.style.left.indexOf("%") !== -1) {
            dragData.widgetObj.style.setProperty("left", parseFloat(dragData.widgetObj.style.left) / 100 * widgetContainer.offsetWidth + "px");
        }

        if (dragData.widgetObj.style.top.indexOf("%") !== -1) {
            dragData.widgetObj.style.setProperty("top", parseInt(parseFloat(dragData.widgetObj.style.top) / 100 * widgetContainer.offsetHeight) + "px");
        }

        dragData.startX = parseInt(dragData.widgetObj.style.left) - event.screenX * winScale;                       // NOTE: screenX will vary depending on browser window location, but OK to use to calculate delta mouse movements if dragging
        dragData.startY = parseInt(dragData.widgetObj.style.top) - event.screenY * winScale;

        if (editData.dragHdls) {                                    // If edit mode is on and dragging, drag the draghandles
            if (editData.widgetName === dragData.widgetName) {      // But only if the widget I'm dragging is the one I'm editing
                dragData.dragHdlsTop = parseInt(editData.dragHdls.style.top) - event.screenY * winScale;
                dragData.dragHdlsLeft = parseInt(editData.dragHdls.style.left) - event.screenX * winScale;
            }
        }

        var myGroup = dragData.widgetObj.contentDocument.getElementById("group");
        if (myGroup) {
            myGroup.style.setProperty("cursor", "move");                                                         // Dragging cursor. Widget needs to be wrapped with "group" DIV
        }

        if (g.flowEditor) {
            startDragNode(dragData.widgetName, event.screenX, event.screenY);                                              // If in flow mode, check to see if the widget has links attached
        }

    } else {        // ---------- Setup for new widget. Dragging a widget on toolbox so setup new Widget just dragged to canvas
        dragData.finishNewLoading = false;
        dragData.startX = dragData.widgetObj.offsetLeft - event.screenX * winScale;
        dragData.startY = dragData.widgetObj.offsetTop - toolboxContents.scrollTop - event.screenY * winScale + TBYOFFSET;

        dragData.newWidget = true;

        var type = dragData.defView.options.settings.type;

        dragData.widgetName = getUniqueName(type);                                                     // Unique name based on type
        //////////////parent.status(dragData.widgetName + " " + dragData.widgetObj.offsetLeft + " " + (dragData.widgetObj.offsetTop - toolboxContents.scrollTop + TBYOFFSET), "IMPORTANT");

        widgets[dragData.widgetName] = new Widget(                                              // type, screen, locX, locY, scaleX, scaleY, zIndex, enabled, prop scaling, version
            type,
            selScreenName,
            dragData.widgetObj.offsetLeft,
            dragData.widgetObj.offsetTop - toolboxContents.scrollTop + TBYOFFSET,
            1,
            1,
            { enabled: false, scalingType: null, width: "", height: "", x: "", y: "" },
            dragData.defView.options.settings.version + "c" + parent.g.CLIENT_VER                              // created version string for widget ver #, dashboard #
        );

        var frag = document.createDocumentFragment();
        loadWidget(frag, dragData.widgetName);                                                                                         // create new Widget if dragging from widget template & don't run widget startup routine as attribs have not been set
        document.getElementById("mainBody").appendChild(frag);                                                                  // Add object to body so it can be dragged over everything
    }

    dragData.zindex = dragData.widgetObj.style.getPropertyValue("z-index");
    dragData.widgetObj.style.setProperty("z-index", ZINDEX_TOP);                                                                // Dragging widget make it sit on top of other widgets

    dragData.scrollLeft = widgetContainer.scrollLeft * winScale;
    dragData.scrollTop = widgetContainer.scrollTop * winScale;

    if (typeof dragData.widgetObj.contentDocument.defaultView.fw_dragged === "function") {
        dragData.widgetDragFunc = true;
    }

    document.addEventListener("mousemove", mouseMove, false);                                                                   // Ensures if cursor gets outside the widget boundary that the widget still tracks cursor
}

async function designMouseUp(event) {
    if (typeof dragData.widgetName !== "undefined") {                                                                         // Not being dragged, nothing to do
        try {
            var defView = dragData.widgetObj.contentDocument.defaultView;
            // showTooltip(dragData.widgetName);
            if (dragData.newWidget) {                           // ---------- New widget

                if (!dragData.finishNewLoading) {                                                   // Wait until the widget has rendered fully before trying to process
                    setTimeout(designMouseUp, event, 20);
                    return;
                }

                if (dragData.widgetObj.offsetLeft < tbWidth) {
                    // CHROME BUG: Very occassionally when clicking repeatedly a toolbox widget not dragging, the widget won't move over to the canvas properly.
                    var widgetsLen = Object.keys(widgets).length.toString();
                    var offset = parseInt(widgetsLen.charAt(widgetsLen.length - 1)) * 7;                                    // Add offset if clicking multiple times on toolbox widget so you can see each widget
                    dragData.widgetObj.style.setProperty("left", tbWidth + offset + "px");                                        // Move widget over to canvas if dropped on the toolbox
                    dragData.widgetObj.style.setProperty("top", parseInt(dragData.widgetObj.style.top) + offset + "px");
                }

                dragData.widgetObj.style.setProperty("left", parseInt(dragData.widgetObj.style.getPropertyValue("left")) + widgetContainer.scrollLeft - tbWidth + "px"); // adjust for widgetcontainer offset
                dragData.widgetObj.style.setProperty("top", parseInt(dragData.widgetObj.style.getPropertyValue("top")) + widgetContainer.scrollTop + "px"); // adjust for widgetcontainer offset

                // NOTE - the following section is browser dependent and delicate, if modifying ensure all browsers are tested
                widgetsDiv.appendChild(dragData.widgetObj);                                                     // Move from body to widget container
                dragData.widgetObj.addEventListener("load", function (event) {                              // the object is recreated when moved so need to reestablish listeners. IE does not fire load if widget moved between containers
                    dragData.widgetObj = event.currentTarget;
                    widgetListeners(dragData.widgetObj.contentDocument);                                    // Redo the listeners as we have moved the object (it shouldn't need reapplying but it does)
                    if (typeof defView.fw_newWidget === "function") {
                        defView.fw_newWidget();                                                             // Run widget created routine in widget if the routine exists
                    }
                    resetCursor(dragData.widgetObj);                                                        // Chrome / Edge
                    populateDefaultAttribs(event);
                }, false);

                ///JAN19 TODO Check that the options object is setup properly, else reject the new object.

                g.dirty = true;

                parent.status("New " + widgets[dragData.widgetName].type + " widget created (" + dragData.widgetName + ")", "IMPORTANT");

            } else {                                            // -------------- Existing widget

                if (widgets[dragData.widgetName].locX === parseInt(dragData.widgetObj.offsetLeft) && widgets[dragData.widgetName].locY === parseInt(dragData.widgetObj.offsetTop)) {
                    if (defView.fw != undefined && setEdit(dragData.widgetName) === -1) {
                        resetEdit(dragData.widgetName, "save");                                                        // Toggle edit mode if widget hasn't been dragged
                    } else {
                        let name = defView.fw == undefined ? defView.name : defView.fw.widgetName;
                        showWidgetMenu(name);
                    }
                } else {                                                                                       // Widget being dragged
                    g.dirty = true;
                }
                resetCursor(dragData.widgetObj);                                                        // Dragging existing widget
            }

            var snapLeft;
            var snapTop;
            if (dragData.widgetObj.style.getPropertyValue("left").indexOf("%") === -1 && g.snapToGrid) {
                snapLeft = parseInt(dragData.widgetObj.style.getPropertyValue("left"));
                dragData.widgetObj.style.setProperty("left", Math.round(snapLeft / DESIGNGRID) * DESIGNGRID + "px");
            }

            if (dragData.widgetObj.style.getPropertyValue("top").indexOf("%") === -1 && g.snapToGrid) {
                snapTop = parseInt(dragData.widgetObj.style.getPropertyValue("top"));
                dragData.widgetObj.style.setProperty("top", Math.round(snapTop / DESIGNGRID) * DESIGNGRID + "px");
            }

            widgets[dragData.widgetName].locX = parseInt(dragData.widgetObj.offsetLeft);
            widgets[dragData.widgetName].locY = parseInt(dragData.widgetObj.offsetTop);

            dragData.widgetObj.style.setProperty("z-index", dragData.zindex);                                       // Restore to old value

            if (nodeLinks.length > 0)
                endDragOldLinks(snapLeft - widgets[dragData.widgetName].locX, snapTop - widgets[dragData.widgetName].locY);      // If also dragging flow links, end link dragging with compensation for gridsnap
        } catch (err) {
            if (typeof widgets[dragData.widgetName].defView === "undefined") {                // Widget hasn't loaded yet, skipping
                await parent.alertModal("Please save your changes (if desired) and refresh your browser.", "Widget Load Failed");
                return;
            }
            editData = {};
            alert("WARNING - Problems with dragging widget '" + dragData.widgetName + "'.\nDETAILS:\n" + err.stack);
        }

        dragData = {};
        document.removeEventListener("mousemove", mouseMove, false);
        getFocus();                                                                     // When dragging links, keys won't work until focus is forced
    }
}

function designMouseMove(event) {
    if (dragData.widgetObj && !g.dragLink && widgets[dragData.widgetName] && !widgets[dragData.widgetName].scaling.enabled) { // only drag if not rescaling or not dragging a flow link & if I'm a new Widget from the toolbox I have been created

        var outXBounds = false;
        var outYBounds = false;
        var XOffset = (event.screenX + widgetContainer.scrollLeft) * winScale - dragData.scrollLeft;
        var YOffset = (event.screenY + widgetContainer.scrollTop) * winScale - dragData.scrollTop;
        var left = dragData.startX + XOffset;
        var top = dragData.startY + YOffset;

        if (left < 0) {
            left = 0;
            outXBounds = true;
        }

        if (top < 0) {
            top = 0;
            outYBounds = true;
        }

        dragData.widgetObj.style.setProperty("left", left + "px");
        dragData.widgetObj.style.setProperty("top", top + "px");

        // Update X and Y widget values if it is still the current widget.

        if (widgetNameInput && widgetNameInput.value === dragData.widgetName) {
            var widget = widgets[dragData.widgetName];
            if (widget.scaling.x.indexOf("px") === -1) {
                widget.scaling.x = Math.round(parseFloat(dragData.widgetObj.offsetLeft) / widgetContainer.offsetWidth * 10000) / 100 + "%";
                scalingXInput.value = widget.scaling.x;
            } else {
                scalingXInput.value = widget.scaling.x;
            }

            if (widget.scaling.y.indexOf("px") === -1) {
                widget.scaling.y = Math.round(parseFloat(dragData.widgetObj.offsetTop) / widgetContainer.offsetHeight * 10000) / 100 + "%";
                scalingYInput.value = widget.scaling.y;
            } else {
                scalingYInput.value = widget.scaling.y;
            }

            if (widget.scaling.width.indexOf("px") === -1) {
                widget.scaling.width = Math.round(parseFloat(dragData.widgetObj.offsetWidth) / widgetContainer.offsetWidth * 10000) / 100 + "%";
                scalingWidthInput.value = widget.scaling.width;
            } else {
                scalingWidthInput.value = widget.scaling.width;
            }

            if (widget.scaling.height.indexOf("px") === -1) {
                widget.scaling.height = Math.round(parseFloat(dragData.widgetObj.offsetHeight) / widgetContainer.offsetHeight * 10000) / 100 + "%";
                scalingHeightInput.value = widget.scaling.height;
            } else {
                scalingHeightInput.value = widget.scaling.height;
            }
        }

        if (editData.dragHdls) {               // Move draghandles if they are set
            if (!outXBounds) {
                editData.dragHdls.style.setProperty("left", dragData.dragHdlsLeft + XOffset + "px");
            }
            if (!outYBounds) {
                editData.dragHdls.style.setProperty("top", dragData.dragHdlsTop + YOffset + "px");
            }
        }

        if (nodeLinks) {
            if (outXBounds || outYBounds) {                                                                     // Logic optimised for performance
                if (outXBounds && !outYBounds) {
                    dragOldLink(-1, event.screenY);
                }
                if (!outXBounds && outYBounds) {
                    dragOldLink(event.screenX, -1);
                }
            } else {
                dragOldLink(event.screenX, event.screenY);                                                                          // Drag any flow links associated with flow widget
            }
        }

        //TODO: Compensate for boundaries
        if (dragData.widgetDragFunc) {
            event.currentTarget.defaultView.fw_dragged(event.clientX, event.clientY);
        }
    }
}

//#endregion
//#region ////////////////////////////////////////////////////////// widget edit state

/**
 * Grabs the defaults and puts them in the attribs to start with
 * Prevents bugs on the server if the widget toolbox is never opened.
 *
 * This function is either called from afterRender after a widget paste with param of the widgetname
 * OR after designMouseUp when a new widget is dragged onto the screen.
 * @param param
 */
function populateDefaultAttribs(param) {
    var widget = (typeof param.currentTarget === "undefined") ? param : param.currentTarget.id;

    Object.keys(widgets[widget].defView.options.attribs).forEach(function (attrib) {
        if (typeof widgets[widget].defView.options.attribs[attrib].default !== "undefined") {
            widgets[widget].attribs[attrib] = widgets[widget].defView.options.attribs[attrib].default;
        } else {
            alert("Widget " + widget + " has no default assigned for " + attrib + ". Please rectify");
        }
    });
}

/**
 * changes the name of a widget
 * @param oldName
 * @param newName
 * @return {the name of the new name on success, and the name of the old name on failure}
 */
function renameWidget(oldName, newName) {
    // Key isn't unique
    if (newName in widgets) {
        parent.status("WARNING - Change to widget name from '" + oldName + "' to '" + newName + "' hasn't been made as names must be unique, please choose a unique widget name and save again", "IMPORTANT");
        return oldName;

    } else if (widgets[oldName].type.toUpperCase() === newName.toUpperCase()) {
        // this is related to the bug where if you have two divs of the same ID everything dies
        parent.status("WARNING - Change to widget name from '" + oldName + "' to '" + newName + "' hasn't been made as names must be unique, please choose a unique widget name and save again", "IMPORTANT");
        return oldName;
    }

    // new name is null or empty value
    if (newName === null || newName === undefined || newName.trim() === "") {
        parent.status("WARNING - Change to widget name from '" + oldName + "' to '" + newName + "' hasn't been made as names must be valid", "IMPORTANT");
        return oldName;
    }

    delete widgets[oldName].defView;
    var data = JSON.stringify(widgets[oldName]);
    var newWidget = JSON.parse(data);
    newWidget.defView = editData.defView;
    widgets[newName] = newWidget;
    widgets[newName].defView.fw.widgetName = newName;
    delete widgets[oldName];

    document.getElementById(oldName).id = newName;
    editData.widgetName = newName;

    widgets[newName].defView.fw.widgetName = newName;

    updateLinkWidget(oldName, newName);                                                                 // Links have widget names, need to rename there as well.

    g.dirty = true;

    return newName;
}

function updateLinkWidget(oldName, newName) {
    links.forEach(function (linkNode) {
        if (linkNode.inpNodeName === oldName) {
            linkNode.inpNodeName = newName;
        }

        if (linkNode.outNodeName === oldName) {
            linkNode.outNodeName = newName;
        }
    });
}

// Start of a widget being edited
function setEdit(widgetName, param) {
    if (editData.widgetName === widgetName && param !== "force") {
        return -1;                                                                                      // Don't run setEdit on the same widget if it is already being edited
    }
    if (editData.widgetName)
        resetEdit(editData.widgetName, "save");                                                                                // turn off edit mode for any widget currently being edited

    editData.widgetName = widgetName;                                                                       // Start editing a new widget
    editData.widgetObj = document.getElementById(widgetName);
    editData.widgetEl = editData.widgetObj.contentDocument.getElementById("widget");
    editData.defView = editData.widgetObj.contentDocument.defaultView;

    window.focus();                                                                                         // Needed to ensure keyboard listeners are in focus

    var widgetReturn = "";
    if (typeof editData.defView.fw_startEdit === "function") {                           // Run widget edit function
        widgetReturn = editData.defView.fw_startEdit();
        if (widgetReturn === false) {
            return;                                                                     // Widget doesn't want to be edited
        }
        if (typeof widgetReturn !== "string") {                                                             // If undefined or true
            widgetReturn = "OK";
        }
    }

    editData.alreadyDirty = g.dirty;                                                                                // Am I dirty so that I don't always flag dirty if I cancel edit

    parent.status("Editing widget '" + widgetName + "' (" + widgets[widgetName].type + ")", "NO_TIMEOUT");
    editData.widgetObj.style.setProperty("outline", "gray dotted 1px");

    widgetReturn = widgetReturn.toUpperCase().trim();
    widgets[editData.widgetName].scaling.scalingType = widgetReturn;

    // Hide inputboxes otherwise
    var scalingWidthLabel = document.getElementById("scalingWidthLabel");
    var scalingHeightLabel = document.getElementById("scalingHeightLabel");

    if (widgetReturn.indexOf("NOVERT") !== -1 || widgetReturn.indexOf("NOSCALE") !== -1) {
        scalingHeightInput.style.setProperty("display", "none");
        scalingHeightLabel.style.setProperty("display", "none");
    } else {
        scalingHeightInput.style.setProperty("display", "block");
        scalingHeightLabel.style.setProperty("display", "");
    }

    if (widgetReturn.indexOf("NOHORIZ") !== -1 || widgetReturn.indexOf("NOSCALE") !== -1) {
        scalingWidthInput.style.setProperty("display", "none");
        scalingWidthLabel.style.setProperty("display", "none");
    } else {
        scalingWidthInput.style.setProperty("display", "block");
        scalingWidthLabel.style.setProperty("display", "");
    }

    // IF both, show atleast 1.
    if (widgetReturn.indexOf("NOHORIZ") !== -1 && widgetReturn.indexOf("NOVERT") !== -1) {
        scalingWidthInput.style.setProperty("display", "block");
        scalingWidthLabel.style.setProperty("display", "");
    }

    if (widgetReturn !== "NOSCALE" && !widgets[editData.widgetName].scaling.enabled) {                                                            // Widget can determine if they want to be scaled.
        var dragBoxes = document.createElement("div");                                                                                          // Create drag holders
        dragBoxes.id = "dragHdls";
        dragBoxes.appendChild(dragBox("n-resize", "dragY", "50%", "0px", widgetReturn === "NOVERT" || widgetReturn === "NOVERT,NOHORIZ" || widgetReturn === "NOHORIZ,NOVERT"));
        dragBoxes.appendChild(dragBox("e-resize", "dragX", "0px", "50%", widgetReturn === "NOHORIZ" || widgetReturn === "NOVERT,NOHORIZ" || widgetReturn === "NOHORIZ,NOVERT"));
        dragBoxes.appendChild(dragBox("se-resize", "dragXY", "0px", "0px", widgetReturn === "NOVERT" || widgetReturn === "NOHORIZ"));

        // set the zIndex of the original drag boxes so when set on screen we are at the correct position of the widget. Then adjust higher below
        dragBoxes.style.zIndex = editData.widgetObj.style.zIndex;
        widgetsDiv.appendChild(dragBoxes);

        editData.dragHdls = document.getElementById("dragHdls");

        if (dragData.newWidget)
            dragBoxes.setAttribute("style", "pointer-events:none; position:absolute; left:" + widgets[widgetName].locX + "px; top:" + widgets[widgetName].locY + "px; height:" +
                editData.defView.innerHeight + "px; width:" + (editData.defView.innerWidth - 10) + "px; z-index:" + ZINDEX_TOP);                       // ensure elements stay on top
        else
            dragBoxes.setAttribute("style", "pointer-events:none; position:absolute; left:" + widgets[widgetName].locX + "px; top:" + widgets[widgetName].locY + "px; height:" +
                editData.defView.innerHeight + "px; width:" + editData.defView.innerWidth + "px; z-index:" + ZINDEX_TOP);                       // ensure elements stay on top
    }
    if (editData.defView.fw != undefined) {
        editData.defView.fw.state = "EDIT";
    }
    // editData.defView.fw.state = "EDIT";

    // Set prop scaling fields
    populateProportionalScalingInputs(widgetName);

    toggleToolbox("settingsToolboxDiv", "open");
    editData.widgetEl.setAttribute("spellcheck", "true");
}

/**
 * Used to populate the inputs of the proportional scaling inputs in the
 * widget settings toolbox
 * @author Elijah Blowes
 * @param {String} widgetName - Name of the widget used to populate the inputs
 *  of the proportional scaling inputs
 */
function populateProportionalScalingInputs(widgetName) {
    if (typeof widgets[widgetName] === "undefined") {
        throw new Error("widget '" + widgetName + "' does not exist");
    }
    function throwError(id) {
        throw new Error("Could not find element with ID '" + id + "'");
    }
    function warnMissingProperty(prop) {
        cconsole.warn("widget '" + widgetName + "' property 'scaling' does not contain property '" + prop + "'");
    }
    var scalingWidthInput = document.getElementById("scalingWidthInput");
    var scalingHeightInput = document.getElementById("scalingHeightInput");
    var scalingXInput = document.getElementById("scalingXInput");
    var scalingYInput = document.getElementById("scalingYInput");

    if (typeof scalingWidthInput === "undefined") {
        throwError("scalingWidthInput");
    }
    if (typeof scalingHeightInput === "undefined") {
        throwError("scalingHeightInput");
    }
    if (typeof scalingXInput === "undefined") {
        throwError("scalingXInput");
    }
    if (typeof scalingYInput === "undefined") {
        throwError("scalingYInput");
    }

    if (!("scaling" in widgets[widgetName])) {
        throw new Error("widget '" + widgetName + "' does not contain 'scaling' property.");
    }

    if (!("width" in widgets[widgetName].scaling)) {
        warnMissingProperty("width");
    }
    scalingWidthInput.value = widgets[widgetName].scaling.width;

    if (!("height" in widgets[widgetName].scaling)) {
        warnMissingProperty("height");
    }
    scalingHeightInput.value = widgets[widgetName].scaling.height;

    if (!("x" in widgets[widgetName].scaling)) {
        warnMissingProperty("x");
    }
    scalingXInput.value = widgets[widgetName].scaling.x;

    if (!("y" in widgets[widgetName].scaling)) {
        warnMissingProperty("y");
    }
    scalingYInput.value = widgets[widgetName].scaling.y;
}

function dragBox(cursor, id, right, bottom, disabled) {
    var dragEl = document.createElement("div");
    dragEl.setAttribute("id", id);
    var inColor = "white";

    if (disabled) {                                                                                                                             // Option to disable the scroll handles
        inColor = "gray";
        cursor = "default";
    } else
        dragEl.addEventListener("mousedown", widgetResizeStart, false);                                                                         // start resize when pressing mouse on the resize handle                                                                      // start resize when pressing mouse on the resize handle

    dragEl.setAttribute("style", "pointer-events:auto; background-color:" + inColor + ";border:solid gray;border-width:2px;position:absolute;z-index:" + ZINDEX_TOP + ";cursor:" + cursor + ";right:" + right + ";width:" + GRABSIZE +
        "px;bottom:" + bottom + ";height:" + GRABSIZE + "px;");
    return dragEl;
}

// Turn off editing and close toolbox
function resetEdit(widgetName, option) {
    var statusMsg;
    if (option === "save") {
        statusMsg = "widget '" + widgetName + "' settings saved. Press Save again to save " + (g.flowEditor ? "Flows" : "Screens");
        var myWidget = widgets[widgetName];

        var newEvtCont = document.getElementById("newEventContainer");
        if (typeof newEvtCont.classList === "undefined" || (!newEvtCont.classList.contains("hidden"))) {
            if (!saveEvent(widgetName)) {
                return;
            }
        }

        walkList(document.getElementById("attribContainer"), 0);                                                                   // recursive save all the menu settings based on nodes with widget data-type attribute
        walkList(document.getElementById("generalAttribContainer"), 0);

        // if the value in widgetname has changed, call the function to change the widget name
        var nameValue = document.querySelector("#widgetNameDiv input").value;
        var newName;
        if (nameValue !== widgetName) {
            // TODO: The code below is confusing - doing an equate and comparison in the same line. Split the lines and test all conditions
            if ((newName = renameWidget(widgetName, nameValue)) === widgetName) {
                // renameWidget function displays status message based on whether it is invalid, or not-unique
            } else {
                widgetName = newName;
                myWidget = widgets[widgetName];
                editData.defView.fw.widgetName = newName;
            }
        }

        // take z-index out of dropdown and place into widgets[widgetName].defView.options.settings["zIndex"]
        var zval = document.getElementById("widgetZIndex");
        var disabled = document.getElementById("widgetEnabled").checked;
        var visible = document.getElementById("widgetVisible").checked;
        var toolt = document.getElementById("widgetTooltip").value;
        var prop = document.getElementById("widgetProperty").value;
        var scalingEnabled = document.getElementById("scalingEnabled");

        // Save widget attribs only if they are different to the default values in options;
        // secondary condition that we only change back if they are dashboard widgets, we must save attribs for flownodes
        if (!g.flowEditor) {
            Object.keys(myWidget.attribs).forEach(function (attrib) {

                if (typeof myWidget.defView.options.attribs[attrib] !== "object" || !("default" in myWidget.defView.options.attribs[attrib])) {
                    alert("WARNING - Widget '" + widgetName + "' (" + myWidget.type + ") attribute '" + attrib + "' does not have a default, so won't be saved. Add a default to the widget 'options' object to rectify.");
                    delete myWidget.attribs[attrib];                                                                        // Remove attribs that are same as default or null to save network & loadtimes
                } else {
                    if (myWidget.defView.options.attribs[attrib].default === myWidget.attribs[attrib] || myWidget.attribs[attrib] === null) {
                        if (!g.flowEditor) {                                                                    // For flows, always save all attribs (too hard to have server work out options object)
                            delete myWidget.attribs[attrib];                                                                        // Remove attribs that are same as default or null to save network & loadtimes
                        }
                    }
                }
            });
        }

        // Save changes with scaling.
        myWidget.scaling.enabled = scalingEnabled.checked;

        // reset checkbox
        scalingEnabled.checked = false;
        var xInput = document.getElementById("scalingXInput").value;
        var yInput = document.getElementById("scalingYInput").value;
        var widthInput = document.getElementById("scalingWidthInput").value;
        var heightInput = document.getElementById("scalingHeightInput").value;

        myWidget.scaling.x = xInput;
        myWidget.scaling.y = yInput;
        myWidget.scaling.width = widthInput;
        myWidget.scaling.height = heightInput;

        document.getElementById("scalingXInput").value = "";
        document.getElementById("scalingYInput").value = "";
        document.getElementById("scalingWidthInput").value = "";
        document.getElementById("scalingHeightInput").value = "";

        // Convert back prop scaling if unchecked.

        myWidget.locX = parseInt(document.getElementById(widgetName).offsetLeft);
        myWidget.locY = parseInt(document.getElementById(widgetName).offsetTop);

        var sel = zval[zval.selectedIndex].value;
        if (typeof "zIndex" in myWidget !== "undefined") {
            if (String(sel) !== String(myWidget.zIndex)) {
                widgets[widgetName].zIndex = sel;                                                           // Save the value if it isn't the default value in options
            }
        }

        if (sel !== "ZINDEX_DEFAULT") {
            document.getElementById(widgetName).style.zIndex = sel;
        } else {
            document.getElementById(widgetName).style.zIndex = "120";
        }

        if (typeof myWidget.disabled === "undefined" && disabled) {
            myWidget.disabled = true;
        } else if (myWidget.disabled !== disabled) {
            myWidget.disabled = disabled;
        }

        if (myWidget.disabled) {
            document.getElementById(widgetName).style.opacity = "0.5";
        } else {
            document.getElementById(widgetName).style.opacity = "1.0";
        }

        myWidget.visible = visible;
        widgets[widgetName].tooltip = toolt;
        setTooltip(widgetName, widgets[widgetName].tooltip);

        if (typeof prop !== "undefined" && prop !== "") {
            widgets[widgetName].property = prop;
        }
    } else if (widgetName) {
        statusMsg = "Cancelled any setting changes to widget '" + widgetName + "'.";
    }

    ///JAN19 TODO: Check that when a new widget is launched, it does not have any attribs or settings and that defaults are used. Else if the widget is never opened for settings, the attribs/setting pruning won't happen
    toggleToolbox("settingsToolboxDiv", "close");                                                                                   // cancel widget option menu if open
    toggleToolbox("codeToolboxDiv", "close");                                                                                   // close code if open.

    g.menuOpen = false;

    if (typeof editData.defView !== "undefined") {
        if (typeof editData.defView.fw_endEdit === "function") {                                             // Label widget needs to run endedit to remove toolbar
            if (editData.defView.fw_endEdit(option) === -1) {
                // toggleToolbox("settingsToolboxDiv", "close");
                // toggleToolbox("codeToolboxDiv", "close"); 
                return -1;
            }
        }                                                                                                         // call widget end edit routine, if it returns -1, then don't reset edit state
        if (editData.defView.fw != undefined) {
            editData.defView.fw.state = "DESIGN";
        }
        // editData.defView.fw.state = "DESIGN";
        editData.widgetObj.style.setProperty("outline", "none");
        if (editData.dragHdls)                                                                                                      // Dragholders active, remove them
            editData.dragHdls.parentNode.removeChild(editData.dragHdls);
        editData.widgetEl.setAttribute("spellcheck", "false");


        if (typeof editData.defView.fw_scale === "function" && editData.defView.fw != undefined) {                                             // Label widget needs to run endedit to remove toolbar
            proportionalScaling(editData.defView, widgets[editData.widgetName]);
            editData.defView.fw_scale(widgets[widgetName].scaleX, widgets[widgetName].scaleY);
            editData.widgetObj.style.setProperty("width", Math.round(widgets[widgetName].scaleX * editData.defView.options.settings.iniWidth) + "px");
            editData.widgetObj.style.setProperty("height", Math.round(widgets[widgetName].scaleY * editData.defView.options.settings.iniHeight) + "px");
        }

        // Update x and y pos if enabled
        if (widgets[editData.widgetName].scaling.x !== "" && widgets[widgetName].scaling.y !== "" && widgets[widgetName].scaling.enabled) {

            // Check if is a percentage
            if (widgets[widgetName].scaling.x.indexOf('%') !== -1
                && widgets[widgetName].scaling.x.indexOf('px') !== -1
                && (widgets[widgetName].scaling.x.indexOf('-') !== -1 || widgets[widgetName].scaling.x.indexOf('+') !== -1)) {
                editData.widgetObj.style.setProperty("left", "calc(" + widgets[widgetName].scaling.x + ")");
            } else {
                editData.widgetObj.style.setProperty("left", widgets[widgetName].scaling.x);
            }

            if (widgets[widgetName].scaling.y.indexOf('%') !== -1
                && widgets[widgetName].scaling.y.indexOf('px') !== -1
                && (widgets[widgetName].scaling.y.indexOf('-') !== -1 || widgets[widgetName].scaling.y.indexOf('+') !== -1)) {
                editData.widgetObj.style.setProperty("top", "calc(" + widgets[widgetName].scaling.y + ")");
            } else {
                editData.widgetObj.style.setProperty("top", widgets[widgetName].scaling.y);
            }
        }

        editData = {};
    }

    if (statusMsg) {
        parent.status(statusMsg);
    }
}


//#endregion
//#region ////////////////////////////////////////////////////////// widget resize

/**
 * @author Elijah Blowes
 * @description A mousedown + mouseup event causes a click event (e.g. canvasClick). However, in the case of dragging to scale widgets we don't want this canvas click to be called. Therefore, we set a flag in the widgetContainer on mousedown event so that inside the widget drag event we can check and change the value of the flag. This prevents the canvasClick function being called and the settings toolbox being closed after a drag.
 */

widgetContainer.addEventListener("mousedown", function (e) {
    editData.dragged = false;
}, true);

// Click the canvas blank areas (not widgets)
widgetContainer.addEventListener("click", canvasClick, true);               // bubble down to widgets
function canvasClick(e) {
    parent.closeHelpSidebar();
    if (g.design) {
        if (editData.widgetName && !editData.dragged) {
            resetEdit(editData.widgetName, "save");                   // turn off editing for any widget being edited
        }
        if (dragData.widgetName) {
            dragData = {};
        }
    }
    editData.dragged = false;
    return false;
}

function widgetResizeStart(event) {
    // Used to prevent canvasClick() from calling resetEdit();
    editData.dragged = true;
    editData.dragID = event.currentTarget.getAttribute("id");
    editData.startX = event.screenX * winScale - (widgets[editData.widgetName].scaleX - 1) * editData.defView.options.settings.iniWidth;                      // mouse absolute position in the widgetcontainer
    editData.startY = event.screenY * winScale - (widgets[editData.widgetName].scaleY - 1) * editData.defView.options.settings.iniHeight;
    editData.initialWidth = parseInt(editData.defView.innerWidth / widgets[editData.widgetName].scaleX);
    editData.initialHeight = parseInt(editData.defView.innerHeight / widgets[editData.widgetName].scaleY);
    editData.aspect = editData.defView.innerWidth / editData.defView.innerHeight;

    if (editData.dragID === "dragX")
        editData.dragHdls.style.setProperty("cursor", "e-resize");
    if (editData.dragID === "dragY")
        editData.dragHdls.style.setProperty("cursor", "n-resize");
    if (editData.dragID === "dragXY")
        editData.dragHdls.style.setProperty("cursor", "se-resize");

    //TODO: Would this be easier if we just put one listener on the whole IFrame (document.addEventListener)?
    var allWidgets = document.querySelectorAll(".widget");
    for (var i = 0; i < allWidgets.length; i++) {
        addScaleListeners(allWidgets[i].contentDocument);                                                                                   // As <objects> swallow events, need to put listeners on each widget on the canvas to allow mouse to move over another widget when resizing
    }
    addScaleListeners(document.getElementById("dragHdls"));
    addScaleListeners(widgetContainer);

    editData.scaling = true;
    event.stopPropagation();                                                                                                                // Don't bubble up to widget mousedown event
    event.preventDefault();
    return false;
}

function addScaleListeners(obj) {
    obj.addEventListener("mousemove", mouseMoveDrag, false);
    obj.addEventListener("touchmove", mouseMoveDrag, false);
    obj.addEventListener("mouseup", widgetResizeEnd, false);
    obj.addEventListener("touchend", widgetResizeEnd, false);
}

// only allow either X dragging, Y dragging, or proportional XY dragging
function mouseMoveDrag(event) {
    if (editData.scaling) {
        var editDataWidget = widgets[editData.widgetName];
        var editDataObj = editData.widgetObj;
        var newWidth = 0;
        var newHeight = 0;
        editData.oldWidth = parseInt(editDataObj.clientWidth);

        var sizeChange;
        if (editData.dragID !== "dragY") {              // Width or width/height drag
            newWidth = Math.round((editData.initialWidth + event.screenX * winScale - editData.startX) / DESIGNGRID) * DESIGNGRID;                 // only allow grid gap increments
            sizeChange = "Width: " + parseInt(newWidth * 100 / editData.initialWidth) + "%";

            if (newWidth < 10) {                                                  // Stop scaling if very small
                newWidth = 10;
            }

            editDataObj.style.width = newWidth + "px";
            editDataWidget.scaleX = newWidth / editData.initialWidth;

            editData.widgetEl.style.setProperty("width", newWidth + "px");
            editData.dragHdls.style.setProperty("width", newWidth + "px");
        }

        if (editData.dragID !== "dragX") {              // Height or width/height drag
            newHeight = Math.round((editData.initialHeight + event.screenY * winScale - editData.startY) / DESIGNGRID) * DESIGNGRID;

            if (editData.dragID === "dragXY") {         // width/height drag
                newHeight = newWidth / editData.aspect;                            // proportional scaling
                sizeChange = parseInt(newHeight * 100 / editData.initialHeight) + "%";
            } else {
                sizeChange = "Height: " + parseInt(newHeight * 100 / editData.initialHeight) + "%";
            }

            if (newHeight < 10) {
                newHeight = 10;
            }

            editDataObj.style.height = newHeight + "px";
            editDataWidget.scaleY = newHeight / editData.initialHeight;

            editData.widgetEl.style.setProperty("height", newHeight + "px");
            editData.dragHdls.style.setProperty("height", newHeight + "px");
        }

        if (typeof editData.defView.fw_scale === "function") {
            editData.defView.fw_scale(editDataWidget.scaleX, editDataWidget.scaleY);
        }

        // Update prop scaling width and height
        var widgetContainer = document.getElementById("widgetContainer");
        document.getElementById("scalingWidthInput").value = Math.round(parseFloat(editDataObj.offsetWidth) / widgetContainer.offsetWidth * 10000) / 100 + "%";
        document.getElementById("scalingHeightInput").value = Math.round(parseFloat(editDataObj.offsetHeight) / widgetContainer.offsetHeight * 10000) / 100 + "%";

        // Adjust any flows that can scale (eg. test.html)
        if (g.flowEditor) {
            moveLinks(editData.widgetName, newWidth !== 0 ? editData.oldWidth - newWidth : 0, 0);     // Adjust height & widget with draghandles (moveLinks uses delta). Don't change height, hard to track
        }

        parent.status("Scaling " + sizeChange);
        event.preventDefault();                                                                                         // Don't bubble up to widget mousedown event
    }
}

function widgetResizeEnd(event) {
    editData.scaling = false;
    var allWidgets = document.querySelectorAll(".widget");
    for (var i = 0; i < allWidgets.length; i++) {
        removeScaleListeners(allWidgets[i].contentDocument);
    }

    removeScaleListeners(document.getElementById("dragHdls"));
    removeScaleListeners(widgetContainer);

    editData.widgetEl.style.setProperty("cursor", "default");
    g.dirty = true;
    event.stopImmediatePropagation();
    editData.dragged = true;
}

function removeScaleListeners(obj) {
    if (obj) {
        obj.removeEventListener("mousemove", mouseMoveDrag, false);
        obj.removeEventListener("mouseup", widgetResizeEnd, false);
    }
}

//#endregion
//#region ////////////////////////////////////////////////////////// widget events


function copyPaste() {
    // if we've not copy/pasted before, or we're pasting a widget that's not the copyPasteTarget or the clipboard is empty
    if (copyPasteTarget !== editData.widgetName || typeof Object.keys(clipboard)[0] === "undefined") {
        copyPasteTarget = editData.widgetName;
        copyWidget();
    }

    // now just paste the widget
    pasteWidget();
}

function copyWidget() {
    var myType = widgets[editData.widgetName].type;                                             // Save as resetEdit will delete editData
    var myName = editData.widgetName;                                                           // Save as editData is deleted in resetEdit
    resetEdit(myName, "save");                                                                  // Saves any changes made
    var saveDoM = widgets[myName].defView;
    delete widgets[myName].defView;                                                             // Can't stringify DOM links
    delete clipboard[Object.keys(clipboard)[0]];
    var stringClip = JSON.stringify(widgets[myName]);                                           // Stringify so we copy by value not reference
    clipboard[myName] = stringClip.replace("ZINDEX_DEFAULT", ZINDEX_DEFAULT);                   // Widget collection uses the zIndex default string which we have to replace with the actual
    widgets[myName].defView = saveDoM;                                                          // Put back the DoM links
    setEdit(myName, "force");
    parent.status(myType + " widget '" + myName + "' copied to clipboard");
}

/**
 * Paste a clone of a copied widget onto the screen.
 */
function pasteWidget() {
    var clipKey = Object.keys(clipboard)[0];
    var newWidget = JSON.parse(clipboard[clipKey]);
    newWidget.locX = newWidget.locX + 15;                                                       // Add offset so you can see the copied version
    newWidget.locY = newWidget.locY + 15;
    newWidget.screen = selScreenName;                                                           // Copy to current screen
    var newName = getUniqueName(newWidget.type);
    widgets[newName] = newWidget;
    parent.status("Copy of " + newWidget.type.trim() + " widget pasted with name '" + newName + "'", "IMPORTANT");
    widgetToLoadCnt++;
    var frag = document.createDocumentFragment();
    loadWidget(frag, newName);
    // create new Widget
    widgetsDiv.appendChild(frag);
    clipboard[clipKey] = JSON.stringify(newWidget);
    // Save with new offset X/Y
    // Overrides browser Ctrl-V function
    return newName;
}

// Used for creating new widgets (eg. copy) to get a unique key
function getUniqueName(type) {
    var partName = type + "#";
    // would it be better to just loop while bigger than 0 until we have success?
    for (var i = 0; i < Object.keys(widgets).length; i++) {
        if (!widgets[partName + i]) {                                                       // Look for matching key name in widgets object (fastest for lookup) until we don't get a match
            break;
        }
    }
    return partName.toString() + i;
}

function copyScreen() {
    parent.status("Setting up new screen...");
    var oldScreenName = selScreenName;

    //var maxScreenNum = getMaxScreenNum();
    var maxScreenNum = Object.keys(screens).length;

    while (((g.flowEditor ? "New Flow " : "New Screen ") + maxScreenNum) in screens) {
        maxScreenNum++;
    }

    var newScreenName = (g.flowEditor ? "New Flow " : "New Screen ") + maxScreenNum;


    //Check if new name already exists?
    screens[newScreenName] = new screen(Object.keys(screens).length, g.flowEditor ? DEF_FLO_SCR_ICO : DEF_WID_SCR_ICO, null);          // create new screen entry in screen object

    var oldScreenWidgets = Object.keys(widgets).filter(function (widget) {
        return widgets[widget].screen === oldScreenName
    });

    var mapOldNew = {};

    oldScreenWidgets.forEach(function (widget) {

        var newName = getUniqueName(widgets[widget].type);
        mapOldNew[widget] = newName;
        var oldWidget = widgets[widget];
        delete oldWidget.defView;                                                       // Can't copy a DOM reference
        var newWidget = JSON.parse(JSON.stringify(oldWidget));                        // Deep copy widget
        newWidget.screen = newScreenName;
        widgets[newName] = newWidget;                                                       // Copy old widget with new name and new screen
    });

    links.forEach(function (link) {
        if (link.screen === oldScreenName) {                                            // Only copy links on the current screen
            var newLink = JSON.parse(JSON.stringify(link));
            newLink.screen = newScreenName;
            newLink.inpNodeName = mapOldNew[newLink.inpNodeName];                   // Swap old link widget name with new name
            newLink.outNodeName = mapOldNew[newLink.outNodeName];                   // Swap old link widget name with new name
            links.push(newLink);
        }
    });

    selScreenName = oldScreenName;                                                  // NewScreen changes the current screen global, set it back so the new screen can be selected/active
    createTab(newScreenName);
    selectedTab(newScreenName);

    parent.status("New screen '" + newScreenName + "' copied from screen '" + oldScreenName + "'");
}

//#endregion
//#region ////////////////////////////////////////////////////////// Manage flow links
//TODO: Would be better for maintainability to remove the widget mouse drag eventlisteners, replace with flow listeners then put back widget listeners once done. But hard to do....
var editLink = {};                                                                                                  // Hold editing state
var nodeLinks = [];                                                                                                 // Links on a node when dragging
var NodeLink = function (linkName, inp, currX, currY, pathMx, pathMy, pathEx, pathEy, path, obj) {
    this.linkName = linkName;                         // Link number we will drag
    this.inp = inp;                                 // Boolean am I an input node?
    this.currX = currX;                             // Current X,Y used to work out relative change from original position for redrawing
    this.currY = currY;
    this.pathMX = pathMx;                           // Save the original path points for recalculating new points
    this.pathMY = pathMy;
    this.pathEX = pathEx;
    this.pathEY = pathEy;
    this.path = path;                               // Link path object
    this.obj = obj;                                 // Link object
    this.scrollLeft = widgetContainer.scrollLeft;
    this.scrollTop = widgetContainer.scrollTop;
    this.oldScreenX;                                // Save for blocking dragging when node is out of bounds
    this.oldScreenY;
};
// Array of the link associations between nodes
var Link = function (inpNodeName, inpNodeType, inpPin, outNodeName, outNodeType, outPin, path, screen) {
    this.inpNodeName = inpNodeName;                   // Input node object name
    this.inpNodeType = inpNodeType;                 // Function of the input node
    this.inpPin = +inpPin;                           // Pin of input node I'm connected to
    this.outNodeName = outNodeName;                   // Output node object name
    this.outNodeType = outNodeType; // Function of the output node
    this.outPin = +outPin;                           // Pin of output node I'm connected to
    this.path = path;                               // Path reference
    this.screen = screen;                           // Screen that the flow widget is on
    this.selected = false;                          // Link has been selected (for delete)
};

// Check the current screen to see if passes integrity checks
function flowScreenError() {
    var badLink = false;
    for (var i = 0; i < links.length; i++) {
        if (links[i].screen === selScreenName) {
            links[i].selected = false;                                                                                  // Turn off the selected flag
            if (links[i].inpNodeName === null || links[i].outNodeName === null) {                                             // Check link integrity before saving
                setLinkSel(document.getElementById("path" + i), i); // Highlight faulty link
                alert("WARNING - Not saved, link #" + i + " isn't connected to a flow widget. Please check links and redo faulty link before saving.");
                links[i].selected = true;
                badLink = true;
            }
        }
    }

    // Make sure all the links are attached to widgets on the same screen (corruption check)
    for (var i = 0; i < links.length; i++) {
        if (links[i].screen === selScreenName) {
            if (widgets[links[i].inpNodeName].screen !== links[i].screen) {
                alert("WARNING - Not saved, link #" + i + " is connected to the input of widget '" + links[i].inpNodeName + "' which is on another page (corruption check). Please delete and redo faulty link before saving.");
                badLink = true;
            }
            if (widgets[links[i].outNodeName].screen !== links[i].screen) {
                alert("WARNING - Not saved, link #" + i + " is connected to the output of widget '" + links[i].inpNodeName + "' which is on another page (corruption check). Please delete and redo faulty link before saving.");
                badLink = true;
            }
        }
    }

    var startLinks = [];                                                                                            // Get number of starting links to do recursion check
    for (var i = 0; i < links.length; i++) {
        if (links[i].screen === selScreenName) {
            var outNode = links[i].outNodeType.toUpperCase();
            if (outNode === "START" || outNode === "INTERVAL" || outNode === "AGGREGATE") {
                startLinks.push(i);
            }
        }
    }

    //JAN19 TODO: How to check for recursion that happens across screens (output on one screen is input on another screen with output back to initial screen input)

    for (var i = 0; i < startLinks.length; i++) {
        var startCh = getWidgetAttrib(links[startLinks[i]].outNodeName, "channel", "");                             // Note case sensitive
        var startSc = getWidgetAttrib(links[startLinks[i]].outNodeName, "input", "scope");
        recursiveLoopCnt = 0;
        if (typeof startCh !== "undefined" && typeof startSc !== "undefined") {
            if (flowRecursionCheck(startLinks[i], startCh, startSc, startLinks[i])) {
                badLink = true;
                break;                                                                                              // No need to check for more
            }
        } else {
            if (!links[startLinks[i]].outNodeType.toUpperCase() === "INTERVAL") {                                   // Interval generates its own data so can be ignored
                alert("No starting channel or scope on " + links[startLinks[i]].outNodeName);
            }
        }
    }

    //TODO: Check for widgets without links except test, label, container, notes
    //TODO: STart and End nodes which are configured but have no links

    //TODO: Once the above is completed, there is no need for the below sections
    var foundStart = false;
    var foundEnd = false;
    Object.keys(widgets).forEach(function (widget) {
        if (widgets[widget].screen === selScreenName) {
            var widgetType = widgets[widget].defView.options.settings.type.trim().toUpperCase();
            if (widgetType === "START" || widgetType === "INTERVAL" || widgetType === "AGGREGATE") {
                foundStart = true;
            }
            if (widgetType === "END") {
                foundEnd = true;
            }
        }
    });

    if (!foundStart) {
        parent.statusBar.status({
            message: "WARNING - There is no starting node added to the flow in screen '" + selScreenName + "'. Flows saved but that particular branch won't be active."
        });
        Log.warn("There is no starting node added to the flow in screen '" + selScreenName + "'. Flows saved but that particular branch won't be active.")
    }
    if (!foundEnd) {
        parent.statusBar.status({
            message: "WARNING - There is no ending node added to the flow in screen '" + selScreenName + "'.Flows saved but that particular branch won't be active."
        });
        Log.warn("There is no ending node added to the flow in screen '" + selScreenName + "'.Flows saved but that particular branch won't be active.")
    }

    return badLink;
}

var recursiveLoopCnt = 0;
// TODO these alerts neet to be converted to our native alert system.
function flowRecursionCheck(checkLink, startCh, startSc, startLink) {
    var outLinks = [];
    recursiveLoopCnt = recursiveLoopCnt + 1;
    if (recursiveLoopCnt === 100) {
        alert("WARNING - Not saved, > 100 links in a flow or recursion detected for start link #" + startLinks[i].nodeName + ". Please check links and remove recursion or split flow into smaller flows before saving.");
        return true;
    }
    // Find all links that are attached to the output node on this link (including start)
    for (var link = 0; link < links.length; link++) {
        if (links[link].outNodeName === links[checkLink].outNodeName) {
            outLinks.push(link);                                        // save link with same output pin as the one being checked for later checking
        }
    }
    for (var outLink in outLinks) {
        if (links[outLinks[outLink]].inpNodeType.toUpperCase() === "END") {
            var endCh = getWidgetAttrib(links[outLinks[outLink]].inpNodeName, "channel", "");                                        //TODO: Could this be consolidated with getAttribMap function?
            var endSc = getWidgetAttrib(links[outLinks[outLink]].inpNodeName, "input", "scope");
            if (endCh === startCh) {
                if (endSc === "" && startSc === "") {
                    
                    alert("WARNING - Not saved, start node #" + links[startLink].outNodeName + " has the same channel as end node '" + links[outLinks[outLink]].inpNodeName + "' without any scope, likely recursion error will occur. Please adjust node channel configurations before saving.");
                    return true;
                }
                if (endSc === startSc) {
                    alert("WARNING - Not saved, start node #" + links[startLink].outNodeName + " has the same channel and scope as end node '" + links[outLinks[outLink]].inpNodeName + "', likely recursion error will occur. Please adjust node channel configurations before saving.");
                    return true;
                }
                if (endSc === "") {
                    alert("WARNING - Not saved, start node #" + links[startLink].outNodeName + " has the same channel as end node '" + links[outLinks[outLink]].inpNodeName + "' and end node does not have scope, likely recursion error will occur. Please adjust node channel configurations before saving.");
                    return true;
                }
                if (startSc === "") {
                    alert("WARNING - Not saved, start node #" + links[startLink].outNodeName + " has the same channel as end node '" + links[outLinks[outLink]].inpNodeName + "' and start node does not have scope, likely recursion error will occur. Please adjust node channel configurations before saving.");
                    return true;
                }
            }
        } else {
            for (var nextLink in links) {
                if (links[outLinks[outLink]].inpNodeName === links[nextLink].outNodeName) {
                    if (flowRecursionCheck(nextLink, startCh, startSc, startLink))                   // Next link in flow
                        return true;
                    break;
                }
            }
        }
    }
    recursiveLoopCnt = recursiveLoopCnt - 1;
    return false;
}

// Helper function that searches widget attribs array for the first specified type, where the name contains (or ignore name if contains == "")
function getWidgetAttrib(nodeName, type, contains) {
    for (var attrib in widgets[nodeName].attribs) {
        if (attrib in widgets[nodeName].defView.options.attribs) {
            if (widgets[nodeName].defView.options.attribs[attrib].type.toUpperCase() === type.toUpperCase()) {
                if (contains === "" || attrib.toUpperCase().indexOf(contains.toUpperCase()) !== -1) {
                    return widgets[nodeName].attribs[attrib].toUpperCase();
                }
            }
        }
    }
}

// Save flows and send to server
function saveFlows(flowWidgets) {
    if (parent.g.startRest) {
        if (!flowScreenError()) {
            for (var i = 0; i < links.length; i++) {
                delete links[i].selected;
            }

            flowWidgets.links = JSON.parse(JSON.stringify(links));

            for (var i = 0; i < links.length; i++) {
                links[i].selected = false;
            }
            parent.publishCmd("SAVENODES", flowWidgets, { "source": "client/flows" });                                                       // Save the flows with the widgets

            setTimeout(function () {
                parent.publishCmd("GETCHANNELS", parent.sess.user, { "source": "client/saveFlows" }, parent.sess.permissions.indexOf("developer") > -1 ? true : false);                 // Add system channels if I'm a developer role
            }, 2500);                                                                                                        // Wait for server to reinitialise the flows & refresh channels

            return true;
        } else {
            parent.status("WARNING - Screens have not been saved due to error which would corrupt server flow processing, fix problems and re-save.");
            return false;
        }
    } else {
        parent.statusBar.status({
            message: "Waiting for all flow screens to load before saving"
        });
        setTimeout(saveFlows, 20, flowWidgets);
        return false;
    }
}

// Rebuild the links when drawing a new screen
function rebuildLinks() {
    for (var i = 0; i < links.length; i++) {
        if (links[i].screen === selScreenName) {                                                                    // Is our node on the screen?

            var linkToDel = document.getElementById("link" + i);
            if (linkToDel) {
                linkToDel.parentNode.removeChild(linkToDel);                                                        // Delete if existing (chrome workaround for rebuilding links when new nodes added)
            }

            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("id", "path" + i);
            path.setAttribute("d", links[i].path);                                                              //TODO: Put in CSS style.css
            path.setAttribute("style", "overflow:visible; fill: none; stroke: " + COMPLETED_LINK_COLOUR + "; stroke-width: 4px; pointer-events: visibleStroke; cursor: pointer");      // bubble up mouse events
            svg.setAttribute("style", "overflow:visible; position: absolute; left: 0; top: 0; width:100%; height:100%; z-index:" + FLOW_ZINDEX + "; pointer-events: none");                        // Don't process mouse events
            svg.setAttribute("id", "link" + i);
            svg.appendChild(path);
            var arrow = linkArrow(path, svg.id);                                                                                 // Put arrow after path so that click event still works when cursor is near arrow
            svg.appendChild(arrow);
            widgetsDiv.appendChild(svg);
            path.addEventListener("click", linkSelected, false);                                                    // Allow user to click link for link deletion, listener gets deleted automatically when editlink is deleted
            arrow.addEventListener("click", linkSelected, false);                                                   // Add arrow to click
        }
    }
}

var tt = 0
// Move links when using keyboard to move the node
function moveLinks(nodeName, xDir, yDir) {
    startDragNode(nodeName, 0, 0);
    endDragOldLinks(xDir, yDir);
}

// When dragging a node, drag any connected links
function startDragNode(nodeName, currX, currY) {
    for (var i = 0; i < links.length; i++) {                                                        // Save the input and output link data associated with the node
        if (links[i].inpNodeName === nodeName || links[i].outNodeName === nodeName) {
            var pathSplit = links[i].path.split(" ");                               // Extract the relevant positions for the path

            nodeLinks.push(new NodeLink(i,
                links[i].inpNodeName === nodeName,
                currX,
                currY,
                +pathSplit[1],
                +pathSplit[2],
                +pathSplit[8],
                +pathSplit[9],
                document.getElementById("path" + i),
                document.getElementById("link" + i),
                widgetContainer.scrollLeft,
                widgetContainer.scrollTop,
                currX,
                currY
            ));
            var arrowToDel = document.getElementById("arrow" + i);
            if (arrowToDel) {
                arrowToDel.parentNode.removeChild(arrowToDel);                                                                // Remove arrow before dragging link
                nodeLinks[nodeLinks.length - 1].path.style.setProperty("stroke", HIGHLIGHT_LINK_COLOUR);
            } else {
                parent.status("WARNING - Link #" + i + " attached to this node does not exist - likely link file is corrupt.");
            }
        }
    }
}

// Adjust path of the links on the node being dragged
function dragOldLink(newX, newY) {
    for (var i = 0; i < nodeLinks.length; i++) {
        var myLink = nodeLinks[i];

        var newXSize;
        var newYLoc;
        if (newX === -1) {                                      // Don't adjust X if out of bounds
            newX = nodeLinks[i].oldScreenX;
        } else {
            nodeLinks[i].oldScreenX = newX;
        }
        if (newY === -1) {                                      // Don't adjust Y
            newY = nodeLinks[i].oldScreenY;
        } else {
            nodeLinks[i].oldScreenY = newY;
        }
        if (myLink.inp) {                                                                                                   // Dragging input links
            newXSize = (myLink.pathEX - myLink.pathMX - myLink.scrollLeft + (newX - myLink.currX + widgetContainer.scrollLeft) * winScale) / 3;
            newYLoc = (myLink.currY - newY) * winScale;
            if (myLink.path) {
                myLink.path.setAttribute("d", "M " + myLink.pathMX + " " + myLink.pathMY + " C " + (myLink.pathMX + newXSize * 1.5) + " " + myLink.pathMY +
                    " " + (myLink.pathMX + newXSize * 1.5) + " " + (myLink.pathEY - newYLoc - myLink.scrollTop + widgetContainer.scrollTop) + " " + (myLink.pathMX + newXSize * 3) + " " + (myLink.pathEY - myLink.scrollTop - newYLoc + widgetContainer.scrollTop));
            } else {
                parent.status("WARNING - Link path does not exist. Link may be corrupt. Delete and re-add.");
            }
        } else {                                                                                                            // Dragging output links
            newXSize = (myLink.pathEX - myLink.pathMX + (newX - myLink.currX) * winScale) / 3;
            newYLoc = (myLink.currY - newY) * winScale;
            if (myLink.path) {
                myLink.path.setAttribute("d", "M " + (myLink.pathMX + (newX - myLink.currX) * winScale) + " " + (myLink.pathMY - newYLoc) + " C " + (myLink.pathMX + newXSize * 1.5) + " " + (myLink.pathMY - newYLoc) +
                    " " + (myLink.pathMX + newXSize * 1.5) + " " + myLink.pathEY + " " + myLink.pathEX + " " + myLink.pathEY);
            } else {
                parent.status("WARNING - Link path does not exist. Link may be corrupt. Delete and re-add.");
            }
        }
    }
}

// Finish dragging all the links on the node being dragged
function endDragOldLinks(snapX, snapY) {
    for (var i = 0; i < nodeLinks.length; i++) {
        var myLink = nodeLinks[i];

        var splitPath = myLink.path.getAttribute("d").split(" ");
        var myPath;
        if (myLink.inp) {                                                                                                   // Dragging input links
            myPath = "M " + splitPath[1] + " " + splitPath[2] + " C " + splitPath[4] + " " + splitPath[5] + " " + splitPath[6] + " " +
                splitPath[7] + " " + (+splitPath[8] - snapX) + " " + (+splitPath[9] - snapY);
        } else {
            myPath = "M " + (+splitPath[1] - snapX) + " " + (+splitPath[2] - snapY) + " C " + splitPath[4] + " " + splitPath[5] + " " + splitPath[6] + " " +
                splitPath[7] + " " + splitPath[8] + " " + splitPath[9];                                                        // Adjust for snap to grid of node
        }
        myLink.path.setAttribute("d", myPath);                                                        // Adjust for snap to grid of node

        var arrow = linkArrow(myLink.path, "link" + myLink.linkName);
        myLink.obj.appendChild(arrow);                                                           // Add flow arrow adjusted for flow angles

        myLink.path.style.setProperty("stroke", COMPLETED_LINK_COLOUR);                         // remove highlight colour

        links[myLink.linkName].path = myPath;                                                    // Update array

        myLink.path.addEventListener("click", linkSelected, false);                                       // Allow user to click link for link deletion, listener gets deleted automatically when editlink is deleted
        arrow.addEventListener("click", linkSelected, false);                                               // Add arrow to click
    }
    nodeLinks = [];
}

// Setup for staring drawing a new Link
function startNewLink(type, nodeName, pinXOffset, pinYOffset, pinNum) {
    g.dragLink = true;
    editLink = {};
    editLink.nodeName = nodeName;
    editLink.type = type;
    editLink.pinNum = pinNum;

    editLink.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    editLink.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    editLink.path.id = "path" + links.length;                                                          //TODO: Put in CSS style.css
    editLink.path.setAttribute("style", "overflow:visible; fill: none; stroke: " + HIGHLIGHT_LINK_COLOUR + "; stroke-width: 4px; cursor: pointer; pointer-events: visibleStroke");       // Bubble up mouse events
    editLink.svg.setAttribute("style", "overflow:visible; position: absolute; left: 0; top: 0; width: 100%; height:100%; z-index:" + FLOW_ZINDEX + "; pointer-events: none");                                       // SVG covers complete canvas but let mouse events through
    editLink.svg.id = "link" + links.length;
    editLink.svg.appendChild(editLink.path);
    widgetsDiv.appendChild(editLink.svg);

    var node = document.getElementById(nodeName);
    editLink.pinX = +node.style.getPropertyValue("left").replace("px", "") + pinXOffset;            // Align to center of pin (363 versus clientX)
    editLink.pinY = +node.style.getPropertyValue("top").replace("px", "") + pinYOffset;
    editLink.startX = 0;                                                                               // Use a different method for tracking mouse events with firefox (screenX/Y)
    editLink.startY = 0;

    document.removeEventListener("mousemove", mouseMove, false);                                    // Draw the SVG when the mouse is dragged over the canvas
    document.addEventListener("mousemove", mouseDraw, false);
    document.addEventListener("mouseup", endNewLink, false);                                        // clicking anywhere on the canvas while still drawing but not over a node pin will cancel the path (use undefined parameters to signal to endNewFlow)

    var myWidgets = document.getElementsByClassName("widget");
    for (var num = 0; num < myWidgets.length; num++) {
        myWidgets[num].contentDocument.addEventListener("mousemove", mouseDraw, false);         // Allow mouse events to be handled here when cursor is passing over object
        myWidgets[num].contentDocument.addEventListener("mouseup", endNewLink, false);              // If dropping the link over the widget but not on the pin, end the link dragging
    }
    parent.status("Starting new flow link...", "IMPORTANT");
}

// Draw the SVG Path based on mouse position relative to parent DOM and include object offset when over an object
function mouseDraw(event) {
    if (editLink.startX === 0) {                                                                    // Save starting position
        editLink.startX = event.screenX * winScale;
        editLink.startY = event.screenY * winScale;
    }

    var newX = parseInt((event.screenX * winScale - editLink.startX) / 3, 10);         // set beizer curve have the 2 control points to be 1/4 the X length of the curve (Y same as start & end points)

    editLink.cX1 = editLink.pinX + newX * 1.5;
    editLink.cY1 = editLink.pinY;
    editLink.cX2 = editLink.pinX + newX * 1.5;
    editLink.cY2 = event.screenY * winScale - editLink.startY + editLink.pinY;
    editLink.path.setAttribute("d", "M " + editLink.pinX + " " + editLink.pinY + " C " + editLink.cX1 + " " + editLink.cY1 + " " + editLink.cX2 + " " + editLink.cY2 + " "
        + (event.screenX * winScale - editLink.startX + editLink.pinX) + " " + (event.screenY * winScale - editLink.startY + editLink.pinY));
}

// Finalise the link path
function endNewLink(type, nodeName, pinXOffset, pinYOffset, pinNum) {
    g.dragLink = false;
    dragData = {};                                                                                          // reset drag
    endDragOldLinks(0, 0);
    if (typeof editLink.path === "undefined") {
        return;
    }

    var badLink = false;                                                                                    // First lets check the connection integrity to avoid corrupting links array
    if (typeof nodeName === "undefined") {                                                                  // Not connected to another node
        badLink = true;
        nodeName = "";
    }

    for (var i = 0; i < links.length; i++) {                                                                // Check for duplicate links
        if (editLink.type === "outPin" && links[i].outNodeName === editLink.nodeName && editLink.pinNum === links[i].outPin &&
            links[i].inpNodeName === nodeName && links[i].inpPin === pinNum) {
            badLink = true;
            alert("WARNING - Link already exists.");
            break;
        }
        if (editLink.type === "inPin" && links[i].inpNodeName === editLink.nodeName && editLink.pinNum === links[i].inpPin &&
            links[i].outNodeName === nodeName && links[i].outPin === pinNum) {
            badLink = true;
            alert("WARNING - Link already exists.");
            break;
        }
    }

    if (nodeName === editLink.nodeName && type === editLink.type && pinNum === editLink.pinNum)                                     // Clicking on pin rather than dragging, ignore
        badLink = true;

    if (editLink.nodeName === null || nodeName === null) {
        badLink = true;
        alert("WARNING - The link is missing an input or output connection with a widget pin, please reconnect the link.");
    }

    if (editLink.inpNodeName === null) {
        badLink = true;
        alert("WARNING - The end of this link isn't associated with a pin on a widget, please reconnect the link.");
    }

    if (!badLink && type === editLink.type) {
        badLink = true;
        if (type === "inPin")
            alert("WARNING - Can't connect input pins to input pins, connect to an output pin instead.");
        else
            alert("WARNING - Can't connect output pins to output pins, connect to an input pin instead.");
    }

    if (!badLink && editLink.nodeName === nodeName) {
        badLink = true;
        alert("WARNING - Can't connect to myself, connect to another node instead.");
    }

    if (!badLink) {                                                 // Only allow connections from inputs to outputs (if nodename is undefined we have not been called from widget). Don't allow connection back to myself
        try {
            var node = document.getElementById(nodeName);

            editLink.path.setAttribute("d", "M " + editLink.pinX + " " + editLink.pinY + " C " + editLink.cX1 + " " + editLink.cY1 + " " + editLink.cX2 + " " + editLink.cY2 + " "
                + (+node.style.getPropertyValue("left").replace("px", "") + pinXOffset) + " " + (+node.style.getPropertyValue("top").replace("px", "") + pinYOffset)); // Align to center of pin
            editLink.path.style.setProperty("stroke", COMPLETED_LINK_COLOUR);

            var nodeType = node.contentDocument.defaultView.options.settings.type;            // Flow node type
            var editNodeType = document.getElementById(editLink.nodeName).contentDocument.defaultView.options.settings.type;

            if (editLink.type === "outPin")                                                                      // Save link. Could be connected from input pin to output pin or visa versa
                links.push(new Link(nodeName,
                    nodeType,
                    +pinNum,
                    editLink.nodeName,
                    editNodeType,
                    +editLink.pinNum,
                    editLink.path.getAttribute("d"),
                    selScreenName
                ));
            else {                                  // InPin
                var splitPath = editLink.path.getAttribute("d").split(" ");
                editLink.path.setAttribute("d", "M " + splitPath[8] + " " + splitPath[9] + " C " + splitPath[6] + " " + splitPath[7] + " " + splitPath[4] + " " +
                    splitPath[5] + " " + splitPath[1] + " " + splitPath[2]);

                links.push(new Link(editLink.nodeName,
                    editNodeType,
                    +editLink.pinNum,
                    nodeName,
                    nodeType,
                    +pinNum,
                    editLink.path.getAttribute("d"),
                    selScreenName
                ));
            }

            //var arrow = linkArrow(editLink.path, editLink.svg.id, editLink.type);
            var arrow = linkArrow(editLink.path, editLink.svg.id);
            editLink.svg.appendChild(arrow);                                                                    // Add flow arrow adjusted for flow angles
            editLink.svg.style.setProperty("z-index", FLOW_ZINDEX);                                                   // Links go under widgets (z-index 100)

            editLink.path.addEventListener("click", linkSelected, false);                                       // Allow user to click link for link deletion, listener gets deleted automatically when editlink is deleted
            arrow.addEventListener("click", linkSelected, false);                                               // Add arrow to click

            parent.status("New flow connection link #" + links.length + " created", "IMPORTANT");

            var recursive;
            if (type === "inPin")                                                                               // Check for recursion - Does any link chain starting at NodeNameTo become an input to nodeNameFrom
                recursive = walkLinks(editLink.nodeName, nodeName);
            else
                recursive = walkLinks(nodeName, editLink.nodeName);
            if (recursive) {
                alert("WARNING - Possible infinite loop detected due to this link connecting to an existing chain of links that connect to the input of this node." +
                    "Please double check for recursion and delete this link if necessary.");
                setLinkSel(editLink.path, links.length - 1);                                                      // Highlight the link
            }

            //TODO: What do we do if the flow puts the output back into the same channel, infinite loop? Check the input channel in a flow and the output channel if they are the same there is a possibility

            // There are widgets that will respond to different scenarios based on the connected pins. Call dashstart on the widgets
            // only perform this once we know for sure that we have a successful and non broken link
            if (typeof widgets[nodeName].defView.fw_dashStart === "function") {
                widgets[nodeName].defView.fw_dashStart();
            }

            g.dirty = true;
        } catch (err) {
            alert("WARNING - Can't establish link to the node you are connecting, possible incorrect HTML in node body.\nDETAILS:\n" + err.stack);
            if (editLink.svg.parentNode)
                editLink.svg.parentNode.removeChild(editLink.svg);
            parent.statusBar.clear();
        }
    } else {                                                                                                // Not selecting a valid pin to end the link
        if (editLink.svg.parentNode) {
            editLink.svg.parentNode.removeChild(editLink.svg);
        }
        parent.statusBar.clear();
    }

    document.removeEventListener("mousemove", mouseDraw, false);
    document.removeEventListener("mouseup", endNewLink, false);

    var myWidgets = document.getElementsByClassName("widget");

    for (var num = 0; num < myWidgets.length; num++) {
        myWidgets[num].contentDocument.removeEventListener("mousemove", mouseDraw, false);                  // Allow mouse events to be handled when cursor is passing over object
        myWidgets[num].contentDocument.removeEventListener("mouseup", endNewLink, false);                   // If dropping the link over the widget but not on the pin, end the link dragging
    }
}

// Check the chain of links from the node at the end of this link to ensure we dont have links creating infinite loops
function walkLinks(startNodeName, nextNodeName) {
    for (var i = 0; i < links.length; i++) {
        if (links[i].outNodeName === nextNodeName) {
            if (links[i].inpNodeName === startNodeName) {
                return true;
            } else {
                return walkLinks(startNodeName, links[i].inpNodeName);                                                 // Recursively check all links
            }
        }
    }
    return false;
}

// Calculate arrow size and position for link
function linkArrow(path, svgid) {
    var pathLength = path.getTotalLength();
    var midLink = path.getPointAtLength(pathLength / 2);
    var pt1 = (path.getPointAtLength(pathLength / 2 - 5));                                                  // get gradient angle of curve at midway
    var pt2 = (path.getPointAtLength(pathLength / 2 + 5));
    var arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");

    arrowPath.setAttribute("d", "M0,0 l0,15 l15,-7.5 z");
    arrowPath.setAttribute("transform", "translate(" + (midLink.x - 7) + " " + (midLink.y - 7) + ") rotate(" + (Math.atan2((pt2.y - pt1.y), (pt2.x - pt1.x)) * 180 / Math.PI) + " 7 7)");
    arrowPath.setAttribute("style", "stroke:" + COMPLETED_LINK_COLOUR + ";fill:" + COMPLETED_LINK_COLOUR + ";cursor: pointer; pointer-events: visibleStroke; pointer-events: visibleFill");
    arrowPath.id = svgid.replace("link", "arrow");

    return arrowPath;
}

// Link selected by clicking it, used to delete links
function linkSelected(event) {
    var selIndex = +event.currentTarget.id.replace("path", "").replace("arrow", "");
    for (var i = 0; i < links.length; i++) {
        if (links[i].screen !== selScreenName)
            links[i].selected = false;                                                                      // Turn off links previously selected on other screens
        if (links[i].selected && !g.keyShift && (selIndex !== i)) {
            setLinkSel(document.getElementById("path" + i), i);                                             // Turn off link if was previously selected and shift key isn't held down
        }
    }
    setLinkSel(event.currentTarget, selIndex);
}

// Process the link selection
function setLinkSel(selLink, selIndex) {
    var myColour = links[selIndex].selected ? COMPLETED_LINK_COLOUR : HIGHLIGHT_LINK_COLOUR;                // Already selected? If so, toggle colours

    selLink.style.setProperty("stroke", myColour);

    var arrowLink;
    if (selLink.id.indexOf("arrow") !== -1) {                                                               // Arrow selected
        selLink.style.setProperty("fill", myColour);
        arrowLink = selLink.parentNode.getElementById(selLink.id.replace("arrow", "path"));
        arrowLink.style.setProperty("stroke", myColour);                                                    // Also set link color
    } else {
        arrowLink = selLink.parentNode.getElementById(selLink.id.replace("path", "arrow")); // Link selected
        arrowLink.style.setProperty("stroke", myColour);                                                    // Also set arrow color
        arrowLink.style.setProperty("fill", myColour);
    }

    if (links[selIndex].selected) {                                                                         // Toggle
        links[selIndex].selected = false;                                                                   // Find the entry in the links array
        document.removeEventListener("keydown", delLink, true);
        document.getElementById("deleteAllButton").onclick = deleteScreen;
        parent.status("MODE");
    } else {
        document.addEventListener("keydown", delLink, true);                                                // capture delete
        links[selIndex].selected = true;
        // Set delete button to delete link
        document.getElementById("deleteAllButton").onclick = function() {delLink("DELSELECTED");}
        parent.status("Link #" + selIndex + " selected");
    }
}

// Delete a node, so delete all its links and reorder the node numbers in links array
function delNode(nodeName) {
    for (var i = 0; i < links.length; i++) {
        if (links[i].inpNodeName === nodeName || links[i].outNodeName === nodeName) {
            links[i].selected = true;                                                                       // Find the links that have the node associated with them and flag for delete
        }
    }
    delLink("DELSELECTED");
}

// When link(s) are selected and DEL pressed, delete selected link and reorganise the array & SVG objects on screen
function delLink(e) {
    if (e.keyCode === 46 || e === "DELSELECTED") {
        var reorgLinks = [];
        var deletedLinks = [];
        for (var i = 0; i < links.length; i++) {
            var linkToDel = document.getElementById("link" + i);
            if (linkToDel) {
                // Remove all from DIV
                linkToDel.parentNode.removeChild(linkToDel);
            }
            if (!links[i].selected) {
                reorgLinks.push(links[i]);
            } else {
                g.dirty = true;
                deletedLinks.push(links[i]);
            }
        }
        links = JSON.parse(JSON.stringify(reorgLinks));

        rebuildLinks();                                                                                     // Redisplay links with reorganised link array

        // we also want to run dashStart on the connected nodes
        // need to run after we rebuild the links as dashStart() depends on accurate link state

        deletedLinks.forEach(function (selectedLink) {
            var inWidget = widgets[selectedLink.inpNodeName];
            var outWidget = widgets[selectedLink.outNodeName];

            if (typeof inWidget !== "undefined" && typeof outWidget !== "undefined") {
                // run dashstart of input widget
                if (typeof inWidget.defView.fw_dashStart === "function") {
                    inWidget.defView.fw_dashStart();
                }

                // run dashstart of output widget
                if (typeof outWidget.defView.fw_dashStart === "function") {
                    outWidget.defView.fw_dashStart();
                }
            }
        });

        parent.status("Link(s) deleted");
        // Set delete button back to default
        document.getElementById("deleteAllButton").onclick = deleteScreen;
    }
}

//#endregion
//#region ////////////////////////////////////////////////////////// Utilities

// Handle callbacks from items selected in the parent toolbox (for items that are shared between dashboard and setting screens)
function toolboxCallback(type, item, widgetType, selectedKey) {
    switch (type.toUpperCase().trim()) {
        case "ICONS":                                                                                       // Update screen icon based on icon name selected in toolbox
            if (tabIconSelected !== "") {
                document.getElementById(tabIconSelected).getElementsByTagName("div")[1].innerHTML = item;
                screens[selScreenName].icon = item;
                tabIconSelected = "";
            }
            break;

        case "CHANNELS":
            if (item !== "" && typeof parent.g.toolboxParam !== "undefined") {
                if (item.toUpperCase() === "NONE") {
                    selectedKey = "Channel";
                }
                var selector = "[data-key='" + selectedKey + "']";
                // Have to find the ID of the DIV it's stored in.
                var div = "#" + document.querySelector(selector).parentElement.parentElement.parentElement.id;
                div = div.replace(" ", "\\ ");
                updateServerChannelFields(item, document.querySelector(div));
                break;
            }
            break;
    }
    parent.toggleToolbox();
}

/**
 * @description Used for updating the server channel settings for both widgets
 * and flow nodes. Takes a channel in fqn form and the'Server Channels' div as
 * parameters.
 * @author Elijah Blowes
 * @param {string} channel A channel in fqn string form. e.g. `Category/Class/Instance/Scope`.
 * @param {HTMLDivElement} element The div element containing the server
 * channel input fields and select link. If you pass something else in
 * here it will not work.
 *
 * @todo Add error checking for inputs. Make sure that both variables are given
 */

function updateServerChannelFields(channel, element) {
    /**
     * @description Used for setting the displayed text in the input
     * elements. Uses both Element.setAttribute() and Element.value as we need
     * to set both the default value and the current property.
     * See Gecko notes: https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute
     * @author ELijah Blowes
     * @param {Array} inputFields an Array of the input fields
     * @param {Array} values an array of values to set. If null or not an
     * array. Value will be set to "".
     */
    function setValues(inputFields, values) {
        if (inputFields instanceof Array) {
            var i = 0;
            var value = "";
            inputFields.forEach(function (input) {
                if (values instanceof Array) {
                    value = (typeof values[i] === "undefined" ? "" : values[i]);
                }
                input.setAttribute("value", value);
                input.value = value;
                i++;
            });
        }
    }
    var channelItem;
    var which = element.querySelectorAll("li > a");
    if (which.length === 1) {
        channelItem = which[0];
    }
    // This is if you have multiple links. This is legacy code. But as I'm not
    // 100% sure what it does I've left it here.
    else if (which.length > 1) {
        for (var i = 0; i < which.length; i++) {
            if (which[i].getAttribute("data-key") === selectedKey) {
                channelItem = element.querySelector('[data-key=\"' + selectedKey + '\"]');
            }
        }
    }
    var inputs = [
        element.querySelector("[data-key='category']"),
        element.querySelector("[data-key='class']"),
        element.querySelector("[data-key='instance']"),
        element.querySelector("[data-key='scope']")
    ];
    if (channel.toUpperCase().trim() === "NONE" || channel === "") {
        setValues(inputs);
    } else {
        channelItem.setAttribute("data-selected", channel);
        setValues(inputs, channel.split("/"));
        channelItem.innerHTML = "Select Channel";
    }
}

/******************************************************************************
 *                  WIDGET HELP
 *      NOTES:
 *          - The following functions are mainly used for display the help
 *          files in a modalMessage(). However; they have been made to be
 *          reusable if necessary.
 *
 *      TODO:
 *          - Need to add error checking to some of these functions.
 *          - Need to make all functions return something. Especially if no
 *          callback function is supplied.
 *          - Needs a code clean up
 ******************************************************************************/

/**
 * Process onclick event for help icon in widget toolbox.
 * @author Elijah Blowes
 */

function helpWidget() {
    var widgetSettings = editData.defView.options.settings;
    if (!("help" in widgetSettings)) {
        return displayHelpHtml("No help settings specified found.");
    }
    if (widgetSettings.help.toString() === "[object Object]") {
        switch (widgetSettings.help.type) {
            case "file":
                getFileAsBlob(widgetSettings.help.source, function (e) {
                    processRequest(e.target, function (blob) {
                        parseBlob(blob, function (e) {
                            displayHelpHtml("<div class=\"help-content\">"
                                + parseToMarkdown(e.target.result) +
                                "</div>");
                        });
                    });
                });
                break;
            case "text":
                displayHelpHtml(widgetSettings.help.source);
                break;
            // Add for help file types.
            default:
                displayHelpHtml(widgetSettings.help.source);
                break;
        }
        // Legacy code for widgets not updated to the new help model.
        // Will delete when all widgets are updated.
    } else {
        displayHelpHtml(widgetSettings.help);
    }
}

/**
 * Displays a help file in using the modalMessage function.
 * @param {String} help
 */

function displayHelpHtml(help) {
    parent.modalHelp(help, "Help for " + widgets[editData.widgetName].type + " widget");
}

//#endregion