"use strict";


//MAR20: Load utilities later as not needed initially. And if stepping into the client, utilities is loaded twice
// Import classes from parent.
var SensaCollection = parent.SensaCollection;
var Logger = parent.Logger;
var StateStore = parent.StateStore;


//#region ////////////////////////////////////////////////////////// Initialisation
var events;                                                                                     // Holds event broker object for each screen initialisation
var event = function (server, channel, data) {                                                  // Event object used for the event queue and events setting editor
    this.server = server;
    this.channel = channel;
    this.data = data;
};

var screens = {};
var screen = function (index, icon, tooltip) {
    this.index = +index;
    this.icon = icon;
    this.tt = tooltip;
    this.meta = "";
};

//TODO: Maybe load channel array when design is requested? JAN19: Change declaration to object
var channels = [];
var channel = function (category, className, name, desc, type, io, min, max, units) {
    this.category = category;
    this.className = className;
    this.name = name;
    this.desc = desc;
    this.type = type;
    this.IO = io;
    this.min = min;
    this.max = max;
    this.units = units;
};

var widgets = {};
var Widget = function (type, screen, locX, locY, scaleX, scaleY, scaling, version) {
    this.type = type;                                                                       // Persisted to server to identify the widget.html file to load & match key with static options
    this.version = version;                                                                 // Always hold the version when the instance was created
    this.locX = +locX;
    this.locY = +locY;
    this.scaleX = +scaleX;
    this.scaleY = +scaleY;
    this.screen = screen;
    this.attribs = {};
    this.events = {};
    this.session = {                                                                        // Session specific state management (not saved to server)
        loadCnt: 0,
        ready: false,
        redirChannel: {
            oldCh: null,
            newCh: null
        }                                                                                   // Name of redirected channel (set channel)
    };
    this.scaling = scaling;                                                                 // Proportional scaling object
};

var links = [];                                                                             // Links array

// DOM objects
var widgetsDiv = document.getElementById("widgetsDiv");
var widgetContainer = document.getElementById("widgetContainer");
var sidebarDiv = document.getElementById("sidebar");
var sidebarListDiv = document.getElementById("sidebarList");
var canvasSectionDiv = document.getElementById("widgetSection");

//TODO: Remove when the code using this is moved to CSS
var minButton = document.getElementById("minButton");
var touchButton = document.getElementById("touchButton");
var spinner = document.getElementById("spinner");

// Constants
var ACTION_RETRY_MSEC = 25;                                                                 // How long to retry waiting for widget
var ZINDEX_TOP = 140;                                                                       // Z-index stacking order (top). Other zIndex "bottom" = 100, "1" = 110, "2" = 120, "3" = 130
var ZINDEX_DEFAULT = 120;
var DEF_WID_SCR_ICO = "widgets";                                                            // Icon for newly created widget screens
var DEF_FLO_SCR_ICO = "swap_calls";                                                         // Icon for newly created flow screens

// Globals
var clipboard = {};                                                                         // Widget object to be copied & pasted
var editor;                                                                                 // Codemirror object
var selScreenName;                                                                          // selected screen
var oldScreenName;                                                                          // previously selected screen
var widgetToLoadCnt, widgetLoadedCnt;                                                       // Counter for when the last widget has finished loading.
var loadTimer;                                                                              // Timeout for loading widgets
var restTimer;                                                                              // Timer to ensure all the widget data is downloaded (rest screens)
var winScale = 1;                                                                           // Adjust for Windows display font scaling
var brokenWidgets = [];                                                                     // Save widgets that didn't load properly
var missingWidgets = [];                                                                    // Save widgets that are in the widget array but missing in the file system
var globalVars = [];                                                                        // Global variables used for client events
var globalVarSize = 10;
var widgetNames, nodeNames;                                                                 // Arrays for design, populated by server once initial screen loaded
var widgetGroups, flowGroups;                                                               // String (comma delimited) for the categories / groupings for dashboard and flow widgets
var widgetGlobals = {};                                                                     // TODO: Wrap this in an API call for widgets to get to a shared global space
var toolboxLoaded = "UNLOADED";                                                             // Load toolbox if it hasn't been loaded earlier
var sidebarIsOpen = true;                                                                   // Global variable for if the side bar is open.
var eventsWaitingList = {};                                                                 // Waiting list for events that are on another page.
var Log = new Logger("Dashboard");
var stateStore = new StateStore("clientStore", "Dashboard");                                                          // Observer used to emit values to everyone subscribed to it.
var appStateStore = new StateStore("serverStore", "Dashboard");                                      // Client events pubsub
var globalsStateStore = new StateStore("globalsStore");                                     // Client globals statestore.
var iniEvents = [];                                                                         // Ini Events for scripting                                                                      // flag for if the iframe is ready.
const statusBar = parent.window.statusBar; // Status bar module.
var globalTooltip = document.getElementById("global-dasb-tooltip");
var globalDashboardToolTipContent = document.getElementById("global-dasb-tooltip-text");
// Flag for hiding tooltip for a widget when HIDETOOLTIP function is invoked
var globalTooltipHidden = false;

// Global boolean Flags
var g = {};
g.design = false;            // design mode flag
g.flowEditor = false;        // Using the flow editor
g.loadedScreen = false;      // Flag for the screen widgets finished loading
g.readyToSave = true;        // Flag for ready to save the widget settings (some processing like uploading images is async)
g.keyShift = false;          // Do we have the SHIFT key pressed?
g.keyCtrl = false;           // Do we have the CTRL key pressed?
g.keyAlt = false;            // Do we have the ALT key pressed?
g.dirty = false;

// Focusable elements for maintaining tabindex consistency
var firstFocusable;

// changed without saving (note - lots of dependencies in index.html and dashboard, hard to move to design.js)
if (localStorage.getItem("SENSAHUB_RESET")) {
    // Hacky workaround for a bug in Edge/IE where refreshing the browser will sometimes half load the old screen. See bug #259, 260
    /*
    if (Date.now() - localStorage.getItem("SENSAHUB_RESET") < 10000)
        // Short time between saving the reset flag and here, so I must have refreshed
        document.location.assign(document.location.protocol + "//" + document.location.host + document.location.pathname + "?mode=dashboard");
    // Reset to startup
    */
    localStorage.removeItem("SENSAHUB_RESET");
}

///JAN19 TODO Security risk passing mode via querystring, better to check parent mode instead. AND CAN REMOVE parseURL from utilities as only used once
var state = parseURL(document.URL);
// Expect mode=XXX on the command line from the client
if (!state.mode) {
    alert("ERROR - Can't run dashboard.html directly. Exiting");
    window.stop();
}

document.addEventListener("keydown", keyDown, false);   // Keypress down
document.addEventListener("keyup", keyUp, false);       // Keypress up
// document.addEventListener('mousemove', globalToolTipFn, false); // Mousemove for tooltip

Log.verbose("Dashboard: I'm ready!");
// Check if client is ready.
handShake(waitForParent);

// Load in all deps required to run code the code editor with error checking and auto-complete (needs to be in dashboard as scripts are used in dashboard mode)

function importCodemirrorDeps(title) {
    document.getElementById("cmTitle").innerHTML = title;

    if (editor !== undefined) {
        return;
    }
    
    // All items are loaded
    if (editor !== undefined) {
        return;
    }

    // Modification for INI files
    CodeMirror.defineSimpleMode("ini", {
        start: [
            { regex: /\/\/.*/, token: "comment" },
            { regex: /\#.*/, token: "comment" },
            { regex: /\;.*/, token: "string" },
            { regex: /\[[^\]]+\]/, token: "keyword" },
            { regex: /[^\=]+/, token: "def", next: "property" }
        ],
        property: [
            { regex: /\=/, next: "property" },
            { regex: /true|false/i, token: "atom", next: "start" },
            { regex: /[-+]?(?:\.\d+|\d+\.?\d*)/i, token: "number", next: "start" },
            { regex: /.*/, token: "", next: "start" }
        ]
    });

    editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
        lineNumbers: true,
        lineWrapping: false,
        styleActiveLine: false,
        indentUnit: 4,
        indentWithTabs: true,
        extraKeys: {
            Tab: (function (cm) { return cm.execCommand("indentMore"); }),
            "Shift-Tab": (function (cm) { return cm.execCommand("indentLess"); }),
            'Ctrl-Space': 'autocomplete'
        },
        mode: "javascript",
        json: true,
        theme: "default",
        gutters: ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "breakpoints"],
        lint: { esversion: 10 }
    });
    editor.setSize("100%", "100%");
    editor.refresh();

    /*
    editor.on("gutterClick", function (cm, n) {
        var info = cm.lineInfo(n);
        cm.setGutterMarker(n, "breakpoints", info.gutterMarkers ? null : makeMarker());     // See style.css for breakpoint style
    });
    */

    function makeMarker() {
        var marker = document.createElement("div");
        marker.style.color = "#822";
        marker.innerHTML = "⬤";
        return marker;
    }
    //TODO: for a debugger, do the following:
    // When debugging turn off editing in the script
    // set styleActiveLine to true
    // when server sends a breakpoint stopped, highlight the breakpoint with cm.setCursor({line: <bp line num>, ch: 0})
    // When turning off debugging, turn back on editing, set styleactive to false
    console.groupEnd();
}

// TEMPORARY FOR FLOW DEBUG FEATURE
function debugState() {
    var tt = document.getElementById('debugArea');
    tt.style.setProperty('display', 'inline');
}

/**
 * Custom handshake protocol to run a function when both the client and dashboard are ready.
 *
 */
function handShake(callback) {
    // import css from index.html to avoid multiple loads
    importCSS(parent.document, document);
    // Unhide iFrame content once loaded.
    parent.g.iFrameLoaded = true;
    parent._waitForParent = callback;

    if (parent.imReady && parent.g.componentsLoaded) {
        Log.verbose("Dashboard: Yay! We are both loaded :D");
        callback();
    }
}

function importCSS(mainDocument, targetDocument) {
        // Steal stylesheets from parent
    // add css from parent
    let bsStyle = document.createElement('style');
    bsStyle.setAttribute("id", "bsStyle");
    
    const allCSS = [...mainDocument.styleSheets]
    .map(styleSheet => {
        try {
            return [...styleSheet.cssRules]
            .map(rule => rule.cssText)
            .join('');
        } catch (e) {
            console.log('Access to stylesheet %s is denied. Ignoring...', styleSheet.href);
        }
    })
    .filter(Boolean)
    .join('\n');
    bsStyle.innerText = allCSS;
    bsStyle.addEventListener("load", (e) => {
        document.getElementById("mainBody").style.setProperty("visibility", "visible");
    });

    targetDocument.head.appendChild(bsStyle);

}

/**
 * Sometimes the parent page hasn't finished processing before we get here (iframe loaded immediately for speed, passthru logon)
 */
function waitForParent() {
    // Unload queue if any.
    parent.window.unloadIframeQueue();

    if (typeof parent.imReady !== "undefined" && parent.imReady == true) {
        appStateStore.logger = Log;

        var syntaxColorScheme = "css/highlight/default.css";
        switch (state.mode.toUpperCase().trim()) {
            // mode specified on command line, parent determines the mode
            case "DASHBOARD":
                break;
            case "DESIGN":
                if (parent.sess.permissions.indexOf("design") !== -1) {
                    // Don't rely on mode to switch to design, load design JS dynamically
                    g.designPromise = dynamicallyLoadScriptAsync("js/design.js" + parent.sess.debugURL).then(() => {
                        Log.info("design.js loaded.")
                        document.getElementById("scrollableTabs").style.setProperty("height", "calc(100% - 160px)");
                    });
                }
                break;
            case "FLOWS":
                if (parent.sess.permissions.indexOf("flows") !== -1) {
                    g.designPromise = dynamicallyLoadScriptAsync("js/design.js" + parent.sess.debugURL).then(() => {
                        g.flowEditor = true;
                        Log.info("design.js loaded.")
                        document.getElementById("scrollableTabs").style.setProperty("height", "calc(100% - 160px)");
                    });
                }
                break;

            case "SETTINGS":
                break;
            default:
        }

        if (parent.g.isMobile) {
            // Mobile, start with sidebar closed
            toggleSidebar("CLOSE");
        }
        if (parent.sess.deviceType.toUpperCase() === "PHONE" && g.design) {
            document.getElementById("widgetPhone").style.setProperty("display", "block");

        } else if (parent.sess.deviceType.toUpperCase() === "TABLET" && g.design) {
            document.getElementById("widgetPhone").classList.add("tabletDesign");
        } else {
            // Remove class
            document.getElementById("widgetPhone").classList.remove("tabletDesign");
        }

        // TODO this will cause a repaint. could this not be done in CSS
        document.getElementById("sidebarGrp").style.setProperty("display", "inline");
    }

    parent.setWinScale();

}

//#endregion
//#region ////////////////////////////////////////////////////////// Mobile specific

// Touch event to toggle sidebar.
minButton.addEventListener("touchstart", handleTouchStart, {passive: false});
minButton.addEventListener("touchmove", handleTouchMove, {passive: false});
sidebarDiv.addEventListener("touchstart", handleTouchStart, {passive: false});
sidebarDiv.addEventListener("touchmove", handleTouchMove, {passive: false});
touchButton.addEventListener("touchstart", handleTouchStart, {passive: false});
touchButton.addEventListener("touchmove", handleTouchMove, {passive: false});

var xDown = null;
var yDown = null;

function handleTouchStart(evt) {
    xDown = evt.touches[0].clientX;
    yDown = evt.touches[0].clientY;
}
;
function handleTouchMove(evt) {
    if (!xDown || !yDown) {
        return;
    }

    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        // most significant
        if (xDiff > 0) {
            if (sidebarDiv.style.getPropertyValue("left") > "-5px") {
                // Left swipe
                toggleSidebar();
            }
        } else {
            if (sidebarDiv.style.getPropertyValue("left") < "-5px") {
                // Right swipe
                toggleSidebar();
            }
        }
    } else {
        if (yDiff > 0) {        // Up swipe
        } else {                // down swipe
        }
    }
    xDown = null;
    yDown = null;
}
;

/**
 *  Adjust screen width for mobile clients.
 * @param func
 */
function toggleSidebar(func, animate) {
    if (typeof animate !== "undefined" && animate !== true) {
        // https://stackoverflow.com/questions/11131875/what-is-the-cleanest-way-to-disable-css-transition-effects-temporarily
        minButton.classList.add("toolboxNoSlide");
        sidebarDiv.classList.add("toolboxNoSlide");
        canvasSectionDiv.classList.add("toolboxNoSlide");
    }

    //TODO: Move the styles into a CSS class
    if (sidebarDiv.style.getPropertyValue("left") > "-5px" || func === "CLOSE") {
        // close toolbox if open
        sidebarDiv.style.setProperty("left", "-180px");
        canvasSectionDiv.style.setProperty("left", "6px");
        minButton.innerHTML = "<b id=\"minButtonTag\">&nbsp;&rang;</b>";
        minButton.style.setProperty("left", "0px");
        touchButton.style.setProperty("left", "-10px");
        sidebarIsOpen = false;
    } else {
        // Open if closed, don't slide canvas if mobile
        sidebarDiv.style.setProperty("left", "0px");
        if (!parent.g.isMobile) {
            canvasSectionDiv.style.setProperty("left", "180px");
        }
        minButton.innerHTML = "<b id=\"minButtonTag\">&nbsp;&lang;</b>";
        minButton.style.setProperty("box-shadow", "1px 1px 1px rgba(0, 0, 0, 0.16), 2px 2px 3px rgba(0, 0, 0, 0.16)");
        minButton.style.setProperty("left", "180px");
        touchButton.style.setProperty("left", "170px");
        sidebarIsOpen = true;
    }
    var rescale = setInterval(function () {
        resizeAllWidgets();
        clearInterval(rescale);
    }, 600);

    if (typeof animate !== "undefined" && animate !== true) {
        //TODO: Isn't there a better way?
        var temp = minButton.offsetHeight; // Trigger a reflow, flushing the CSS changes
        var temp2 = sidebarDiv.offsetHeight; // Trigger a reflow, flushing the CSS changes
        var temp3 = canvasSectionDiv.offsetHeight; // Trigger a reflow, flushing the CSS changes
        minButton.classList.remove("toolboxNoSlide");
        sidebarDiv.classList.remove("toolboxNoSlide");
        canvasSectionDiv.classList.remove("toolboxNoSlide");
    }

    return false;
}

//#endregion
//#region ////////////////////////////////////////////////////////// Screens

/**
 * Populate the screen object from initial connection data.
 * @param screensIni
 */
function initScreens(screensIni) {
    if (parent.g.oldScreens[0].screen !== null) {                           // At startup sometimes the variables aren't ready in parent, don't care it will always be dashboard default
        if (!parent.g.startRest) {
            setTimeout(initScreens, 50, screensIni);                         // If selected a screen not screen 0, wait till all widget data comes down
            return;
        }

        selScreenName = parent.getOldScreenName();                          // Get previous active screens and jump back to that screen
    } else {
        selScreenName = null;                                               // Clear if we are being called from an existing session
    }

    while (sidebarListDiv.childElementCount > 0)
        sidebarListDiv.removeChild(sidebarListDiv.firstChild);              // Remove old tabs if reloading due to deletes or reconnects

    if (Object.keys(screensIni).length > 0) {                               // Server send screen(s) of widgets
        var sorted = Object.keys(screensIni)                                // Sort in order of index to retain display order
            .sort(function (a, b) {
                return screensIni[a].index - screensIni[b].index
            })
        sorted.forEach(function (screen) {
            if (!selScreenName && screensIni[screen].index === 0) {
                selScreenName = screen                                      // No current screen so must be starting, set first screen
            }
            screens[screen] = screensIni[screen];                           // Save in display order
            createTab(screen);                                              // Create the tabs for all screens
        });

        selectedTab(selScreenName);                                         // Switch to new screen

    } else {                // No screens from server - new setup, so handle welcome messages

        if (!g.design) {
            // First time running, won't be in design, so if user has design privs switch them to design
            if (parent.sess.permissions.indexOf("design") !== -1) {
                if (parent.window.screen.width < 1025) {
                    //TODO: Add the whitebox message
                    parent.alertModal("Welcome to the Sensahub client! <br><br>You have logged in from a small screen which isn't set up for designing screens, " + "please use a desktop or tablet instead to manage screens.", "No Existing Dashboard (New Setup)", { confirmText: "Continue" });
                    return;
                } else {
                    parent.alertModal("Welcome to the Sensahub client! <br><br>To get started, rename the 'New Screen' tab, "
                        + "select a new tab icon and use the 'Design Options' icons on the bottom left corner to create or delete screens, save or use the widget toolbox to drag and add widgets. "
                        + "<br > <br>Select the 'Help' option on the 'More' menu in the top navigation bar for more help"
                        , "No Existing Dashboard (New Setup)"
                        , { confirmText: "Continue" }).then(() => parent.adjustNavBar("Design"));
                    //return;
                }
            } else {
                parent.alertModal("Unfortunately your dashboard hasn't yet been configured so there isn't anything to show, please see your administrator to assign a dashboard to your username.", "Welcome to the Sensahub client!", "Continue");
                return;
            }
        } else {
            if (g.flowEditor) {
                parent.alertModal("No flows have been configured yet. <br><br>To get started, rename the 'New Flow' tab on the left, "
                    + "select a new tab icon and use the Design Options icons on the bottom left corner to create or delete screens, save or use the widget toolbox to drag and add flow widgets. "
                    + "<br > <br>Select the 'Help' option on the 'More' menu in the top navigation bar for more help.", "Setup Flows",
                    { confirmText: "Continue" }).then(() => parent.adjustNavBar("Flows"));
            }
            //return;
        }
    }

    // No screens, so create one to get users started
    if (typeof screensIni === "undefined" || Object.keys(screensIni).length === 0) newScreen();
}

/**
 * Find the largest screen number (can't assume object is sorted)
 * @return int - the Max Screen num
 */
function getMaxScreenNum() {
    var maxScreenNum = -1;
    Object.keys(screens).forEach(function (screen) {
        maxScreenNum = screens[screen].index > maxScreenNum ? screens[screen].index : maxScreenNum;
    });

    return maxScreenNum;
}

/**
 * Checkt to see if the given screen name exits.
 * @param screenName to check for.
 * @return True if the given screen exists.
 */
function screenExists(screenName) {
    var result = false;
    Object.keys(screens).forEach(function (screen) {
        if (screenName.toUpperCase().trim() === String(screen).toUpperCase().trim()) {
            result = true;
        }
    });
    return result;
}

/**
 * Create a new screen tab at the end of existing tabs (if any)
 */
function newScreen() {
    let maxScreenNum = getMaxScreenNum();
    var myKey;

    do {
        myKey = (g.flowEditor ? "New Flow " : "New Screen ") + (++maxScreenNum);
    } while (screenExists(myKey));

    screens[myKey] = new screen((Object.keys(screens).length), g.flowEditor ? DEF_FLO_SCR_ICO : DEF_WID_SCR_ICO, null);
    // create new screen entry in screen object
    createTab(myKey);
    selectedTab(myKey);

    ///JAN19 not working. This is only needed while in design mode
    var range = document.createRange();
    // set edit cursor to new tab
    var sel = window.getSelection();
    range.setStart(document.getElementById("screenTab~" + myKey).childNodes[0], 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    if (g.design) {
        // OK to create screens in dashboard without prompting to save
        g.dirty = true;
    }

    statusBar.status({
        message: "New tab created"
    });

    return myKey;
}

/**
 * Create a new tab with the given name
 * @param screenName Text to place inside the tab.
 */
function createTab(screenName) {
    var iconElement = document.createElement("li");

    iconElement.className = "nav-item";
    iconElement.id = "ScreenLi~" + screenName;
    iconElement.style.setProperty("width", "100%");

    iconElement.innerHTML = "<a class='nav-link " + (screens[screenName].index === 0 ? "active" : "") +
        "' tag='screenTab' onclick='screenTabClick(this)' id='screenTab~" + screenName +
        "' style='width: 100%; cursor: pointer'><div class='row align-items-center'><div onclick='tabIconClick(this)' class='material-icons' style='padding-left:15px' id='iconTab~" +
        screenName + "'>" + screens[screenName].icon + "</div><div style='padding-left:10px; max-width: calc(100% - 50px);'><span id='screenTabText~" +
        screenName + "' onblur='saveScreenText(this)' style='display: block; outline: none; width: auto;' contenteditable='" + g.design + "' class='wordwrap'>" +
        screenName + "</span></div></div></a>";

    sidebarListDiv.appendChild(iconElement);
}

/**
 * End any existing widget sessions.
 * @param navbar
 */
function endWidgetSess(navbar) {
    var unsubList = [];

    if (oldScreenName == undefined) {
        return [];
    }

    if (navbar === "NAVCHANGE") {                                           // Navbar changes will force unsubscriptions
        oldScreenName = selScreenName;
    } else {
        if (oldScreenName === selScreenName) {
            return [];                                                      // New session, nothing to unsubscribe
        }
    }

    var screenWidgets = getScreenWidgets(oldScreenName);
    for (var num in screenWidgets) {                                        // First check if the widget wants to cancel the change screen
        var widget = screenWidgets[num];

        // Do not try and close session for widget if it is disabled.
        if (widgets[widget].disabled) {
            continue;
        }

        if (!g.design && widgets[widget].defView && typeof widgets[widget].defView.fw_endSession === "function") {
            if (widgets[widget].defView.fw_endSession() === false) {            // Call end session in the widget to close (if it exists)
                return null;                                                         // Widget aborted screen change
            }
        }
    }

    for (var num in screenWidgets) {
        var widget = screenWidgets[num];
        if (widgets[widget].defView) {                        // Only process for active widgets (first time run getScreenWidgets)

            // Create an array of server subscriptions that need to be unsubscribed (no need for client events as events get rebuilt for each screen)
            if ("serverEvents" in widgets[widget].events) {
                if ("inputEvents" in widgets[widget].events.serverEvents) {
                    Object.keys(widgets[widget].events.serverEvents.inputEvents).forEach(function (event) {
                        var mySub = parent.g.netName.toUpperCase() + "/" + widgets[widget].events.serverEvents.inputEvents[event].channel.toUpperCase();
                        if (unsubList.indexOf(mySub) === -1) {                                      // Only save unique subscriptions
                            unsubList.push(mySub);
                        }
                    });
                }
                if ("outputEvents" in widgets[widget].events.serverEvents) {
                    Object.keys(widgets[widget].events.serverEvents.outputEvents).forEach(function (event) {
                        var mySub = parent.g.netName.toUpperCase() + "/" + widgets[widget].events.serverEvents.outputEvents[event].channel.toUpperCase();
                        if (unsubList.indexOf(mySub) === -1) {                                      // Only save unique subscriptions
                            unsubList.push(mySub);
                        }
                    });
                }
            }

            delete widgets[widget].defView;                        // Remove DOM pointer so disconnected old widget gets GC
        }
    }

    appStateStore.clearSubscriptions();
    return unsubList;
}

/**
 * Load widgets onto the screen
 */
function populateScreenWidgets() {

    var unsubList = [];
    if (!g.design) {
        unsubList = endWidgetSess();
        if (unsubList === null) {                               // A widget has cancelled the screen change
            return false;
        }
    }

    spinner.style.setProperty("visibility", "visible");
    document.getElementById("widgetContainer").style.setProperty("visibility", "hidden");

    statusBar.status({
        message: "Loading widgets..."
    });

    widgetToLoadCnt = 0;
    widgetLoadedCnt = 0;
    // reset first focusabsle element
    firstFocusable = undefined;
    g.loadedScreen = false;
    brokenWidgets = [];
    missingWidgets = [];

    var newDiv = document.createElement("div");

    Object.keys(widgets).forEach(function (widget) {
        if ((widgets[widget].screen === selScreenName)) {
            widgetToLoadCnt++;
            //loadWidget(newDiv, widget);                        // Load new Widget to our new element
        }
    });

    // If widget loads faster than iteration errors happen.
    Object.keys(widgets).forEach(function (widget) {
        if ((widgets[widget].screen === selScreenName)) {
            loadWidget(newDiv, widget);                        // Load new Widget to our new element
        }
    });


    if (!g.design) {
        setupScreenEvents(unsubList);                       // Start up events processing after widgets start loading but before rest (passing previous screen's widget subscriptions for unsubscribing)
    }

    if (widgetToLoadCnt == 0) {
        finishRender();                    // No widgets, so finish loading immediately (don't wait for timeout due to missing widgets)
    }

    newDiv.id = "widgetsDiv";
    widgetContainer.replaceChild(newDiv, widgetsDiv);

    widgetsDiv = document.getElementById("widgetsDiv");                // Reset div pointer to the new Widget container
}

//TODO: Move to design.js once dependency on notes widget saving while in dashboard mode is adjusted
// Save widget or node screens
function saveScreens(showStatus) {
    // implement logic check that if we're still editing a widget (ie notes) that we make sure we can save those settings/attribs
    if (editData.widgetName) {
        resetEdit("save", editData.widgetName);
    }

    if (!parent.g.startRest) {
        // Can't save screens until we have initialised correctly
        alert("WARNING - Still loading system data. Please retry in a couple of seconds. If this message persists there is a system issue.");
        return;
    }

    if (!g.readyToSave) {
        // Image can take time to upload to the server
        alert("WARNING - Still processing widget settings. Please retry in a couple of seconds. If this message persists there is a system issue.");
        return;
    }

    if (g.design && editData.widgetName) {
        resetEdit(editData.widgetName, "save");                     // turn off editing for any widget being edited (saves widget changes)
    }

    if (Object.keys(screens).length !== 0) {
        var saveScreen = {};                                        // Object to convert to JSON to store on server
        saveScreen.device = parent.sess.deviceType.toUpperCase();
        saveScreen.widgets = {};
        saveScreen.screens = screens;
        saveScreen.meta = "";                                       // for use later

        Object.keys(widgets).forEach(function (widget) {                    // Check if we have dynamically changed channel
            var myWidget = widgets[widget];

            saveScreen.widgets[widget] = {                          // Save mandatory settings
                t: myWidget.type,
                lX: +myWidget.locX,
                lY: +myWidget.locY,
                sX: +(myWidget.scaleX.toFixed(2)),
                sY: +(myWidget.scaleY.toFixed(2)),
                s: myWidget.screen,
                ps: myWidget.scaling,
                ver: myWidget.version
            }
            ///JAN19 TODO: Handle dynamic channel changes

            // Settings are only saved in widget instance if different from options default or have been changed
            if ("zIndex" in myWidget) {
                if (myWidget.zIndex === "ZINDEX_DEFAULT") {
                    delete myWidget.zIndex;
                } else {
                    saveScreen.widgets[widget].z = myWidget.zIndex
                }
            }

            if (myWidget.visible != undefined && !myWidget.visible) {
                saveScreen.widgets[widget].vis = false;                         // Only save if set off (default on)
            }

            if ("disabled" in myWidget) {
                saveScreen.widgets[widget].dis = myWidget.disabled;
            }

            if ("property" in myWidget) {
                saveScreen.widgets[widget].pr = myWidget.property;
            }

            if ("tooltip" in myWidget) {
                saveScreen.widgets[widget].tt = myWidget.tooltip;
            }

            saveScreen.widgets[widget].a = myWidget.attribs;
            saveScreen.widgets[widget].ev = myWidget.events;
        });

        if (g.flowEditor) {
            showStatus = saveFlows(saveScreen);                    // Use widget array when saving flows
        } else {
            //parent.publishCmd("SAVEWIDGETS", saveScreen, { "source": "client/save" }, parent.sess.user);                  // Will be stringified in JSON
            parent.publishCmd("SAVEWIDGETS", saveScreen, { "source": "client/save" }, parent.g.dashName);                  // Will be stringified in JSON, save the dashboard group in usrmeta
        }

        g.dirty = false;

        if (showStatus) {
            if (g.flowEditor) {
                statusBar.status({
                    message: "Flows saved",
                    important: true
                });
            } else {
                statusBar.status({
                    message: "Screens saved",
                    important: true
                });
            }
        }
    } else {
        alert("WARNING - No screens saved, create a screen first before saving by pressing the 'add' icon.");
        return false;
    }

    return true;
}

/**
 * Select a new screen tab.
 * @param e click event
 */
async function screenTabClick(e) {
    // Don't switch if the same screen is selected
    var newScreen = e.id.split("~")[1];
    if (selScreenName !== newScreen) {
        // Check that current flow screen is setup correctly before switching screens
        if (g.flowEditor && flowScreenError()) {
            parent.alertModal("Configuration errors detected with flow screen. Please rectify before switching screens or saving.", "WARNING!")
            return;
        }

        // In screen mode, any form changes without being saved are picked up here
        if (g.dirty && !g.design) {
            let res = await parent.confirmModal("Unsaved changes have not been saved and will be lost if you continue.<br/><br/><b>OK</b> to continue and lose changes, <b>cancel</b> to return to save changes.", "Unsaved Changes");
            if (!res) {
                return;
            }
        }

        // Check for screen change event. Only change if they all return true.
        if (!g.flowEditor && !g.design) {
            if (!checkScreenEvents(widgets, selScreenName)) {
                return;
            }
        }
        Log.verbose(`Loading screen '${newScreen}'`);
        selectedTab(newScreen);
    }
}

/**
 * Select a new screen tab via tab icon (allows us to change icons when editing screens)
 * @param e
 */
function tabIconClick(e) {
    if (g.design) {
        tabIconSelected = e.parentNode.parentNode.id;
        parent.loadToolbox("icons", "");    // Open icons toolbox
    }
}

/**
 * Change the screen based on tab clicked (pass newScreenName as null for initial load)
 * @param newScreenName name to change the screen to
 */
function selectedTab(newScreenName) {

    if (!g.design && parent.g.isMobile) {
        toggleSidebar("CLOSE");
        // Slide sidebar back if we are mobile
    }

    //TODO: Can queue up this request once the screen has rendered
    // Don't switch screens until the screen has finished rendering
    if (!g.loadedScreen && selScreenName !== null && newScreenName !== selScreenName) {
        alert("Please wait for the current screen to load.");
        return;
    }

    if (g.loadedScreen && !parent.g.startRest) {
        alert("Client has not finished loading. Please wait a moment before selecting another tab.");
        return;
    }


    if (Object.keys(screens).length > 0) {
        // First time start will have empty screen object when pushed into design mode

        if (selScreenName === null) {                        // Moving from an existing screen or starting up?
            newScreenName = Object.keys(screens).filter(function (x) {
                return screens[x].index === 0
            })[0];                        // just starting up, get screen name with index 0 as the initial screen
        }

        oldScreenName = selScreenName;
        selScreenName = newScreenName;                    // set global for functions setting new tab active from index of screen object

        if (populateScreenWidgets() === false) {                            // Widget cancelled change screen request
            selScreenName = oldScreenName;
            event.stopPropagation;                              // Stop bootstrap tab.js from changing
            return;
        }

        Object.keys(screens).forEach(function (screen) {
            sidebarListDiv.childNodes[screens[screen].index].childNodes[0].className = "nav-link pointer";                      // make all elements not active (not selected)
        });

        sidebarListDiv.childNodes[screens[selScreenName].index].childNodes[0].className = "nav-link active";                    // make the selected element active

    } else {
        newScreen();                    // First time start
    }
}

//#endregion
//#region ////////////////////////////////////////////////////////// load widgets

/**
 * Initialise the widgets from initial connection load by unpacking JSON (name compression)
 * @param serverWidgets widgets object that needs to be reencoded for client widgets array.
 */
function initWidgets(serverWidgets) {
    if (serverWidgets) {

        Object.keys(serverWidgets).forEach(function (widget) {
            var myWidget = new Widget(                                          // Rehydrate widget, names compressed for better network efficiency
                serverWidgets[widget].t,            // Type
                serverWidgets[widget].s,            // Screen
                serverWidgets[widget].lX,           // LocX
                serverWidgets[widget].lY,           // LocY
                serverWidgets[widget].sX,           // scaleX
                serverWidgets[widget].sY,           // scaleY
                serverWidgets[widget].ps,           // proportional scaling
                serverWidgets[widget].ver           // version
            );

            // Add optional settings
            if ("z" in serverWidgets[widget]) {
                myWidget.zIndex = serverWidgets[widget].z;
            }
            if ("tt" in serverWidgets[widget]) {
                myWidget.tooltip = serverWidgets[widget].tt;
            }
            if ("dis" in serverWidgets[widget]) {
                myWidget.disabled = serverWidgets[widget].dis;
            }
            if ("pr" in serverWidgets[widget]) {
                myWidget.property = serverWidgets[widget].pr;
            }
            if ("vis" in serverWidgets[widget]) {
                myWidget.visible = serverWidgets[widget].vis;
            }

            Object.keys(serverWidgets[widget].a).forEach(function (attrib) {
                myWidget.attribs[attrib] = serverWidgets[widget].a[attrib];                            // Load attrib kvp
            });

            myWidget.events = JSON.parse(JSON.stringify(serverWidgets[widget].ev));                        // deep copy events from server into the widget

            widgets[widget] = myWidget;
        });
    }
}

/**
 * Create widgets dynamically
 * @param myFrag
 * @param widgetName
 */
function loadWidget(myFrag, widgetName) {
    var widgetObj = document.createElement("iframe");
    widgets[widgetName].retryCounter = 0;

    // For object load
    widgetObj.src = (parent.g.mode === "Flows" ? "flownodes/" : "widgets/") + widgets[widgetName].type + ".html";            // location of widget
    widgetObj.className = "widget unselectable";
    widgetObj.id = widgetName;
    widgetObj.name = widgetName;

    myFrag.appendChild(widgetObj);            // build widgets onto fragment

    widgetObj.addEventListener("load", (event) => {
        // If fw cannot be found then there is a syntax error and the document has errored out on load.
        if (typeof event.target.contentDocument.defaultView.fw === "undefined") {
            badLoad(event);
            return;
        } 
    }, true); // iframe has been added, now waiting for fw reply. Run rest of widget initialisation after widget is in DOM
    widgetObj.addEventListener("error", badLoad, true);

    Log.info("Loading widget '" + widgetName + "' (" + widgets[widgetName].type + ")");

}

function showError(error) {
    document.getElementById("fatalError").style.setProperty("visibility", "visible");
    document.getElementById("widgetSection").style.setProperty("display", "none");
    spinner.style.setProperty("visibility", "hidden");
}

/**
 * Error loading iFrame of widget
 * 
 * @param e error or widget name.;
 */
function badLoad(e) {
    // TODO a broken widget on dashboard should HOLT loading as it now brings unexpected behaviour.
    var widgetName;

    if (typeof e !== "string") {
        widgetName = e.target.id;
    } else {
        widgetName = e;
    }

    // Bind def view if it exists
    widgets[widgetName].defView = document.getElementById(widgetName)?.contentDocument?.defaultView; // Pointer to static options object in widget (used to check for defaults)

    if (brokenWidgets.indexOf(widgetName) !== -1) return;

    if (brokenWidgets.length < 3) {
        if (g.design) {
            alert("WARNING - Problems loading widget '" + widgetName + "' possibly widget is missing or corrupted. Widget is disabled - check configuration, delete widget, then re-add and save.");
        } else {
            Log.error("WARNING - Problems loading widget '" + widgetName + "'. Widget won't be useable, please ask an administrator to check the system configuration to avoid this message in the future.");
            showError();
        }
    } else {
        if (brokenWidgets.length === 3) {
            if (g.design) {
                alert("Too many widgets failing on load, refresh the screen to try again, if the error persists please check for system or platform problems.");
            }
        }
    }
    brokenWidgets.push(widgetName);
    widgetLoadedCnt++;
    if (widgetToLoadCnt === widgetLoadedCnt) {
        finishRender();                                     // Finish the screen loading if this is the last widget
    }
}

window.addEventListener("resize", resizeAllWidgets);

/**
 * Loop over all widgets, rescale
 *
 * @param event
 */
function resizeAllWidgets() {
    for (var widgetName in widgets) {                        // List of widgets on current screen.
        if (widgets[widgetName].screen !== selScreenName) {
            continue;
        }
        resizeWidget(widgetName);
    }
}

/**
* rescale widget
*
* @param name the name of the widget that we want to update
* @param prop the css property that we want to apply,
* @param value the value that has to be changed/applied
*/
function setWidgetProperty(name, prop, value) {
    document.getElementById(name).style.setProperty(prop, value);
}

/**
 * rescale widget
 *
 * @param event
 */
function resizeWidget(widgetName) {
    var defView = document.getElementById(widgetName).contentDocument.defaultView;
    if (defView.fw_scale == undefined || defView.fw == undefined) {
        //setTimeout(resizeWidget, 100, widgetName);  // This should always be ready now and not needed.                                                             // Widget not ready at startup/refresh, wait to try again
        return;
        //TODO: Needs counter to exit if excessive looping
    }

    proportionalScaling(defView, widgets[widgetName]);
    defView.fw_scale(widgets[widgetName].scaleX, widgets[widgetName].scaleY);

    document.getElementById(widgetName).width = widgets[widgetName].scaleX * defView.options.settings.iniWidth;            // Set the width and height of the widget <object> in dashboard DOM
    document.getElementById(widgetName).height = widgets[widgetName].scaleY * defView.options.settings.iniHeight;
}

/**
 * Updates the widgets scaling values to for proportional scaling
 * @param document, widgets document to be modified
 * @param widget, Widget containing attribute values.
 */
function proportionalScaling(defView, widget) {
    // Update scaling if proportional is enabled
    var x_scale, origX = widget.scaleX;
    var y_scale, origY = widget.scaleY;
    var scaleType;

    if (widget.scaling != undefined && widget.scaling.enabled == true && defView.options.settings.scaling) {
        scaleType = widget.scaling.scalingType.split(',');
        // TODO this is a massive performance hit. reading offset requires repaint.
        var dashboardWidth = widgetContainer.offsetWidth; // minus sidebar width
        var dashboardHeight = widgetContainer.offsetHeight; // minus footer

        var width = widget.scaling.width;
        var height = widget.scaling.height;

        // Support scale with constant
        var widthConst = 0;
        if (width.indexOf("+") !== -1) {
            var widthWConst = width.split("+");
            width = widthWConst[0];
            widthConst = widthWConst[1].split("px")[0];
        } else if (width.indexOf("-") !== -1) {
            var widthWConst = width.split("-");
            width = widthWConst[0];
            widthConst = -widthWConst[1].split("px")[0];
        }

        // Check that const is a number
        if (isNaN(widthConst)) {
            widthConst = 0;
        }

        var heightConst = 0;
        if (height.indexOf("+") !== -1) {
            var heightWConst = height.split("+");
            height = heightWConst[0];
            heightConst = heightWConst[1].split("px")[0];
        } else if (height.indexOf("-") !== -1) {
            var heightWConst = height.split("-");
            height = heightWConst[0];
            heightConst = -(heightWConst[1].split("px")[0]);
        }

        // Check that const is a number
        if (isNaN(heightConst)) {
            heightConst = 0;
        }

        var widthVal = parseFloat(width);
        var heightVal = parseFloat(height);
        var widthConstVal = parseFloat(widthConst);
        var heightConstVal = parseFloat(heightConst);


        if (width !== "" && widthVal !== "NaN") {
            if (width.indexOf("%") === -1) {
                x_scale = widthVal / defView.options.settings.iniWidth;
            } else {
                x_scale = ((dashboardWidth * widthVal / 100) + widthConstVal) / defView.options.settings.iniWidth;
            }
            widget.scaleX = x_scale;
        }

        if (height !== "" && heightVal !== "NaN") {
            if (height.indexOf("%") === -1) {
                height = parseInt(height);
                y_scale = heightVal / defView.options.settings.iniHeight;
            } else {
                y_scale = ((dashboardHeight * heightVal / 100) + heightConstVal) / defView.options.settings.iniHeight;
            }
            widget.scaleY = y_scale;
        }

        // Disabled both sides, side must be the same.
        if (scaleType.indexOf("NOHORIZ") !== -1 && scaleType.indexOf("NOVERT") !== -1) {
            widget.scaleY = widget.scaleX;
        } else if (scaleType.indexOf("NOHORIZ") !== -1) {
            widget.scaleX = origX;
        } else if (scaleType.indexOf("NOVERT") !== -1) {
            widget.scaleY = origY;
        }
    }
}

/**
 * Finish widget setup once the widget is loaded
 * BUG: CHROME will run the load routine twice when setting the style to position: absolute on the new Widget. THis is a chrome bug, and will have some impact on dashboard rendering performance
 * See: https://stackoverflow.com/questions/50019134/chrome-object-tags-load-multiple-times-when-setting-style-position-absolute
 * Chromium bug lodged here: https://bugs.chromium.org/p/chromium/issues/detail?id=838008&can=2&start=0&num=100&q=&colspec=ID%20Pri%20M%20Stars%20ReleaseBlock%20Component%20Status%20Owner%20Summary%20OS%20Modified&groupby=&sort=
 * Workaround for older versions of chrome (not working in latest version) is to put the widget in its own div and then style the div, or use display:block on the object itself in the dashboard. Not working in latest version of Chrome.
 */
function widgetLoaded(widgetName) {
    // if in design and opening toolbox, fire widgetTBloaded
    if (g.design && widgetName.indexOf("widgetObjTB#") !== -1) {
        widgetTBloaded(widgetName);
        return;
    }

    /*
    if (widgets[widgetName].loaded) {
        alert("Older version of Chrome detected, not supported by Sensahub. Please update to the latest version of Chrome and reload Sensahub.");                   // Chrome double load bug fixed April 19, but old browsers may exist
    }*/
    Log.verbose(`Widget '${widgetName}'s iframe loaded. (${widgetLoadedCnt + 1}/${widgetToLoadCnt})`);

    var myWidget = widgets[widgetName]; // Pointer to avoid multiple object lookup
    var defView = document.getElementById(widgetName).contentDocument.defaultView;  // Pointer to functions/objects inside widget DOM
    var loadObj = document.getElementById(widgetName); // iFrame
    myWidget.defView = defView; // Pointer to static options object in widget (used to check for defaults)
    var zIndex;

    if (myWidget.attribs["tab index"] && myWidget.attribs["tab index"] !== "") {
        loadObj.setAttribute("tabindex", myWidget.attribs["tab index"]);        // Set tab index for form widgets if set
        // Set first and last focusable elements
        if (firstFocusable == undefined || +firstFocusable.getAttribute("tabindex") > +myWidget.attribs["tab index"]) {
            firstFocusable = loadObj;
        }
    }

    // TODO Rename function to something reasonable
    function _subscribe_to_statestore(event) {
        var eventFuncName = event.event;
        var eventFunc = defView.options.clientEvents.inputEvents[eventFuncName];
        var channel = event.channel.split("/")[0]
        var stateVal = appStateStore.subscribe(channel.toUpperCase(), eventFunc, important);

        // Send to the widget.
        if (stateVal) {
            eventFunc(stateVal)
        }
    }

    var zIndex;

    try {
        // TODO SEPT 19 - Pull out this statement once all dashboards have been moved to V5
        if (myWidget.scaling == undefined) {
            myWidget.scaling = {};
            myWidget.scaling.enabled = false;
        }

        if (!myWidget.scaling.x) myWidget.scaling.x = "";
        if (!myWidget.scaling.y) myWidget.scaling.y = "";
        if (!myWidget.scaling.width) myWidget.scaling.width = "";
        if (!myWidget.scaling.height) myWidget.scaling.height = "";

        myWidget.scaling.enabled = typeof myWidget.scaling.enabled === "string" ? JSON.parse(myWidget.scaling.enabled) : myWidget.scaling.enabled;
        proportionalScaling(defView, myWidget);

        if (g.design && dragData.newWidget) {     // setup initial settings when the widget is first created
            newWidgetLoaded(widgetName, loadObj); // function in design.js
            setTooltip(widgetName);
        }

        if (g.design && typeof defView.fw_startDesign === "function") {
            defView.fw_startDesign();  ///JAN19 - how do we handle if the widget comes back with false?
        }

        if ("zIndex" in myWidget && myWidget.zIndex != undefined) {                // Optional z-index
            zIndex = myWidget.zIndex === "ZINDEX_DEFAULT" ? ZINDEX_DEFAULT : myWidget.zIndex;
        } else {
            // use defaults if z-index not specified or is "ZINDEX_DEFAULT"
            zIndex = defView.options.settings.zIndex === "ZINDEX_DEFAULT" ? ZINDEX_DEFAULT : defView.options.settings.zIndex != undefined ? defView.options.settings.zIndex : ZINDEX_DEFAULT;
        }

        // if scaling enabled override locX and locY
        var xpos;
        var ypos;

        if (myWidget.scaling.enabled) {
            // Use css calc
            xpos = "calc(" + myWidget.scaling.x + ")";
            ypos = "calc(" + myWidget.scaling.y + ")";
        } else {
            xpos = myWidget.locX + "px";
            ypos = myWidget.locY + "px";
        }

        // TODO change this to a CSS class.
        loadObj.setAttribute("style", "position:absolute;overflow:scroll;border:none;left:" + xpos + ";top:" + ypos + ";z-index:" + zIndex);

        loadObj.width = parseInt(myWidget.scaleX * defView.options.settings.iniWidth);            // Set the width and height of the widget <object> in dashboard DOM
        loadObj.height = parseInt(myWidget.scaleY * defView.options.settings.iniHeight);

        var startRet = "";
        if (typeof defView.fw_dashStart === "function") {                // Loaded = chrome workaround if firing this event twice
            startRet = defView.fw_dashStart(g.design ? g.flowEdit ? "FLOWS" : "DESIGN" : "DASHBOARD");
            // Subscribe to client events.
            if (!g.design && !g.flowEdit && widgets[widgetName].events && widgets[widgetName].events.clientEvents && widgets[widgetName].events.clientEvents.inputEvents) {
                var events = widgets[widgetName].events.clientEvents.inputEvents;
                var eventKeys = Object.keys(events);
                var queue = [];
                for (var i = 0; i < eventKeys.length; i++) {
                    // get function to run
                    var important = events[eventKeys[i]].important;
                    if (important === "true") {
                        _subscribe_to_statestore(events[eventKeys[i]]);
                    } else {
                        queue.push(events[eventKeys[i]]);
                    }
                }
                // Rename function to something reasonable
                queue.forEach(_subscribe_to_statestore);
            }
        }

        if (typeof startRet === "string") {
            if (startRet.toUpperCase().trim() !== "OK") {
                throw "Widget failed startup in fw_dashStart (" + ((startRet === "") ? "missing return value)" : startRet) + "). Check widget javascript.";
            } else {
                myWidget.session.ready = true;
            }
        } else {
            throw "Widget failed startup in dashStart as return value was not a string. Check widget code.";
        }

        if (typeof defView.fw_scale === "function") {
            defView.fw_scale(myWidget.scaleX, myWidget.scaleY);                // widget handles scaling for internal elements
        } else {
            ///JAN19 add code that the framework will scale the widget if there isn't a fw_scale
        }

        Log.info("widget '" + widgetName + "' (" + myWidget.type + ") loaded. Version: " + myWidget.version);

        // Another widget has loaded.
        widgetLoadedCnt++;
        if (widgetLoadedCnt == widgetToLoadCnt) {
            if (widgetLoadedCnt === 1) {
                finishRender(widgetName);
            } else {
                finishRender()
            }
        }

    } catch (err) {
        Log.error("DASHBOARD/widgetLoaded", "Widget '" + widgetName + "' failed to load. Error: " + ((typeof err === "string") ? err : err.stack))
        if (brokenWidgets.length < 3) {
            if (g.design || parent.sess.permissions.indexOf("design") !== -1) {
                alert("WARNING - Problems setting up widget '" + widgetName + "' (" + myWidget.type + "). Widget disabled, please delete, re-add and configure widget and save.\nDETAILS:\n" + ((typeof err === "string") ? err : err.stack));
            } else {
                alert("WARNING - Problems setting up widget '" + widgetName + "' (" + myWidget.type + "). Widget won't be useable, please ask an administrator to reset dashboard configuration to avoid this message in the future.\nDETAILS:\n" + err);
            }                 // else show the user a nice error box
        } else {
            if (brokenWidgets.length === 3) {
                if (g.design) {
                    alert("Too many widgets failing on startup, please check for system or platform problems. Continuing without further alerts.");
                } else {
                    alert("Too many widgets failing on startup, refresh the screen to try again, if the error persists, please ask an administrator to investigate. Continuing without further alerts.");
                    finishRender();
                }
            }
        }

        brokenWidgets.push(widgetName);

        widgetLoadedCnt++;                                      // Increment even if erroring out

        if (widgetToLoadCnt === widgetLoadedCnt) {
            if (widgetLoadedCnt === 1) {
                finishRender(widgetName);
            } else {
                finishRender()
            }                                   // Finish the screen loading
        }
    }
}

function handleWidgetItems(widget) {

    if (typeof widgets[widget].defView === "undefined") {
        return
    };

    widgetListeners(widgets[widget].defView.document);
    // Chrome won't bind eventlisteners to newly created widgets without a significant delay.
    setTooltip(widget);
    // if ("tooltip" in widgets[widget] || g.design) {             // if in design show the tooltip with widget name (helps the script writer)
    //     setTooltip(widget);            // Widget instance has a tooltip, so set it up
    // } else {
    //     if ("tooltip" in widgets[widget].defView.options.settings) {
    //         if (widgets[widget].defView.options.settings.tooltip !== "") {
    //             // No instance tooltip but options has a default tooltip, show that
    //             setTooltip(widget);
    //         }
    //     }
    // }
}


/**
 * Last step of the screen load after widgets are loaded and initialised with dashstart.
 * Finished loading all the widgets on the screen, use timeout to render screen here
 *
 * @param widgetName Widget to display.
 */
function finishRender(widgetName) {
    var screenWidgets = getScreenWidgets();


    brokenWidgets.forEach(function (widget) {
        widgets[widget].disabled = true;
    });

    brokenWidgets = [];

    // check if design and the widgets are disabled -- adjust CSS opacity as needed
    screenWidgets.forEach(function (widget) {
        //TODO: If the options setting is visible = false, then should show the widget as 100% in design, 0% in dashboard. Eg. scripts
        if (g.design) {
            if (typeof widgets[widget].defView != "undefined" && widgets[widget].defView?.options?.settings?.visible != undefined && widgets[widget]?.defView?.options?.settings?.visible === false) {
                document.getElementById(widget).style.opacity = "0.5";
            }
            if (typeof widgets[widget].visible != "undefined" && !widgets[widget].visible) {                                       // If widget visible is set to false in settings, override option option
                document.getElementById(widget).style.opacity = "1";
            }
        } else {
            if (typeof widgets[widget].defView != "undefined" && widgets[widget].defView.options.settings.visible != undefined && widgets[widget].defView.options.settings.visible === false) {
                document.getElementById(widget).style.display = "none";
            }
            if (typeof widgets[widget].visible != "undefined" && !widgets[widget].visible) {                                       // If widget visible is set to false in settings, override option option
                document.getElementById(widget).style.display = "none";
            }
        }

        if (typeof widgets[widget].defView != "undefined" && typeof widgets[widget].disabled !== "undefined" && widgets[widget].disabled === true) {
            //document.getElementById(widget).style.opacity = "0.5";
            // if the widget has some kind of input, need to disable the input. This is required for text area, input, dropdown, and possibly others.
            var widget_iframe = document.getElementById(widget);
            if (widget_iframe.contentWindow.document.getElementsByTagName("input")[0] !== undefined) {
                // if the type is an input, disable the input, and add the class disabled. This is for the input widget and dropdown widget.
                // adding the class "disabled" allows both of the settings "disable edit" or "disabled" to be selected
                widget_iframe.contentWindow.document.getElementsByTagName("input")[0].disabled = true;
                widget_iframe.contentWindow.document.getElementsByTagName("input")[0].classList.add("disabled");
            } else if (widget_iframe.contentWindow.document.getElementsByTagName("textarea")[0] !== undefined) {
                // if the type is a text area, disable the text area.
                widget_iframe.contentWindow.document.getElementsByTagName("textarea")[0].disabled = true;
            } else {
                document.getElementById(widget).style.opacity = "0.5";
            }
        }

        // Load 
        if (widgets[widget].defView && typeof widgets[widget].defView.fw_screenLoaded === "function") {        // Loaded = chrome workaround if firing this event twice
            widgets[widget].defView.fw_screenLoaded(g.design ? g.flowEdit ? "FLOWS" : "DESIGN" : "DASHBOARD"); // WHY!?
        }

    });

    // add slide animation. load event on script already fired.
    document.getElementById("sidebar").classList.add("toolboxSlide");
    document.getElementById("minButton").classList.add("toolboxSlide");
    document.getElementById("sidebarGrp").style.setProperty("display", "inline");
    spinner.style.setProperty("visibility", "hidden");

    // Paint before firing after render.
    setTimeout(afterRender, 0, widgetName);
}

/**
 * Display screen as fast as possible, put non essential display tasks to finish widget loading here.  Called after each screen selection, (JAN19 now only once on startup)
 *
 * @param widgetName Widget to copy when copy function is invoked. (Not used in initial loading).
 */
async function afterRender(widgetName) {
    Log.verbose("Displaying widgets on the dashboard.");

    var screenWidgets = getScreenWidgets();

    if (parent.g.initLoad) {
        statusBar.status({
            message: "Welcome " + capFirstLetter(parent.sess.fullname),
            important: true
        });
    }

    // check to see if this is a copied widget (we share the widget hydration functions for screen load with widget copy - so only run when copying not loading screens)
    if (clipboard[Object.keys(clipboard)[0]] != undefined && g.loadedScreen) {
        if (widgetName !== undefined) {
            handleWidgetItems(widgetName);
        }
        // reset the widget load counts
        widgetToLoadCnt = 0;
        widgetLoadedCnt = 0;
        return;
    }

    g.loadedScreen = true;

    // Queue is initially paused until we setup & are ready (events reads widget options objects so widget must be in the DOM). Leave Q paused in design mode
    if (!g.design) {
        Log.info("Releasing event queue.");
        events.paused(false);
    }

    // Draw the links after all the flow node widgets are rendered
    if (g.flowEditor) {
        await g.designPromise;
        rebuildLinks();
    }

    // initTT(); // Setup for tooltips

    Log.verbose("Running screenLoaded hook on widgets.");
    screenWidgets.forEach(function (widget) {
        handleWidgetItems(widget);
    });

    // NOTE - if the server has timed out and the user has moved to another application, when the server comes back this will force the window to the foreground
    window.focus();                                 // Needed for key events to fire

    parent.g.initLoad = false;                             // First time loaded

    // reset the widget load counts
    widgetToLoadCnt = 0;
    widgetLoadedCnt = 0;

    // Dashboard mode shouldn't appear to users in the status bar
    var statusMessage = parent.g.mode === "Dashboard" ? "Ready" : `${parent.g.mode} Mode`;
    statusBar.message = statusMessage;
    statusBar.defaultStatus = statusMessage;

    // Show dashboard!
    document.getElementById("widgetContainer").style.setProperty("visibility", "visible");
    sidebarListDiv.style.opacity = 1;
}

/**
 * Returns the widgets on the given screen.
 *
 * @param screenName Screen name to get widgets from (or blank for current screen)
 * @returns Array of widget Objects.
 */
function getScreenWidgets(screenName) {                         //TODO: No need to dynamically recalculate this multiple times, once per screen load is enough
    var screenWidgets;
    if (screenName == undefined) {
        // names of all the widgets on the screen
        screenWidgets = Object.keys(widgets).filter(function (widget) {
            return widgets[widget].screen === selScreenName
        });
    } else {
        screenWidgets = Object.keys(widgets).filter(function (widget) {
            return widgets[widget].screen === screenName
        });
    }
    return screenWidgets;
}

/**
 * Attaches event listeners to the widgets.
 * @param myWidget Widget to attach events to.
 */
function widgetListeners(myWidget) {
    // issue of double load was actuation issue, not event propagation as originally thought
    // thus we can just use the normal event Listeners
    myWidget.addEventListener("contextmenu", function (event) {
        event.preventDefault();
        return false;
    });

    myWidget.addEventListener("mousemove", mouseMove, false);
    myWidget.addEventListener("mouseup", mouseUp, false);
    myWidget.addEventListener("scroll", {}, true);
    myWidget.addEventListener("mousedown", mouseDown, { passive: true });
    myWidget.addEventListener("dblclick", widgetDblClick, false);
    myWidget.addEventListener("keydown", keyDown, false);
}

//#endregion
//#region ////////////////////////////////////////////////////////// Widget mouse events

/**
 * Handle mouse clicks over widget depending on the mode.
 * @param event
 */
function mouseDown(event) {
    if (g.design && !g.dragLink && !parent.g.isMobile) {                // If I'm dragging a flow link, don't drag the widget
        designMouseDown(event);
    } else {
        // if we're on mobile we don't stop propagating
        if (!parent.g.isMobile) {
            event.stopPropagation();
        }
        //continue as needed
        if (event.currentTarget.defaultView != undefined && typeof event.currentTarget.defaultView.fw_clicked === "function") {
            event.currentTarget.defaultView.fw_clicked(event);                      // run the click event in the widget
        }
        if (event.currentTarget.defaultView != undefined && typeof event.currentTarget.defaultView.fw_mouseDown === "function") {
            event.currentTarget.defaultView.fw_mouseDown(event);                    // run the mouse down event in the widget
        }
    }
}

/**
 * Handle mouse moving over widget depending on mode (drag new Widget from toolbox, drag existing widget)
 * @param event
 */
function mouseMove(event) {
    // TODO 05/06 DG Monitor this if clicking bugs come back. Fixed highlighting issues
    //event.preventDefault();
    if (g.design && dragData.widgetName) {                // Adjust the widget position if dragging
        designMouseMove(event);
    } else {
        if (typeof event.currentTarget.defaultView.fw_mouseMove === "function")
            event.currentTarget.defaultView.fw_mouseMove(event);                // Send mousemove to widget if it wants it
    }
}

/**
 * Handle widget mouse up depending on mode (edit mode set here not on mousedown as we could be dragging with mousedown)
 * @param event
 */
function mouseUp(event) {
    if (g.design) {
        designMouseUp(event)
    } else {
        event.stopPropagation();
        if (typeof event.currentTarget.defaultView.fw_mouseUp === "function")
            event.currentTarget.defaultView.fw_mouseUp(event);                // run the mouse down event in the widget
    }
}

/**
 * Reset the cursor after loaded from Chrome/Edge, or directly for IE.
 * @param widgetObj
 */
function resetCursor(widgetObj) {
    var myGroup = widgetObj.contentDocument.getElementById("group");
    if (myGroup) {
        myGroup.style.setProperty("cursor", "default");
    }
}

//#endregion
//#region ////////////////////////////////////////////////////////// widget events

/**
 * Double click the widget.
 * @param event
 */
function widgetDblClick(event) {
    if (typeof event.currentTarget.defaultView.fw_dblClicked === "function") {
        event.currentTarget.defaultView.fw_dblClicked(event);
    }
    return false;
}

// Add event listener for when the canvas of dashboard is clicked.
var screenClick = new EventHandler(
    // At target
    null,
    // bubbling
    function (a, b) {
        // Want to make this search all the Iframes as well.
        if (a.indexOf(b.target.id) !== -1) {
            return false;
        }

        var notFound = a.every(function (item, index, arr) {
            var el = document.querySelector("#" + item);
            if (el instanceof HTMLElement) {
                if (el.contains(b.target)) {
                    return false;
                } else {
                    return true;
                }
            }
        });

        if (notFound) {
            parent.closeHelpSidebar();
        }
    },
    // capturing
    null
);

document.addEventListener(
    "click",
    screenClick.handleEvent.bind(
        screenClick,
        [
            "minButtonTag",
            "sideScreenEditor",
            "widgetToolboxDiv",
            "settingsToolboxDiv",
            "codeToolboxDiv"
        ]
    ),
    false
);

//TODO: Move to design when dependecies are sorted
/**
 * Process keypresses for designer and send to widgets if they want it.
 * @param e
 */
function keyDown(e) {
    if (g.design && editData.widgetName && (!g.codeToolboxOpen || (g.codeToolboxOpen && e.keyCode === 46))) {
        // Designer options
        switch (e.keyCode) {
            case 13:
                // Enter
                break;
            case 46:
                // Del
                if (String(e.target).toUpperCase().indexOf("TEXTAREA") === -1 && g.codeToolboxOpen) {
                    delWidgetClick();
                } else {
                    if (editData.defView.options.settings.type.toUpperCase() === "INPUT" && String(e.target).toUpperCase().indexOf("BODYELEMENT") !== -1) {
                        delWidgetClick();
                    } else if (String(e.target).toUpperCase().indexOf("BODY") !== -1) {
                        delWidgetClick();
                    }
                }
                break;
            case 27:
                // ESC
                parent.toggleToolbox('close');
                parent.closeHelpSidebar();
                resetEdit(editData.widgetName, "cancel");
                break;
            case 37:
                // Left arrow
                if (document.activeElement.nodeName !== "INPUT" && document.activeElement.nodeName !== "TEXTAREA") {
                    // Don't allow movement during form entry
                    e.preventDefault();
                    editData.widgetObj.style.setProperty("left", (widgets[editData.widgetName].locX - DESIGNGRID) + "px");
                    // move editing widget left by a grid space
                    if (editData.dragHdls) {
                        editData.dragHdls.style.setProperty("left", parseInt(editData.dragHdls.style.getPropertyValue("left")) - DESIGNGRID + "px");                              // Move draghandles for widgets allowing scaling
                    }
                    moveLinks(editData.widgetName, DESIGNGRID, 0);              // Move links for flows
                    widgets[editData.widgetName].locX -= DESIGNGRID;
                    g.dirty = true;
                }
                break;
            case 38:
                // Up arrow
                if (document.activeElement.nodeName !== "INPUT"  && document.activeElement.nodeName !== "TEXTAREA") {
                    e.preventDefault();
                    editData.widgetObj.style.setProperty("top", (widgets[editData.widgetName].locY - DESIGNGRID) + "px");
                    if (editData.dragHdls) {
                        editData.dragHdls.style.setProperty("top", parseInt(editData.dragHdls.style.getPropertyValue("top")) - DESIGNGRID + "px");
                    }
                    moveLinks(editData.widgetName, 0, DESIGNGRID);
                    widgets[editData.widgetName].locY -= DESIGNGRID;
                    g.dirty = true;
                }
                break;
            case 39:
                // Right arrow
                if (document.activeElement.nodeName !== "INPUT" && document.activeElement.nodeName !== "TEXTAREA") {
                    e.preventDefault();
                    editData.widgetObj.style.setProperty("left", (widgets[editData.widgetName].locX + DESIGNGRID) + "px");
                    if (editData.dragHdls) {
                        editData.dragHdls.style.setProperty("left", parseInt(editData.dragHdls.style.getPropertyValue("left")) + DESIGNGRID + "px");
                    }
                    moveLinks(editData.widgetName, -DESIGNGRID, 0);
                    widgets[editData.widgetName].locX += DESIGNGRID;
                    g.dirty = true;
                }
                break;
            case 40:
                // Down arrow
                if (document.activeElement.nodeName !== "INPUT"  && document.activeElement.nodeName !== "TEXTAREA") {
                    e.preventDefault();
                    editData.widgetObj.style.setProperty("top", (widgets[editData.widgetName].locY + DESIGNGRID) + "px");
                    if (editData.dragHdls) {
                        editData.dragHdls.style.setProperty("top", parseInt(editData.dragHdls.style.getPropertyValue("top")) + DESIGNGRID + "px");
                    }
                    moveLinks(editData.widgetName, 0, -DESIGNGRID);
                    widgets[editData.widgetName].locY += DESIGNGRID;
                    g.dirty = true;
                }
                break;
        }
    }

    switch (e.keyCode) {
        // Keyboard shift/alt/ctrl modifiers
        case 9:
            // Tab 
            if (document.activeElement.id == "mainBody") {
                firstFocusable.focus();
                // stop tab key from causing incorrect tabindex order
                e.preventDefault();
            }
            break;
        case 16:
            // Shift
            g.keyShift = true;
            break;

        case 17:
            // Ctrl
            g.keyCtrl = true;
            break;

        case 18:
            // Alt
            g.keyAlt = true;
            break;

        case 27:
            // ESC
            parent.closeHelpSidebar();
            if (g.design) {
                dragData = {};
                if (editData.widgetName) {
                    resetEdit(editData.widgetName, "cancel");
                }
                if (g.menuOpen) {
                    toggleToolbox('widgetToolboxDiv', 'close');
                }
            }
            break;

        case 45:
            // Insert key
            if (g.design && !editData.widgetName) {
                resetEdit(editData.widgetName, "cancel");
                toggleToolbox('widgetToolboxDiv');
            }
            break;

        case 68:
            // Ctrl + D copy screen
            if (g.design && !editData.widgetName && e.ctrlKey) {
                // Override browser Ctrl-Z function
                e.preventDefault();
                parent.confirmModal("Confirm that you want to copy screen '" + selScreenName + "'?", "Copy " + (g.flowEditor ? "Node" : "Widget") + " Screen", { confirmText: "Copy" })
                    .then((res) => {
                        if (res) {
                            selectedTab(selScreeName)
                        }
                    });
            }
            break;

        case 86:
            // ctrl + v/V paste widget
            if (g.design && !editData.widgetName) {
                if (e.ctrlKey && copyWidget) {
                    pasteWidget();
                    e.preventDefault();
                    return false;
                }
            }
            break;

        case 67:
            // ctrl + c/C copy widgets
            if (g.design && editData.widgetName) {
                if (e.ctrlKey) {
                    if (e.target.type == undefined) {
                        copyWidget();
                        e.preventDefault();
                        // Overrides browser Ctrl-C function
                        return false;
                    }
                }
            }
            break;
        // Reset dragging if the dragging has failed and hasn't released the widget

        case 83:
            // ctrl + s/S
            if (g.design && !editData.widgetName) {
                if (e.ctrlKey) {
                    resetEdit(editData.widgetName, "cancel");
                    saveScreens(true);
                    e.preventDefault();
                    // Overrides browser Ctrl-S function
                    break;
                }
            }

            // Save widget settings if widget is selected. Useful if editor is open.
            if (g.design && !!editData.widgetName) { // Double negate to make bool.
                if (e.ctrlKey) {
                    resetEdit(editData.widgetName,'save');
                    e.preventDefault();
                }
            }
            break;
        // Reset dragging if the dragging has failed and hasn't released the widget
        default:
    }

    var allWidgets = document.querySelectorAll(".widget");
    // send keypress to widgets if they want them
    for (var i = 0; i < allWidgets.length; i++) {
        if (typeof allWidgets[i].contentDocument.defaultView.fw_keyPress === "function")
            allWidgets[i].contentDocument.defaultView.fw_keyPress(e.keyCode);
    }
    return false;
}

//TODO: Could go into design
/**
 * Process global keypress for keyboard modifiers.
 * @param e
 */
function keyUp(e) {
    switch (e.keyCode) {
        case 16:
            // Shift
            g.keyShift = false;
            break;
        case 17:
            // Ctrl
            g.keyCtrl = false;
            break;
        case 18:
            // Alt
            g.keyAlt = false;
            break;
        default:
    }
}

/**
 * Process messages received from host.
 * @param topics
 * @param dataObj
 * @param retain
 */
function recvHost(topics, dataObj, retain) {
    switch (topics[1]) {
        case "$SYS":
            switch (topics[4]) {
                case "STARTNODES":
                    links = Object.assign([], dataObj.value.links);
                // NOTE no break, flows into startWidgets
                case "STARTWIDGETS":
                case "STARTSETTINGS":
                case "STARTAPPSETTINGS":
                    initWidgets(dataObj.value.widgets);                            // load widget array
                    initScreens(dataObj.value.screens);
                    switch (topics[4]) {                                            // Get rest of the screens but only on initial load
                        case "STARTNODES":
                            parent.publishCmd("NODEREST", parent.sess.deviceType.toUpperCase() + "|" + parent.sess.user.toUpperCase(), { "source": "client/startup", "other": parent.g.dashName });
                            break;
                        case "STARTWIDGETS":
                            parent.publishCmd("WIDGETREST", parent.sess.deviceType.toUpperCase() + "|" + parent.sess.user.toUpperCase(), { "source": "client/startup", "other": parent.g.dashName });
                            break;
                        case "STARTSETTINGS":
                            parent.publishCmd("SETTINGSREST", parent.sess.deviceType.toUpperCase() + "|" + parent.sess.user.toUpperCase(), { "source": "client/startup", "other": parent.g.dashName });
                            break;
                        case "STARTAPPSETTINGS":
                            parent.publishCmd("APPSETTINGSREST", parent.sess.deviceType.toUpperCase() + "|" + parent.sess.user.toUpperCase(), { "source": "client/startup", "other": parent.g.dashName });
                            break;
                    }
                    clearTimeout(restTimer);
                    restTimer = setTimeout(function () {
                        Log.error("ERROR - REST screens not sent after 10 seconds");
                        alert("ERROR - Screen data is incomplete, server has not sent all required data. Please reload the page to retry.");
                    }, 15000);                            // Ensure the rest screens are received.
                    break;

                case "NODEREST":                                                  // Note no break, flows into widgetRest
                    for (var i = 0; i < dataObj.value.links.length; i++) {
                        links.push(dataObj.value.links[i]);                                // Add remaining links to the links array
                    }
                    nodeNames = dataObj.value.nodeNames;
                    flowGroups = dataObj.value.flowGroups;
                // NOTE - no break, will run widgetrest below
                case "SETTINGSREST":
                case "APPSETTINGSREST":
                case "WIDGETREST":
                    initWidgets(dataObj.value.widgets);                            // append widget collection but dont show first screen
                    widgetNames = dataObj.value.widgetNames;
                    widgetGroups = dataObj.value.widgetGroups;

                    if (parent.g.mode === "Design" || parent.g.mode === "Flows") {
                        parent.publishCmd("GETCHANNELS", parent.sess.user, { "source": "client/saveFlows" }, parent.sess.permissions.indexOf("developer") > -1 ? true : false);                 // Add system channels if I'm a developer role
                    }
                    g.afterRest = true;
                    clearTimeout(restTimer);
                    break;

                case "IMG_RELOAD":
                    if (dataObj.usrmeta in widgets) {
                        widgets[dataObj.usrmeta].defView.fw_designAction("IMG_RELOAD", dataObj.value);                               // Call the image load input function directly
                        statusBar.status({
                            message: "Image for widget '" + dataObj.usrmeta + "' uploaded to server.",
                            important: true
                        });
                    } else {
                        Log.warn("WARNING - unable to load image '" + dataObj.usrmeta + "' as system metadata '" + dataObj.sysmeta.source + "' doesn't address a widget");
                    }
                    alert("reload " + g.dirty)
                    g.readyToSave = true;                            // Flag to stop saving widget collection until all the image is uploaded
                    break;
                case "UPLOAD":
                    if (g.design === true) {
                        var widgetName = dataObj.sysmeta.other.split("/")[1];
                        if (widgetName === undefined) {
                            break;
                        }
                        if (widgetName in widgets) {
                            widgets[widgetName].defView.fw_designAction("IMAGE_UPLOADED", dataObj);
                        }
                        parent.status("Image '" + dataObj.usrmeta.fileName + "' loaded.", "IMPORTANT");
                        g.readyToSave = true;
                    } else {
                        serverPubEvent(topics, retain, dataObj);
                    }
                    break;
                default:
                    serverPubEvent(topics, retain, dataObj);
            }
            break;

        default:                    // Subscription updates
            serverPubEvent(topics, retain, dataObj);                // Server sending data to widget
    }
}

// Option to send an event to another screen
///JAN19 how do we have events for things like reload for images if we turn don't instantiate the broker for design? Have to partially enable events then.
// cater for network name when sending to server
// Dont send to the same widget the same data multiple times
// Do we expect everyone to enter both an INI and a FEED event for widgets receiving server events. Better to automatically handle INI?? Maybe have an INI + Feed output event in the settings dropdown?

// Routing - Client uses the scope to route, the server uses the sysmeta.source (server/function) for event routing

/**
 * Initialise events framework for all the widgets on the screen.
 * @param unsubList
 */
function setupScreenEvents(unsubList) {
    events = new EventBroker();
    // PubSub broker for the screen

    getScreenWidgets().forEach(function (widget) {
        // Process all the instance definitions for events
        if ("events" in widgets[widget] && "clientEvents" in widgets[widget].events && "inputEvents" in widgets[widget].events.clientEvents) {
            var clInp = widgets[widget].events.clientEvents.inputEvents;
            Object.keys(clInp).forEach(function (inputEvent) {
                events.subscribe(String(clInp[inputEvent].channel), widget, true);          // Subscribe for all client input local channels
            });
            ///JAN19 TODO - should we be susbscribing to output channels for the client? Its needed for the server channel.
        }

        if ("events" in widgets[widget] && "serverEvents" in widgets[widget].events) {
            if ("inputEvents" in widgets[widget].events.serverEvents) {
                var svInp = widgets[widget].events.serverEvents.inputEvents;
                Object.keys(svInp).forEach(function (inputEvent) {
                    events.subscribe(svInp[inputEvent].channel, widget, true);              // Subscribe to all server events defined
                });
            }
            if ("outputEvents" in widgets[widget].events.serverEvents) {
                var svOut = widgets[widget].events.serverEvents.outputEvents;
                Object.keys(svOut).forEach(function (outputEvent) {
                    events.subscribe(svOut[outputEvent].channel, widget, false);            // Subscribe to all server events defined
                });
            }
        }
    });

    events.sendSvrSubs(unsubList);               // Send to server subscriptions previously setup (passing subscriptions to remove from old screen)
}

/**
 * API for sending events from the server to the event Q.
 * @param topics topic to send event data to.
 * @param retain Flag - Should the server rememeber the last published value
 * @param data Data to be published to the server.
 */
function serverPubEvent(topics, retain, data) {
    // Check for a valid data object and insert sysmeta with source info
    if (typeof data === "object" && "value" in data) {
        if (data.sysmeta.source === null) {
            data.sysmeta.source = "server/" + (retain ? "ini" : "feed");                // Server should be sending the function in the sysmeta, if not we will use MQTT retain to identify subscription value (ini) or realtime value (feed)
        }
    } else {

        if (data == undefined) {
            data = {};
        }

        if (!data.value) {
            data.value = "";
        }

        var label = "";
        if (typeof data.sysmeta !== "undefined" && typeof data.sysmeta.label !== "undefined") {
            label = data.sysmeta.label;
        }
        if (typeof label !== "string" && !(label instanceof String)) {
            label = "";
        }

        // No event data specified but there was data, so build default event object
        data = new parent.evData({ "source": "server/" + (retain ? "ini" : "feed"), "label": label }, "", data.value);
    }

    // Strip out the network name as not needed locally
    var channel = topics[1] + "/" + topics[2] + "/" + topics[3] + "/" + topics[4];
    // Sometimes when changing screens a server message arrives just while event object is destroyed
    if (events) {
        events.publish(true, channel, data);
    }
}

/**
 * API for sending events called from a widget trigger (actuation), will look up and execute all the events assigned to the trigger name. Note data will only be used if not specified in the instance event record
 * @param widget
 * @param outEventName
 * @param data
 * @param usrmeta
 */
function widgetPubEvent(widget, outEventName, data, usrmeta) {

    if (typeof data === "object" && "value" in data) {                    // Check for a valid data object and insert sysmeta with source info
        if (data.sysmeta.source == undefined) {
            data.sysmeta.source = "widget/" + widget;                        // Assume widget (local)
        }
    } else {
        if (data == undefined) {
            data = null;
        }
        data = new parent.evData({ "source": "widget/" + widget }, usrmeta, data);                    // No event data specified but there was data, so build default event object
    }

    // publish new events for server events that are matched to the output event name (and replace static data with instance data if it is present)
    if ("serverEvents" in widgets[widget].events && "outputEvents" in widgets[widget].events.serverEvents) {

        var svrOutEvents = widgets[widget].events.serverEvents.outputEvents;

        Object.keys(svrOutEvents).forEach(function (event) {
            // Lookup widget instance event list
            if (svrOutEvents[event].trigger.toUpperCase().trim() === outEventName.toUpperCase().trim()) {
                // Match to our trigger
                if (svrOutEvents[event].data != undefined) {
                    data = svrOutEvents[event].data;                                // Override static data send by fireEvent with the instance event data
                }
                data.sysmeta.label = isNaN(parseInt(data.value)) ? Array.isArray(data.value) ? "array" : typeof data.value : "number";
                events.publish(true, svrOutEvents[event].channel, data);
            }
        });
    }
}

/**
 *  Main event object, orchestring both local and server events. Instantiated on each screen load.
 */
function EventBroker() {                // Constructor
    var eventQ = new Queue();
    var qPaused = true;                // Start off with the queue paused
    var retVals = [];

    // Channel has many subscriptions, clients can be subscribed to many channels, or the same channel with different attributes
    var subscriptions = {};
    var subscription = function () {
        this.server = {
            input: [],
            output: []
        }
        this.local = {
            input: [],
            output: []
        }
    }

    this.paused = function (state) {                    // Change state of the message queue (true / false)
        qPaused = state;
        if (!state) {                                                               // If queue is changed to enable, process messages
            setTimeout(this.processQ, 0);                                                               // Render any pending UI changes before processing next event
        }
    }

    ///JAN19 Should we be subscribing to a channel with history attribute, so INI gets sent back with a history array not a value?
    //TODO: implement input / output channel subscriptions better for the server (eg. switch uses)
    this.subscribe = function (channel, widget, input) {

        channel = updateChannelNamespace(channel);

        var server = (channel.split("/").length === 4);                         // Server channels have 4 items in the fqn

        if (!validChannelScope(server, channel)) {
            Log.warn("WARNING - Subscription aborted as event from widget '" + widget + "' has an invalid channel '" + channel);
            return false;
        }

        if (!widget || widget.trim() === "" || !(widget in widgets)) {
            // Does widget exist?
            Log.warn("WARNING - Event aborted as widget '" + widget + "' doesn't exist");
            return false;
        }

        var fqn = channel.toUpperCase().trim();

        if (!(fqn in subscriptions)) {
            subscriptions[fqn] = new subscription();                // Add new subscription as not existing
        }

        subscriptions[fqn][server ? "server" : "local"][input ? "input" : "output"].push(widget);                        // Add widget to the subscription list (will replace if existing)

        if (!qPaused && server) {
            // Send any new subscription to the server (not if paused - at the start we will send all with sendSvrSubs command)
            svrSubList([fqn]);                                                  // Even if already subscribed we will get a message back (eg. if doing a set channel)
        }
    }

    /**
     * Send the subscribe list to the server as one cached list.
     * @param subs
     */
    function svrSubList(subs) {
        //parent.MQTT.subscribe(subs);
        parent.subscribeSvr(subs);
    }

    /**
     * Send the subscribe list to the server as one cached list.
     * @param subs
    */
    this.svrUnsubList = function (subs) {
        //parent.MQTT.unsubscribe(subs);
        parent.unsubscribeSvr(subs);
    }

    // Send the server subscription list to the server as one cached list but only unique subscriptions not already subscribed
    this.sendSvrSubs = function (unsubList) {
        var newSubList = [];

        Object.keys(subscriptions).forEach(function (fqn) {
            if (subscriptions[fqn]["server"]["input"].length > 0 || subscriptions[fqn]["server"]["output"].length > 0) {
                newSubList.push(parent.g.netName.toUpperCase() + "/" + fqn.toUpperCase())
            }
        });

        svrSubList(newSubList);                                 // Send subscription
        this.svrUnsubList(AnotB(unsubList, newSubList));        // Unsubscribe from the subscriptions no longer needed by the new widgets on the new page

        // return the difference between 2 arrays
        //TODO could this be done in a filter ?
        // This is available in multiple files. Not relevant to dashboard.
        function AnotB(setA, setB) {
            if (typeof setA === "undefined" || typeof setB == "undefined") {
                Log.warn("Undefined detected for processing unsubscribe list");
                return [];
            }

            if (setA === [] || setB === []) {
                Log.warn("Empty list to subscribe or unsubscribe");
                return [];
            }

            if (setB.length === 0) {
                return setA;
            }
            var out = [];
            for (var i = 0; i < setA.length; i++) {
                for (var j = 0; j < setB.length; j++) {
                    if (setA[i] === setB[j]) {
                        ++i;
                        j = 0;
                    } else {
                        if ((j === setB.length - 1) && (i <= setA.length - 1)) {
                            out.push(setA[i]);
                        }
                    }
                }
            }
            return out;
        }
    }

    // Unsubscribe from a channel (server or client, input or output)
    this.unsubscribe = function (channel, widget) {
        var fqn = channel.toUpperCase().trim();

        if (!(fqn in subscriptions)) {
            Log.info("Can't unsubscribe '" + widget + "' from channel '" + channel + "' as no channel with this name has subscribers.");
            return false;                        // subscription does not exist
        }

        if (!(subscriptions[fqn]["server"]["input"].indexOf(widget) !== -1) && !(subscriptions[fqn]["server"]["output"].indexOf(widget) !== -1) &&
            !(subscriptions[fqn]["local"]["input"].indexOf(widget) !== -1) && !(subscriptions[fqn]["local"]["output"].indexOf(widget) !== -1)) {
            Log.info("Can't unsubscribe '" + widget + "' from channel '" + channel + "' as widget isn't subscribing.");
            return false;                        // client isnt in subscription list
        }

        // Only unsubscribe server if this is the last subscription
        if ((subscriptions[fqn]["server"]["input"].length === 1 && subscriptions[fqn]["server"]["input"].indexOf(widget) !== -1) ||
            (subscriptions[fqn]["server"]["output"].length === 1 && subscriptions[fqn]["server"]["output"].indexOf(widget) !== -1)) {
            this.svrUnsubList([parent.g.netName + "/" + channel]);
        }

        // Delete widget subscription
        var indexPos = subscriptions[fqn]["server"]["input"].indexOf(widget);
        if (indexPos !== -1) {
            subscriptions[fqn]["server"]["input"].splice(indexPos, 1);
        }
        indexPos = subscriptions[fqn]["server"]["output"].indexOf(widget);
        if (indexPos !== -1) {
            subscriptions[fqn]["server"]["output"].splice(indexPos, 1);
        }
        indexPos = subscriptions[fqn]["local"]["input"].indexOf(widget);
        if (indexPos !== -1) {
            subscriptions[fqn]["local"]["input"].splice(indexPos, 1);
        }
        indexPos = subscriptions[fqn]["local"]["output"].indexOf(widget);
        if (indexPos !== -1) {
            subscriptions[fqn]["local"]["output"].splice(indexPos, 1);
        }

        return true;
    };

    ///JAN19 do we need the server flag now that we can see if the message is from the server or client by the sysmeta??
    this.publish = function (server, channel, evData) {
        if (!g.design) {                                                                    // Don't process messages in design mode

            // Is the channel structured correctly?
            if (!validChannelScope(server, channel)) {
                Log.warn("Event aborted as event from '" + evData.sysmeta.source + "' has an invalid channel '" + ((typeof channel === "string") ? channel : channel.join("/")).toString() + "'");
                return false;
            }

            // Check the message is formatted correctly before putting on the Q
            if (typeof evData.sysmeta !== "object" || evData.sysmeta.source.indexOf("/") === -1) {
                Log.warn("Event '" + evData.value + "' with system metadata '" + evData.sysmeta.source + "' isn't in the correct format for routing, event aborted.");
                return false;
            }

            // Check that the data is structured correctly
            if (typeof evData === "undefined" || typeof evData.value === "undefined") {                            // Check that its in evData format
                var source = evData.sysmeta.source.split("/")[1];
                Log.warn("Event " + channel + "/" + scope + " aborted as widget '" + source + "' (" + widgets[source].type + ") isn't using the sensahub event data structure");
                return false;
            }

            if (!server) {                                                  // Only clients do getValue
                var scope = channel.split("/")[1].trim();

                // we want to check if our incoming event is a getValue request. if so, grab the subscribed widgets.
                if (scope.toUpperCase().indexOf("GETVALUE") !== -1) {

                    var size = scope.substring(scope.indexOf("(") + 1, scope.indexOf(")"));

                    for (var i = 0; i <= size; i++) {
                        retVals[i] = null;
                    }

                    //MAR20 CHECK GETVALUE
                    scope = "getvalue";

                    var fqn = String(channel.split("/")[0] + "/" + scope).toUpperCase();

                    if (fqn in subscriptions && !server) {

                        subscriptions[fqn]["local"]["input"].forEach(function (item) {
                            var index = parseInt(widgets[item].property);

                            var val = widgets[item].defView.options.clientEvents.inputEvents[scope](evData.value);

                            if (index < 0 || index + 1 > retVals.length || isNaN(index)) {
                                alert("WARNING - Can't process client event, Invalid index '" + index + "' for getvalue request. Enter return data index in the 'property' setting of the widget as an integer.");
                                retVals = [];
                                return false;
                            } else {
                                retVals[index] = val;
                            }
                        });

                        var source = evData.sysmeta.source.split("/")[1];

                        if (typeof widgets[source].defView.options.clientEvents.inputEvents["retvalue"] === "function") {
                            var result = widgets[source].defView.options.clientEvents.inputEvents["retvalue"](retVals);
                        } else {
                            alert("ERROR - Can't process client event, input events for 'retvalue' doesn't exist.")
                        }

                        retVals = [];

                        return result;
                    }
                }
            }

            eventQ.add(new event(server, channel, evData));
            return this.processQ();                                                                     // Process immediately as we may have an endSession event
        }
    };

    this.processQ = function () {
        if (!qPaused) {
            while (eventQ.getLen() > 0) {                                                               // Process all the entries backed up on the Q
                var event = eventQ.remove();

                var eventChannelKey = event.channel.toUpperCase().trim();

                var sourceFunc = event.data.sysmeta.source.trim().split("/");

                // If its from a database query, parse it into a less compressed format easier for widgets to handle. MAR20 - NOT BEING USED AT THE MOMENT, RECONSIDER ITS USE
                if (sourceFunc[1] === "db") {
                    event.data.value = processDataPacket(event);
                    if (typeof event.data.value === "undefined") {
                        Log.warn("Data received from channel '" + eventChannelKey + "' was tagged as a dataset but couldn't be parsed correctly, event won't be processed.");
                        continue;
                    }
                }

                // Handle wildcards - if there is an incoming message and the channel is an exact match or a wildcard match, get all the subscribing clients for those matches
                // NOTE - Incoming message will never be a wildcard, the subscriptions will have wildcards

                switch (sourceFunc[0].toUpperCase()) {
                    // Message is a server event (from the server), so its a server/input event
                    case "SERVER":
                        // Direct Routing, the widget destination is specified so its not a pub/sub message
                        if (event.data.sysmeta.destination) {
                            var matchingClients = [event.data.sysmeta.destination];
                        } else {
                            // Get widgets that subscribe to server channel.
                            var matchingClients = subscribingClients(eventChannelKey, "server", "input");
                        }
                        // If we don't have an exact or wildcard match, skip to the next message
                        if (matchingClients.length === 0) {
                            Log.info("Message channel '" + eventChannelKey + "' from '" + event.data.sysmeta.source + "' doesn't match any subscriptions, event wasn't processed.");
                            continue;
                        }

                        // Filter out widgets not on the screen.
                        matchingClients = matchingClients.filter((widget) => {
                            return widgets[widget].screen === selScreenName ? true : false;
                        });

                        matchingClients.forEach(function (client) {
                            // if widget is disabled due to load error. TODO: remove as if a widget fails it should not continue the app.
                            if (widgets[client].disabled) {
                                Log.warn("Widget '" + client + "' is disabled due to failed load, event aborted for this widget.");
                                return;
                            }

                            // If the widget hasnt loaded no defView will be available.
                            if (!widgets[client].defView) {
                                Log.warn("Widget '" + client + "' isn't ready to process events, event aborted for this widget.");
                                return;             // skip, go to next client
                            }

                            // if INI isn't specified as a widget function, try FEED instead
                            if (sourceFunc[1] === "ini") {
                                if (widgets[client].defView.options.serverEvents.inputEvents && !widgets[client].defView.options.serverEvents.inputEvents["INI"]) {
                                    sourceFunc[1] = "feed";
                                }
                            }

                            // Check to see if the widget function to accept the incoming message is available
                            if (!widgets[client].defView.options.serverEvents.inputEvents[sourceFunc[1]]) {
                                Log.warn("Event '" + event.data.value + "' with system metadata '" + event.data.sysmeta.source + "' can't be delivered to subscribing widget '" + client + "' due to incorrect routing sysmeta, event aborted.");
                                return;
                            }

                            if (!checkDataType(true, client, sourceFunc[1], null, event.data)) {
                                Log.warn("Can't handle request with datatype '" + sourceFunc[1] + "' for client '" + client + "' (" + widgets[client].type + ") with channel '" + eventChannelKey + "', sysmeta '" + event.data.sysmeta.source + "' usrmeta '" + event.data.usrmeta + "' data '" + event.data.value + "'");
                                return;
                            }

                            var svrInpEvtFuncs = widgets[client].events.serverEvents.inputEvents;

                            // Check all the server input events for the client
                            Object.keys(svrInpEvtFuncs).forEach(function (serverEvent) {
                                // Get the client event name where the channel registered for the client event name matches the event channel
                                if (checkRelevantChannel(eventChannelKey, svrInpEvtFuncs[serverEvent].channel)) {
                                    var evtFunction = svrInpEvtFuncs[serverEvent].event;
                                    // Is the incoming message of the type the widget is registered for (& let feed through if history is registered so feed doesn't need to be registered on widget if history is)
                                    if (sourceFunc[1].toUpperCase() === evtFunction.toUpperCase() || (sourceFunc[1].toUpperCase() === "FEED" && evtFunction.toUpperCase() === "HISTORY")) {
                                        // Deep clone the event data object as passing it in directly can lead to errors if the widget modifies it as var passes by reference and not value
                                        var dataClone = JSON.parse(JSON.stringify(event.data));
                                        dataClone.sysmeta.channel = eventChannelKey;

                                        if (typeof widgets[client].defView.options === "undefined") {
                                            debugger;
                                        }

                                        widgets[client].defView.options.serverEvents.inputEvents[sourceFunc[1]].function(eventChannelKey, client, dataClone);
                                        Log.info("Server message sent to subscribing widget '" + client + "' (" + widgets[client].type + ") with channel '" + eventChannelKey + "', sysmeta '" + event.data.sysmeta.source + "' usrmeta '" + event.data.usrmeta + "' data '" + event.data.value + "'");

                                        // else if it is a function that is not defined, assume it will use FEED
                                        // added 5/3/2021
                                    } else if ((evtFunction.toUpperCase() !== "INI" && evtFunction.toUpperCase() !== "HISTORY" && evtFunction.toUpperCase() !== "FEED") && sourceFunc[1].toUpperCase() === "FEED") {
                                        // Deep clone the event data object as passing it in directly can lead to errors if the widget modifies it as var passes by reference and not value
                                        var dataClone = JSON.parse(JSON.stringify(event.data));
                                        dataClone.sysmeta.channel = eventChannelKey;

                                        if (typeof widgets[client].defView.options === "undefined") {
                                            debugger;
                                        }
                                        
                                        // the event needs to be the same name as the client widget is expecting. Even though it is a feed event, it may be called a different name, ie radial has "inner circle" and "outer circle"
                                        widgets[client].defView.options.serverEvents.inputEvents[evtFunction].function(eventChannelKey, client, dataClone);
                                        Log.info("Server message sent to subscribing widget '" + client + "' (" + widgets[client].type + ") with channel '" + eventChannelKey + "', sysmeta '" + event.data.sysmeta.source + "' usrmeta '" + event.data.usrmeta + "' data '" + event.data.value + "'");
                                    }
                                }
                            });
                        });
                        break;

                    //Message is from a widget, going to either a local widget or the server
                    case "WIDGET":
                        var processedMsg = false;
                        var eventChannelSplit = eventChannelKey.split("/");

                        // The destination is the server (longer FQN)
                        if (eventChannelSplit.length === 4) {
                            var svrOutEvtFuncs;
                            if (widgets[sourceFunc[1]].type == "Scripting") {
                                // Allow scripts to publish without needing to define a server output event
                                var evt = {
                                    dummyEvent: {
                                        event: ""
                                    }
                                };
                                svrOutEvtFuncs = evt;
                            } else {
                                // Check that initiating widget has the right server output event (We don't use wildcards)
                                svrOutEvtFuncs = widgets[sourceFunc[1]].events.serverEvents.outputEvents;
                            }

                            Object.keys(svrOutEvtFuncs).forEach(function (clientEvent) {
                                var evtFunction = svrOutEvtFuncs[clientEvent].event;

                                if (typeof evtFunction !== "undefined" && evtFunction !== "none") {
                                    // We don't care what the event function type is, but something needs to be registered
                                    parent.publishSvr(parent.g.netName + "/" + event.channel, event.data);          // Send to the server
                                    // Send server message to local widgets that are also subscribed to the same channel as the message sent to server (as server won't echo back the message)
                                    //MAR20: TODO, won't currently work as the data check needs the label to be in the datapacket but its should be in sysmeta, and client widgets use sysmeta and server messages don't. Fix to be consistent.
                                    var newEventData = JSON.parse(JSON.stringify(event.data));
                                    newEventData.sysmeta.source = "server/feed";
                                    events.publish(true, event.channel, newEventData)

                                    Log.info("Sent message to server with namespace '" + eventChannelKey + "', sysmeta '" + event.data.sysmeta.source + "' usrmeta '" + event.data.usrmeta + "' data '" + event.data.value + "'");
                                    processedMsg = true;
                                } else {
                                    Log.warn("Widget '" + sourceFunc[1] + "' tried to send a message to channel '" + eventChannelKey + " but no server output subscription exists for the widget. Message ignored.");
                                }
                            });
                        } else {  // Local client event
                            // Check for Local subscription channel topics that match (no wildcards) and filter matching channels
                            var matchingClients = subscribingClients(eventChannelKey, "local", "input");

                            matchingClients.forEach(function (client) {

                                if (!widgets[client].defView && !widgets[client].defView.options) {
                                    Log.warn("Widget '" + client + "' isn't ready to process events, event aborted for this widget.");
                                    return;             // skip, go to next client
                                }

                                // Check to see if the widget function javaScript is present to accept the incoming message is available
                                if (!widgets[client].defView.options.clientEvents.inputEvents[eventChannelSplit[1].toLowerCase()]) {
                                    Log.warn(" Event '" + event.data.value + "' with system metadata '" + event.data.sysmeta.source + "' can't be delivered to subscribing widget '" + client + "' due to incorrect routing sysmeta, event aborted.");
                                    return;
                                }

                                // Get registered client input events
                                var localInpEvtFuncs = widgets[client].events.clientEvents.inputEvents;

                                if (client !== sourceFunc[1]) {                                                                                             // Don't echo (send) to the originating widget
                                    Object.keys(localInpEvtFuncs).forEach(function (clientEvent) {
                                        if (localInpEvtFuncs[clientEvent].channel.split("/")[0].toUpperCase() == eventChannelSplit[0]) {                    // Match the channels first
                                            if (localInpEvtFuncs[clientEvent].event.toUpperCase() === eventChannelSplit[1]) {                               // Is the message event matching the registered client event subscription for the function
                                                var dataClone = JSON.parse(JSON.stringify(event.data));
                                                dataClone.sysmeta.channel = eventChannelKey;
                                                widgets[client].defView.options.clientEvents.inputEvents[eventChannelSplit[1].toLowerCase()](dataClone, eventChannelKey.split("/")[0] + "/" + sourceFunc[1]);    // Call the relevant input function (using correct case)
                                                Log.warn("Sent message to widget '" + client + "' (" + widgets[client].type + ") with channel/scope '" + eventChannelKey + "', sysmeta '" + event.data.sysmeta.source + "' usrmeta '" + event.data.usrmeta + "' data '" + event.data.value + "'");
                                                processedMsg = true;
                                            }
                                        }
                                    });
                                }
                            });
                        }

                        if (!processedMsg) {
                            Log.info("Widget message received for channel '" + eventChannelKey + "' from '" + event.data.sysmeta.source + "' but nothing matched to process it.");
                        }
                        break;

                    default:
                        Log.warn("Message for channel '" + eventChannelKey + "' from '" + event.data.sysmeta.source + "' doesn't come from a valid source, should be SERVER or WIDGET.");
                        break;
                }
            }
        }
    }


    function updateChannelNamespace(channel) {
        // Check for global variables.
        var regex = /\[(.*?)\]/g;
        var matches = channel.match(regex);

        if (matches == null) return channel;

        var userData = JSON.parse(sessionStorage.getItem("user"));

        // Loop over variables found.
        for (var item of matches) {
            switch (item) {
                case "[accountid]":
                    channel = channel.replace("[accountid]", userData.accountid);
                    break;
                case "[username]":
                    channel = channel.replace("[username]", userData.username);
                    break;
            }
        }

        // Check account globals
        return channel;
    }

    /**
     * @description function that handles wildcards for calling a widget's correct subscribed function
     * @param fqn
     * @param evt
     */
    function checkRelevantChannel(fqn, evt) {
        fqn = fqn.trim().toUpperCase();
        evt = updateChannelNamespace(evt);
        evt = evt.trim().toUpperCase();

        var result = (fqn === evt);

        if (!result) {
            var newChannel = evt.split("/");
            var fqnSplit = fqn.split("/");

            while (newChannel.indexOf("+") !== -1) {
                var index = newChannel.indexOf("+");
                newChannel[index] = fqnSplit[index];
            }
            return fqn === newChannel.join("/");
        }

        return result;
    };

    /**
     * @description Get all the subscribing clients that exact or wildcard match channels
     * @param {string} channel      in FQN format
     * @param {bool} serverOrLocal  server or local client subscriptions
     * @param inputOrOutput         input or output subscriptions
     * @return {array}              All the matching subscribing clients
     */
    function subscribingClients(channel, serverOrLocal, inputOrOutput) {
        var matching = [];
        Object.keys(subscriptions).forEach(function (subChannel) {
            var subSplit = subChannel.split("/");
            var eventChSplit = channel.split("/");
            for (var i = 0; i < subSplit.length; i++) {                     // Match each part of the fqn unless subscription is +
                if (subSplit[i] !== eventChSplit[i] && subSplit[i] !== "+") {
                    break;
                }
            }
            if (i === subSplit.length) {                                    // We have a wildcard or exact match
                subscriptions[subChannel][serverOrLocal][inputOrOutput].forEach(function (item) {
                    if (matching.indexOf(item) == -1) {                     // client not previously added so add
                        matching.push(item);
                    }
                });
            }
        });
        return matching;
    }

    // Parse database packet received from server into a format more useable.
    function processDataPacket(eventMsg) {
        if (evtFunction === "db") {
            // Check packet structure first.
            if (!eventMsg.data.value.data || !eventMsg.data.value.pk || !eventMsg.data.value.headers) {
                // Invalid db packet.
                return;
            }

            // Process packet into datapackets (uncompress from network send)
            var headers = Object.keys(eventMsg.data.value.headers);
            var data = eventMsg.data.value.data;
            var dataKeys = Object.keys(data);
            var dataEntries = Object.entries(data);
            var numData = Object.keys(data).length;
            var newObj = {};

            // Rebuild packet
            for (var i = 0; i < numData; i++) {
                var entry = {};
                var currentRecord = dataEntries[i][1];
                // Loop through headers
                for (var h = 0; h < headers.length; h++) {
                    // Get header and value and add to record
                    var head = headers[h];
                    var val = currentRecord[h];
                    // add to entry
                    entry[head] = val;
                    // Add entry to new Obj by pk
                    newObj[dataKeys[i]] = entry;
                }
            }
            return newObj;
        }
    }

    /**
     * Check that the data is compatible with the widget receiving function.
     * @param server
     * @param widget
     * @param widgetFunc
     * @param evData
     */
    function checkDataType(server, widget, widgetFunc, dataType, evData) {
        //MAR20: NEED TO LOOK AT THE PACKET LABEL FOR THE FORMAT TYPE, NOT SYSMETA SOURCE/FUNC
        var eventDTObj = widgets[widget].defView.options.dataTypes;
        var testFunc;

        if (server) {
            testFunc = widgetFunc;
            var eventInpFunc = widgets[widget].defView.options.serverEvents.inputEvents
            
            if (!eventInpFunc[widgetFunc]) {
                // The widget doesn't have a function to handle this message type, ignore
                return false;                                          
            }
        } else {        // Client
            testFunc = dataType;
            var eventInpFunc = widgets[widget].defView.options.clientEvents.inputEvents
            
            if (!eventInpFunc[widgetFunc]) {
                // The widget doesn't have a function to handle this message type, ignore
                return false;                                           
            }
        }

        // Do we have a datatype for the event function? Ignore if not
        if (!eventDTObj[testFunc]) {                                        
            Log.info("Widget '" + widget + "' (" + widgets[widget].type + ") can't handle event request as function '" + widgetFunc + "' doesn't have any datatypes registered");
            return false;
        }

        if (evData.sysmeta.label === null || typeof evData.sysmeta.label === "undefined") {
            Log.info("Widget '" + widget + "' type not defined. Check that source packet label is defined.");
            return false;
        }

        // Is it in the supported list in options?
        if (eventDTObj[testFunc].indexOf(evData.sysmeta.label.toLowerCase()) === -1) {                       
            Log.info("Widget '" + widget + "' (" + widgets[widget].type + ") can't handle event request '" + widgetFunc + "' as event datatype '" + evData.sysmeta.label + "' isn't available.");
            return false;
        }
        return true;
    }

    /**
     * Check to see if we have valid request params. Doesn't check for alphanumerics as subscription channels can have +
     * @param server
     * @param channel
     */
    function validChannelScope(server, channel) {
        var chSplit = channel.split("/");

        if (typeof channel !== "string") {
            return false;
        }

        if (server) {

            if (chSplit.length !== 4) {
                return false;
            }

            if (chSplit[0].trim() === "" || chSplit[1].trim() === "" || chSplit[2].trim() === "" || chSplit[3].trim() === "") {
                return false;
            }

        } else {                        // Local channels are just a string

            if (!channel || channel.trim() === "") {                            // Does widget have valid channel?
                return false;
            }
        }

        return true;
    }
}

// Widget fire event, called from widget API
function fireEvent(widgetName, outEventName, data) {
    var wEvents = widgets[widgetName].events;
    
    // Process client events
    if (typeof wEvents.clientEvents === "object" && typeof wEvents.clientEvents.outputEvents === "object") {
        var events = wEvents.clientEvents.outputEvents;

        if (typeof events !== "undefined") {
            var eventKeys = Object.keys(events);
            for (var i = 0; i < eventKeys.length; i++) {
                if (events[eventKeys[i]].event === outEventName) {
                    
                    // Set statestore variable with channel name
                    var plabel;
                    if (Utils.isValidSensaCollection(data) === 0) {
                        plabel = "sensacollection"
                    } else if (Array.isArray(data)) {
                        plabel = "array"
                    } else if (Utils.isValidLabel(typeof data)) {
                        plabel = typeof data;
                    }

                    var packet = {
                        value: data,
                        sysmeta: {
                            label: plabel
                        }
                    };

                    appStateStore.set(events[eventKeys[i]].channel.split("/")[0].toUpperCase(), packet);
                }
            }
        }

    }

    widgetPubEvent(widgetName, outEventName, data) // params: widget source, output event name, optional data, optional usrmeta
}

/**
 * Main API interface for requests coming from widgets for framework services.
 *
 * @param {string} widgetName widget to run api function on.
 * @param {string} func API function to call (SETTOOLTIP... etc)
 * @param {string} param0 1st parameter
 * @param {string} param1 2nd...
 * @param {string} param2
 * @param {string} param3
 * @param {string} param4
 * @param {string} param5
 */
function widgetRequest(widgetName, func, param0, param1, param2, param3, param4, param5) {
    var widgetObj = document.getElementById(widgetName);

    switch (func.toUpperCase().trim()) {
        case "SENDXMLHTTPREQUEST":
            sendXmlHttpRequest(param0, param1, param2, param3);
        case "SETTOOLTIP":
            setTooltip(widgetName, param0);                    // Set string for tooltip. Send empty string to dispose of the tooltip
            break;
        case "SETPROPERTY":
            setWidgetProperty(param0, param1, param2);
            break;
        case "HIDETOOLTIP":
            hideGlobalDasbTT();
            globalTooltipHidden = true;    // Tooltip will not be shown until user mouses out of widget
            break;
        case "DISPLAY":                    // display or hide widget
            if (param0 === true) {
                widgetObj.style.setProperty("display", "inline");
            } else {
                widgetObj.style.setProperty("display", "none");
            }
            break;

        case "GETEVENTS":
            if (param0.toUpperCase() === "SERVEREVENTS") {
                var instEvents = {};
                if ("serverEvents" in widgets[widgetName].events) {
                    instEvents = JSON.parse(JSON.stringify(widgets[widgetName].events.serverEvents));
                    var optEvents = widgets[widgetName].defView.options.serverEvents;

                    Object.keys(optEvents.inputEvents).forEach(function (optEvent) {                                // Map missing attributes in the widget instance to the defaults in the option object
                        Object.keys(instEvents.inputEvents).forEach(function (instEvent) {
                            if (instEvents.inputEvents[instEvent].event === optEvent && optEvents.inputEvents[optEvent].attribs) {                                        // Match the instance & options event, are there default attribs
                                Object.keys(optEvents.inputEvents[optEvent].attribs).forEach(function (attrib) {
                                    if (!instEvents.inputEvents[instEvent].attribs) {
                                        instEvents.inputEvents[instEvent].attribs = {};                                                // No attribs collection, so create one for this session
                                    }
                                    if (!(attrib in instEvents.inputEvents[instEvent].attribs)) {                                                // No attrib in the instance but we have attribs in options, so set the default
                                        instEvents.inputEvents[instEvent].attribs[attrib] = optEvents.inputEvents[optEvent].attribs[attrib].default;
                                    }
                                });
                            }
                        });
                    });
                }
                return instEvents;
            }
            if (param0.toUpperCase() === "CLIENTEVENTS") {
                return widgets[widgetName].events.clientEvents;
            }
            break;

        case "GETATTRIB":
            return widgets[widgetName].attribs[param0];

        case "GETDISABLED":
            return widgets[widgetName].disabled;

        case "GETUSER":
            return parent.sess.user;

        case "GETWHITEBOX":
            return {
                title: parent.g.title,
                subtitle: parent.g.subtitle,
                wbicon: parent.g.wbIcon
            };
        case "DELETEDEVICECHANNELS":

            var distrib = param0;
            var model = param1;
            var serNo = param2;

            if (typeof distrib !== "string") {
                throw new TypeError("Distrib must be of type 'string'.");
            }

            if (typeof model !== "string") {
                throw new TypeError("Model must be of type 'string'.");
            }

            if (typeof serNo !== "string") {
                throw new TypeError("serNo must be of type 'string'.");
            }

            var ctid = Math.round(Math.random() * 32767);
            parent.publishSvr("$DEV/ADMIN/DEVICECHANNELS/DELETE", {
                "sysmeta": { "source": "widgets/" + widgetName, "label": "string", "ctid": ctid },
                "value": [distrib, model, serNo]
            });

            return ctid.toString();

        // param0: function, param1: distributor_name, param2: model_name, param3: columns_to_return, param4: where_clause, param5: data
        case "MODELSCMD":
            var ctid = Math.round(Math.random() * 32767);
            parent.publishSvr("$DEV/ADMIN/MODEL/REQUEST", {
                "sysmeta": { "source": "widgets/" + widgetName, "label": "string", "ctid": ctid },
                "usrmeta": { "func": param0, "distrib": param1, "model": param2, "cols": param3, "filter": param4 },
                "value": param5
            });
            return ctid.toString();

        // param0: distributor_array, param1: model_array, param2: status_array, param3: accounts_array, param4: application_array
        case "DEVICESNICKNAMES":
            var ctid = Math.round(Math.random() * 32767);
            parent.publishSvr("$DEV/ADMIN/GETNICKNAMES/REQUEST", {
                "sysmeta": { "source": "widgets/" + widgetName, "label": "string", "ctid": ctid },
                "usrmeta": { "distributors": param0, "models": param1, "status": param2, "accounts": param3, "applications": param4 },
                "value": null
            });

            return ctid.toString();

        // param0: function, param1: distributor_name, param2: model_name, param3: columns_to_return, param4: where_clause, param5: data
        case "DEVICESCMD":
            var ctid = Math.round(Math.random() * 32767);
            parent.publishSvr("$DEV/ADMIN/DEVICE/REQUEST", {
                "sysmeta": { "source": "widgets/" + widgetName, "label": "string", "ctid": ctid },
                "usrmeta": { "func": param0, "distrib": param1, "model": param2, "cols": param3, "filter": param4 },
                "value": param5
            });

            return ctid.toString();


        case "GETCHANNELS":
            var ctid = Math.round(Math.random() * 32767);
            parent.publishCmd("GETCHANNELS", parent.sess.user, { "source": "client/saveFlows", "ctid": ctid }, false);

            // add fw func pointer to fw_feed
            parent.returnChannelsFunc = [ctid, param0];
            return ctid;
        case "WATCHLOCATION":
        case "GETLOCATION":                                                                         // GPS location.
            if (navigator.geolocation) {
                var options = {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                };
                var myWidget = widgetName;
                var myCallback = param0;
                if (typeof myCallback !== "function") {
                    Log.warn("param0 is of type '" + typeof myCallback + "'. Expected type 'function'.");
                    return;
                }
                function success(pos) {
                    myCallback(pos);                               //  Pass in param0 the string name of the callback function in the widget
                }
                function navError(err) {
                    myCallback("ERROR(" + err.code + "): " + err.message + ")");
                }
                if (func.toUpperCase().trim() === "WATCHLOCATION") {
                    navigator.geolocation.watchPosition(success, navError, options);                    // callback called every time the position changes
                } else {
                    navigator.geolocation.getCurrentPosition(success, navError, options);               // callback called with current position
                }
            }
            break;

        case "GETBROWSER":
            return parent.g.browser;

        case "STARTTEXTBUT":
            document.getElementById("txtButtons").setAttribute("style", "display: inline-block; left:" + (parseInt(widgetObj.style.left)) + "px;top:" + (parseInt(widgetObj.style.top) - 30) + "px");
            break;

        case "ENDTEXTBUT":
            document.getElementById("txtButtons").setAttribute("style", "display: none");
            break;

        case "SETATTRIB":
            widgets[widgetName].attribs[param0] = param1;
            break;
        
        case "GETEVENTSMANAGER":
            return events;

        case "CHANGECHANNEL":
            if (widgets[widgetName].events.serverEvents.inputEvents) {
                var myEvent = Object.keys(widgets[widgetName].events.serverEvents.inputEvents)[parseInt(param1)];
                if (myEvent != undefined) {
                    var oldEvent = widgets[widgetName].events.serverEvents.inputEvents[myEvent];

                    if (oldEvent.channel != undefined) {
                        var splitCh = oldEvent.channel.split("/");

                        if (splitCh.length === 4) {
                            var newCh = "";
                            switch (param0.trim().toUpperCase()) {
                                case "SCOPE":
                                    newCh = splitCh[0] + "/" + splitCh[1] + "/" + splitCh[2] + "/" + param2.trim().toUpperCase();                 // Substitute new scope
                                    break;
                                case "INSTANCE":
                                    newCh = splitCh[0] + "/" + splitCh[1] + "/" + param2.trim().toUpperCase() + "/" + splitCh[3];                 // Substitute new instance
                                    break;
                            }

                            events.unsubscribe(oldEvent.channel, widgetName);             // case of multiple changes: if the subscription exists unsubscribe and the subscribe to the new channel

                            widgets[widgetName].events.serverEvents.inputEvents[myEvent] = newCh;

                            var newEvent = JSON.parse(JSON.stringify(oldEvent));
                            newEvent.channel = newCh

                            widgets[widgetName].events.serverEvents.inputEvents[myEvent] = newEvent;

                            events.subscribe(newCh, widgetName, true);              // Assume input channel

                        } else {
                            Log.info("Change channel " + param0 + " event for widget " + widgetName + " can't be handled as the channel '" + oldEvent.channel + "' does not have the correct namespace. No event processed.");
                        }
                    } else {
                        Log.info("Change channel " + param0 + " event for widget " + widgetName + " can't be handled as the widget has no server channels configured. No event processed.");
                    }
                }
            }
            break;

        case "LOADCM":
            importCodemirrorDeps(param0);
            break;

        case "SELECTCHANNELS":
            toggleToolbox("channelToolbox", "open");
            break;

        case "ALERT":
            return parent.alertModal(param0.text, param0.title, param0.options);

        case "CONFIRM":
            return parent.confirmModal(param0.text, param0.title, param0.options);

        case "PROMPT":
            return parent.promptModal(param0.text, param0.title, param0.options);

        case "TOGGLETOOLBOX":
            toggleToolbox(param0, param1);
            break;

        case "SETDIRTY":
        case "DIRTY":
            g.dirty = true;
            break;

        case "CLEARDIRTY":
            g.dirty = false;
            break;

        case "CHECKDIRTY":
            return g.dirty;
            break;

        case "SAVE":
            if (param0 == undefined) {
                param0 = false;
            }
            saveScreens(param0);
            break;

        case "JUMPSCREEN":
            if (!screens[param0]) {
                return;
            }
            hideGlobalDasbTT();
            selectedTab(param0);
            break;

        case "GETSCREENS":
            return screens;

        case "SETSCREENVISIBLE":
            var screen = document.getElementById("ScreenLi~" + param0);
            if (!param1) {
                screen.style.setProperty("display", "none");
            } else {
                screen.style.setProperty("display", "");
            }
            break;

        case "CLEARSTATESTORE":
            globalsStateStore.clearStateStore();
            return true;

        case "REMOVESTATE":
            return globalsStateStore.remove(param0.toUpperCase());

        case "SETSTATE":
            globalsStateStore.set(param0.toUpperCase(), param1, param2);
            break;

        case "GETSTATESTORE":
            return globalsStateStore;

        case "GETCLIENTPUBSUB":
            return appStateStore;

        case "PUBLISHCLIENT":
            appStateStore.publish(param0.toUpperCase(), param1, param2);
            break;

        case "SUBSCRIBESTATE":
            return globalsStateStore.subscribe(param0.toUpperCase(), param1);

        case "UNSUBSCRIBESTATE":
            globalsStateStore.unsubscribe(param0.toUpperCase(), param1);
            break;

        case "SUBSCRIBECLIENT":
            return appStateStore.subscribe(param0.toUpperCase(), param1);

        case "UNSUBSCRIBECLIENT":
            appStateStore.unsubscribe(param0.toUpperCase(), param1);
            break;

        case "GETCLIENTCHANNEL":
            return appStateStore.get(param0.toUpperCase());

        case "GETSTATE":
            return globalsStateStore.get(param0.toUpperCase());

        case "GETWIDGETS":
            return widgets;
            break;

        case "CHECKSYSPRIVS":
            return (parent.sess.permissions.indexOf(param0.toLowerCase()) !== -1);

        case "GETUSERPERMISSIONS":
            return parent.sess.permissions;

        case "PUBLISHSVR":
            var channel = param0;
            var value = param1;
            var label = param2;
            var usrmeta = param3;
            var sysmeta = param4;

            // Set label default if it is null
            if (typeof label === "undefined") {
                label = "number";
            }

            //  check input types.
            if (typeof channel !== "string" || typeof label !== "string" || typeof value !== "string") {
                throw new Error("Channel, label and value must be of type string.");
            }

            // Check sysMeta object is being used and correct structure.
            if (sysmeta && typeof sysmeta !== "object") {
                throw new Error("sysmeta should be of type 'object'");
            }

            if (sysmeta && typeof sysmeta.source !== "string") {
                throw new Error("sysmeta should contain key 'source' of type 'string'.");
            }

            // Check source in sysMeta is correct format.
            if (sysmeta && sysmeta.source.split("/").length !== 2) {
                throw new Error("sysmeta.source must be of the format 'widget/widgetName'.");
            }

            // Check that the channel is the correct structure
            if (channel.split("/").length !== 4) {
                throw new Error("Channel must contain category, class, instance, and scope separated by '/'");
            }

            // Check values.
            var packet = {};
            packet.sysmeta = sysmeta ? sysmeta : { source: "widget/" + widgetName };
            packet.sysmeta.label = label;
            packet.usrmeta = usrmeta ? usrmeta : {};
            packet.value = value;
            events.publish(true, param0, packet);
            break;

        case "GETEDITOR":
            return editor;

        //TODO: Not working
        case "STARTEDIT":
            editData = {};
            setEdit(widgetName, "force");
            break;

        case "DELWIDGET":
            if (g.design)
                delWidgetClick();
            break;

        case "ENDEDIT":
            resetEdit(widgetName, param0);
            break;

        case "ENDDRAG":
            if (dragData) {
                document.removeEventListener("mousemove", mouseMove, false);
                dragData.widgetObj.style.setProperty("z-index", dragData.zindex);                                       // Restore to old value
                resetCursor(dragData.widgetObj);                                                        // Dragging existing widget
                dragData = {};
            }
            break;

        case "NOTIFY":
            // Browser popup even if it isn't in focus (eg. for alarms). param0 = status type, param1 = message. ERRO, WARN, INFO
            parent.notify(param0, param1);
            break;

        case "ZINDEX":
            widgetObj.style.setProperty("z-index", param0);
            break;

        case "STATUS":
            statusBar.status({
                message: param0,
                important: param1
            });
            break;

        case "SERVERNAME":
            return parent.sess.serverName;

        case "SCRIPTINI":
            if (typeof param0 !== "function") {
                throw new TypeError("param0 must be a function, found " + typeof param0);
            }

            if (iniEvents.indexOf(widgetName) === -1) {
                iniEvents.push(widgetName);
                param0();
            }
            break;

        case "DIRECTORY": // Script widget needs to subscribe to $DIR/ADMIN/MANAGE/RESPONSE
            var ctid = Math.round(Math.random() * 32767);
            var dirType = param0;
            var dirFunc = param1;
            var dirTable = param2;
            var dirCol = param3;
            var dirRec = param4;
            var data = "";

            if (dirRec == undefined) {
                dirRec = "";
            }
            if (dirCol == undefined) {
                dirCol = "";
            }

            var instance = "";

            // Adding record
            if (typeof dirRec == "object") {
                instance = Object.keys(dirRec)[0];
            } else {
                instance = dirRec;
            }

            switch (dirFunc.toUpperCase()) {
                case "READRECS":
                    break;
                case "ADDUPDUSER":
                    dirRec = param4;
                    dirCol = "";
                    break;
                case "DELUSER":
                    break;
                case "DIRLIST":
                    parent.publishCmd("DIRECTORY", param2, { "source": "widgets/" + widgetName, "ctid": ctid }, {
                        "func": dirFunc.toUpperCase(),
                        "nodeName": widgetName,
                        "fqn": "USERAPI/" + dirFunc.toUpperCase(),
                        "columns": param2.columns.toString()
                    });

                    return ctid;
                    break;
            }

            parent.publishCmd("DIRECTORY", dirRec, { "source": "widgets/" + widgetName, "ctid": ctid }, {
                "func": dirFunc,
                "fqn": dirType + "/" + dirTable + "/" + instance + "/+",
                "nodeName": widgetName,
                "columns": dirCol
            });

            return ctid.toString();

        case "DBCMD":
            //param0: dbname, param1: tablename, param2: keyname (instance), param3: colfilter, param4: function, param5: value (update/create)
            parent.publishCmd("DBCMD", param5, { "source": "widgets/" + widgetName }, {
                "func": param0, // will this be needed?
                "fqn": param1 + "/" + param2 + "/" + param3 + "/+",
                //"scope": param3,
                "nodeName": widgetName,
                "columns": param3,
                "filter": param4,
                "dbTable": param2,
                "order": param5
            }, { "func": param4 });
            // don't even need to subscribe as this is only ever a create or update statement?
            events.subscribe(param0 + "/" + param1 + "/+/" + "RESPONSE", widgetName, true);
            break;

        //This interface used by Scripts
        case "DBCMD1":
            var ctid = Math.round(Math.random() * 32767);
            //param0: dbname, param1: tablename, param2: keyname (instance), param3: colfilter, param4: function, param5: value (update/create)
            parent.publishCmd("DBCMD1", param5, { "source": "widgets/" + widgetName, "ctid": ctid }, {
                "func": param0, // will this be needed?
                "fqn": param1 + "/" + param2 + "/" + param3 + "/+",
                //"scope": param3,
                "nodeName": widgetName,
                "columns": param3,
                "filter": param4,
                "dbName": param1,
                "dbTable": param2,
                "order": param5
            }, { "func": param4 });
            // don't even need to subscribe as this is only ever a create or update statement?
            //events.subscribe(param0 + "/" + param1 + "/+/" + "RESPONSE", widgetName, true);
            return ctid.toString();

        case "DBCMD2":
            //param0: dbname, param1: tablename, param2: keyname (instance), param3: colfilter, param4: function, param5: value (update/create)
            var ctid = Math.round(Math.random() * 32767);

            parent.publishCmd("DBCMD2", param5, { "source": "widgets/" + widgetName, "ctid": ctid }, {
                "func": param0, // will this be needed?
                "fqn": param1 + "/" + param2 + "/" + param3 + "/+",
                //"scope": param3,
                "nodeName": widgetName,
                "compoundTables": param3,
                "compoundValue": param4,
                "dbName": param1,
            }, { "func": param4 });
            // don't even need to subscribe as this is only ever a create or update statement?
            //events.subscribe(param0 + "/" + param1 + "/+/" + "RESPONSE", widgetName, true);
            return ctid.toString();

        case "S_HISTORY":                    // Return data from string columns (S_XXXX in influx)
        case "HISTORY":                        // Get history records for channel (param0). params: scope(1), func(2), from date(3), to date(4)
            //TODO: Should we be publishing the request object as data not usrmeta? Data is ""
            parent.publishCmd("HISTORY", "", { "source": "widgets/" + widgetName }, {
                "func": "HISTORY",
                "fqn": param0,
                //"scope": param1,    //TODO: Is scope used?
                "from": param2,
                "to": param3,
                "nodeName": widgetName
                //"result": null
            });
            break;

        case "SETPOSITION":
            var x = param0;
            var y = param1;
            widgetObj.style.setProperty("left", x);
            widgetObj.style.setProperty("top", y);
            break;

        case "GETTENANTS":
            var ctid = Math.round(Math.random() * 32767);

            parent.publishCmd("GETTENANTS", "", { "source": "widgets/" + widgetName, "ctid": ctid });
            return ctid.toString();

        case "GENERATESENSORTOKEN":
            parent.publishCmd("GENERATESENSORTOKEN", parent.g.netName.toUpperCase() + param0, { "source": "widgets/" + widgetName });
            break;

        case "SETWIDTH":
            var width = param0;
            widgetObj.style.setProperty("width", width);
            break;

        case "SETHEIGHT":
            var height = param0;
            widgetObj.style.setProperty("height", height);
            break;

        case "WINSCALE":
            return winScale;
            break;

        case "DASHBOARDOVERFLOW":
            switch (param0.toUpperCase()) {
                case "HIDDEN":
                case "SCROLL":
                case "AUTO":
                    widgetContainer.style.setProperty("overflow", param0.toLowerCase());
            }
            break;

        case "ADJUSTSIZE":
            // Adjust parent container for widgets that manage their own shape
            switch (param0.toUpperCase().trim()) {
                case "WIDTH":
                    widgetObj.style.setProperty("width", param1 + "px");
                    if (typeof editData !== "undefined" && editData != undefined && editData.dragHdls != undefined) {
                        editData.dragHdls.style.setProperty("width", param1 + "px");
                    }
                    break;
                case "HEIGHT":
                    widgetObj.style.setProperty("height", param1 + "px");
                    if (typeof editData !== "undefined" && editData != undefined && editData.dragHdls != undefined) {
                        editData.dragHdls.style.setProperty("height", param1 + "px");
                    }
                    break;
                case "TOPOFFSET":
                    widgetObj.style.setProperty("top", (parseInt(widgetObj.style.getPropertyValue("top")) + parseInt(param1)) + "px");
                    widgets[widgetName].locY = parseInt(widgetObj.style.getPropertyValue("top"));
                    break;
                case "LEFTOFFSET":
                    widgetObj.style.setProperty("left", (parseInt(widgetObj.style.getPropertyValue("left")) + parseInt(param1)) + "px");
                    widgets[widgetName].locX = parseInt(widgetObj.style.getPropertyValue("left"));
                    break;
                case "SCALEX":
                    widgets[widgetName].scaleX = +param1;
                    break;
                case "SCALEY":
                    widgets[widgetName].scaleY = +param1;
                    break;
                default:
            }
            break;

        case "STARTLINK":
            startNewLink(param0, widgetName, param1, param2, param3);
            break;

        case "ENDLINK":
            endNewLink(param0, widgetName, param1, param2, param3);                 // Node widgets use this funtion to create new links (end dragging)
            break;

        case "TOGGLESIDEBAR":
            // Check types
            if (typeof param0 !== "boolean") {
                throw new Error("Param0 must be boolean. True to close, false to open.");
            }

            if (param0 === true) {

                toggleSidebar("CLOSE", param1);
            } else {
                toggleSidebar("OPEN", param1);
            }
            break;

        case "SELECTTAB":
            selectedTab(param0, false);
            //JAN19 is this correct - firstload being true, should be false. Seems script is only one using....
            break;

        case "WRITECONSOLE":
            Log.info("Deprecated. Use the logger or statusbar.");
            break;

        case "GETDEVICE":
            return parent.sess.deviceType;

        // TODO: Is this needed or is the client statestore superceded this?
        case "SETGLOBAL":
            if (param0 >= globalVarSize) {                        // checking against a variable as arrays are dyncamically sized in javascript
                return false;
            } else {
                globalVars[param0] = param1;                        // param0 = location, param1 = value;
            }
            break;

        case "GETGLOBAL":
            if (param0 < globalVarSize) {
                return globalVars[param0];                        // param0 is the index from globalVars
            }
            break;

        case "CHANGEPASS":
            parent.publishCmd("CHANGEPWD", JSON.stringify({
                "user": param0,
                "oldPass": param1,
                "newPass": param2,
                "confirmPass": param3
            }), { "source": "client/security" });

        case "LOG":
            Log.info("Deprecated");
            break;

        //TODO: Is this still needed? Nothing is using it? ALso only active subscriptions would be the widgets on the active screen
        case "GETSUBSCRIPTION":
            var subArray = [];
            for (var widget in widgets) {
                if (widgets[widget]["events"] !== undefined && widgets[widget].events["clientEvents"] != undefined && widgets[widget].events.clientEvents["inputEvents"] !== undefined) {
                    for (var event in widgets[widget].events.clientEvents.inputEvents) {
                        if (widgets[widget].events.clientEvents.inputEvents[event].channel === param0 && widgets[widget].events.clientEvents.inputEvents[event].scope === param1)
                            subArray.push(widgets[widget].defView.options.clientEvents.inputEvents[param1]);
                    }
                }
            }
            return subArray;
            break;

        case "SERVERSUBSCRIBE":
            var ctid = Math.round(Math.random() * 32767);
            events.subscribe(param0, widgetName, true);
            return ctid.toString();              // Assume input channel
            break;

        case "UPDATEATTRIB":
            // param0 is attrib name, param 1 is attrib value
            if (param0 != undefined) {
                widgets[widgetName].attribs[param0] = param1;
            }
        case "ISSIDEBAROPEN":
            return sidebarIsOpen;

        case "INVOKEMODAL":
            // param0 = model type, param1 = title, param2 = main text, param3 = OK button text, param4 = modal context function, param5 = variable to return with callback
            var ctid = Math.round(Math.random() * 32767);
            param4.ctid = ctid.toString();                        // Add tx id

            parent.alertModal(param2, param1, { confirmText: param3 }).then(() => {
                if (typeof param4 === "function") {
                    try {
                        param4(param5);
                    } catch (err) {
                        Log.verbose(`An error occured running modal function.\n ${err.stack}`);
                    }
                }
            })

            return ctid.toString();

        case "CHECKBYTELENGTH":
            parent.checkByteLength(param0, param1, param2, param3, param4, param5);
            break;

        case "SAVEIMAGE":
            var ctid = Math.round(Math.random() * 32767);
            var data = param0;
            var sysmeta = param2;
            var usrmeta = param1;

            if (usrmeta == undefined || usrmeta.toString() !== "[object Object]") {
                usrmeta = {};
            }

            var time = new Date();
            if (usrmeta.fileName === undefined) {
                usrmeta.fileName = time.toISOString();
            }

            if (usrmeta.fileType == undefined) {
                usrmeta.fileType = "IMAGE";
            }

            if (usrmeta.location == undefined) {
                usrmeta.location = "USERFILES";
            }

            if (usrmeta.metadata == undefined ||
                usrmeta.metadata.toString() !== "[object Object]") {
                usrmeta.metadata = {};
            }

            // Need to override because we don't want people setting the
            // user by themselves.
            usrmeta.metadata.user = parent.sess.user.toUpperCase();
            // Time in Unix datetime format.
            usrmeta.metadata.time = Math.round(time.getTime() / 1000).toString();

            if (sysmeta === undefined) {
                sysmeta = { label: "string", source: "widget/" + widgetName, ctid: ctid };
            }

            parent.publishCmd("SAVEIMAGE", data, sysmeta, usrmeta);
            return ctid.toString();

        case "REMOVE_CHANNEL":
            if (typeof param0 !== "string") {
                throw new TypeError("param0 was of type '" + typeof param0 + "'. Expected type string");
            }

            parent.publishCmd("REMOVE_CHANNEL", param0);
            break;

        case "GETUSEROBJ":
            return JSON.parse(sessionStorage.getItem("user"));

        case "CURRENTSCREEN":
            return selScreenName;

        case "START_LOADING_SPINNER":
            if (!spinner || !(spinner instanceof HTMLElement)) {
                throw new Error("Unable to start loading spinner. Could not find spinner HTMLElement");
            }

            spinner.style.setProperty("visibility", "visible");
            break;

        case "STOP_LOADING_SPINNER":
            if (!spinner || !(spinner instanceof HTMLElement)) {
                throw new Error("Unable to start loading spinner. Could not find spinner HTMLElement");
            }

            spinner.style.setProperty("visibility", "hidden");
            break;

        case "GETCONNECTIONOS":
            var result = [
                'iPad Simulator',
                'iPhone Simulator',
                'iPod Simulator',
                'iPad',
                'iPhone',
                'iPod',
                'HP - UX',
                'Linux i686',
                'Linux armv7l',
                'Mac68K',
                'MacPPC',
                'MacIntel',
                'SunOS',
                'Win16',
                'Win32',
                'WinCE'
            ].includes(navigator.platform)
                // iPad on iOS 13 detection
                || (navigator.userAgent.includes("Mac") && "ontouchend" in document)

            if (navigator.platform === "Win32" || navigator.platform === "Win16" || navigator.platform.includes("Linux")) {
                result = false;
            }
            return result;
            break;

        case "TOGGLEHELP":
            parent.toggleHelpSidebar(param0);
            break;

        case "OPENHELP":
            parent.openHelpSidebar(param0);
            break;

        case "CLOSEHELP":
            parent.closeHelpSidebar();
            break;

        case "LOADHELP":
            parent.loadHelpSidebar(param0);
            break;

        default:
            Log.warn("Widget API request from '" + widgetName + "' can't be serviced as the API '" + func + "'does not exist.");
            return false;   // invalid function
    }
    return true;
}

// Return the sensahub input data types (null and undefined will also work)
function getDataType(value) {
    var type = typeof value;
    if (type === "object") {
        if (Array.isArray(value)) {
            type = "array";
        }
    } else if (type === "string") {
        if (!isNaN(parseFloat(value))) {
            type = "number";
        }
    }
    return type;
}

// Convert array values to uppercase for better error checking
function arrayUpper(arr) {
    var upperArr = [];
    for (var i in arr) {
        upperArr.push(arr[i].toUpperCase());
    }
    return upperArr;
}

// Convert keys to uppercase for better error checking
function keyUpper(obj) {
    var upperObj = {};
    Object.keys(obj).map(function (key, index) {
        upperObj[key.toUpperCase()] = obj[key];
    });
    return upperObj;
}

// Close a toolbox if open and visa versa or if option is specified (can't be in design.js due to settings editor)
function toggleToolbox(toolbox, option) {
    function Toolbox(div, name) {
        var toolbox = {};
        toolbox["div"] = div;
        toolbox["isOpen"] = function () {
            if (parseInt(this.div.style.getPropertyValue("left")) == 0) {
                return true;
            }
            return false;
        };
        toolbox["open"] = function () {
            this.div.style.setProperty("left", "0px");
        }
        toolbox["close"] = function () {
            this.div.style.setProperty("left", "-190px");
        }
        return toolbox;
    }

    if (toolboxLoaded !== "LOADED" && toolbox === "widgetToolboxDiv") {
        setTimeout(toggleToolbox, 100, toolbox, option);                                   // Time to load up
        if (toolboxLoaded === "LOADING") {
            return;
        }
        toolboxLoaded = "LOADING";
        createToolboxWidgets();
        return;
    }

    var widgetToolbox = Toolbox(document.getElementById("widgetToolboxDiv"));

    var settingsToolbox = Toolbox(document.getElementById("settingsToolboxDiv"));

    var otherToolbox = Toolbox(parent.document.getElementById("toolboxDiv"));
    otherToolbox.isOpen = function () {
        if (parseInt(this.div.style.getPropertyValue("left")) == 8) {
            return true;
        }
        return false;
    }

    var codeToolbox = Toolbox(document.getElementById("codeToolboxDiv"));
    codeToolbox.close = function () {
        this.div.style.setProperty("right", "-1410px");
    }
    codeToolbox.open = function () {
        this.div.style.setProperty("right", "0px");
    }

    var toolboxes = [widgetToolbox, settingsToolbox, otherToolbox, codeToolbox];

    toolboxes.forEach(function (tb) {
        if (tb.div.id !== toolbox) {
            tb.close();
            return;
        }
        (option === "close") ? tb.close() : tb.open();
    });

    switch (toolbox) {
        case "widgetToolboxDiv":
            if (option === "close") {
                changeSideScreenTools("screens");
            }
            widgetToolbox.div.style.setProperty("height", "100%");
            document.getElementById("filterTxt").focus();
            break;

        case "settingsToolboxDiv":
            if (option === "close") {
                changeSideScreenTools("screens");
                break;
            }
            changeSideScreenTools("widget");
            break;

        case "codeToolboxDiv":
            if (option === "close") {
                g.codeToolboxOpen = false;
                break;
            }
            var mode = parent.g.mode.toUpperCase();
            if (!settingsToolbox.isOpen() && (mode === "DESIGN" || mode === "FLOWS")) {
                settingsToolbox.open();
            };
            g.codeToolboxOpen = true;
            break;

        default:
            break;
    }
    if (option === "close" && toolbox !== "codeToolboxDiv") {
        searchToolbox("");
        document.getElementById("filterTxt").value = "";
        g.menuOpen = false;
    } else {
        g.menuOpen = true;
    }
}


// Modal needs to call this after backdrop has faded to ensure dashboard key handlers fire (called from index.html)
function getFocus() {
    window.focus();
}


// Callback for setting up new device from the welcome modal message
function newDevice(mode) {
    parent.adjustNavBar(mode);
}

// dynamically allocate a tooltip
function setTooltip(widgetName, text) {
    if (widgets[widgetName] !== undefined && text !== undefined) {
        widgets[widgetName].tooltip = text;
    }
    var widgetElem = document.getElementById(widgetName);
    var widgetBody = widgetElem.contentWindow.document.body;
    widgetBody.addEventListener("mouseenter", (event) => setTimeout(showGlobalDasbTT, 2000, event));
    widgetBody.addEventListener("mouseleave", hideGlobalDasbTT);
}


var lastGlobalTooltipToggle = 0;

function showGlobalDasbTT(event) {
    if (globalTooltipHidden) {
        // HIDETOOLTIP function was invoked. Do not show tooltip until user mouses out of the widget
        return;
    }
    let d = new Date();
    // Ensure at least 2s have passed before showing another tooltip
    // and that we are hovered on something
    if (d.getTime() - lastGlobalTooltipToggle < 2000 || event.view == undefined) {
        return;
    }
    lastGlobalTooltipToggle = d.getTime();
    var widgetElem = document.getElementById(event.view.name);
    var widgetContainer = document.getElementById("widgetContainer");

    if (!g.design) {
        // In Screens view
        if (widgets[event.view.name].tooltip === "" || widgets[event.view.name].tooltip == undefined) {
            // No tooltip given to widget, do not show tooltip
            return;
        }
        globalDashboardToolTipContent.innerHTML = widgets[event.view.name].tooltip;
    } else {
        // In Design view
        globalDashboardToolTipContent.innerHTML = event.view.name;
    }
    var right = false;
    var left = false;

    globalTooltip.classList.add("active");
    var widgetDimensions = widgetElem.getBoundingClientRect();
    // Centers the tooltip on the widget
    // Check whether tooltip should sit more to the left or right
    var leftPos = widgetDimensions.x + Math.floor(widgetDimensions.width / 2) - Math.floor(globalTooltip.clientWidth / 2);

    if ((leftPos + 2*globalTooltip.clientWidth) > (widgetContainer.offsetWidth)) {
        leftPos = widgetDimensions.x - Math.floor(globalTooltip.clientWidth / 2);
        left = true;
    } else if (leftPos < (widgetContainer.scrollLeft / 2)) {
        leftPos = widgetDimensions.x + widgetDimensions.width - Math.floor(globalTooltip.clientWidth / 2);
        right = true;
    }
    globalTooltip.style.left = `${leftPos}px`;
    // Check whether tooltip should sit above or below widget
    if ((widgetDimensions.y - 40 > 0) && 
        (widgetDimensions.y - 40) < widgetContainer.offsetHeight) {
        globalTooltip.style.top = (widgetDimensions.y - 40) + 'px';
        if (left) {
            globalTooltip.setAttribute('data-placement', 'left');
        } else if (right) {
            globalTooltip.setAttribute('data-placement', 'right');
        } else {
            globalTooltip.setAttribute('data-placement', 'top');
        }
    } else {
        globalTooltip.style.top = (widgetDimensions.y + widgetDimensions.height) + 'px';
        if (left) {
            globalTooltip.setAttribute('data-placement', 'bottom-start');
        } else if (right) {
            globalTooltip.setAttribute('data-placement', 'bottom-end');
        } else {
            globalTooltip.setAttribute('data-placement', 'bottom');
        }
    }
}

function hideGlobalDasbTT() {
    globalTooltip.classList.remove("active");
    globalTooltip.style.left = '-100px';
    globalTooltip.style.top = '-100px';
    let d = new Date();
    lastGlobalTooltipToggle = d.getTime();
    globalTooltipHidden = false;
}

// Sometimes non essential javascript can be slow to load especially first time
// NOTE: Tooltips must be hidden before their corresponding elements have been removed from the DOM.
// function initTT() {
// if (jQuery == undefined)
// setTimeout(loadTT, 50);
// }

// Called from parent when the window scaling has changed with zoom
function setWinScale(val) {
    winScale = 1 / val;
}

// API function object injected into widgets for interaction with framework (run by widget when loaded)
class widgetAPI {
    constructor(widgetName) {
        this.widgetName = widgetName;
        this.status = function (message) {(parent.statusBar.status(message))};
        this.widgetID = document.getElementById(widgetName).contentDocument.getElementById("widget");
        this.state = g.design ? "DESIGN" : "DASHBOARD";
        this.screenName = selScreenName;
        this.loaded = false;

        // Bind libraries
        let win = document.getElementById(widgetName).contentWindow;
        win["Log"] = new Logger(`WIDGETS/${widgetName}`);
        win["SensaCollection"] = SensaCollection;

        if (widgetName.indexOf("TB#") !== -1) {
            this.state = "TOOLBOX";
        } else {
            // can't have a disabled widget in the toolbox, so only do this when it is not a toolbox widget.
            this.disabled = widgets[this.widgetName].disabled;
        }
    }

    attribs(attrib) {
        // Widget designer is trying to access attribs to early in the widget (in toolbox).
        if (!(this.widgetName in widgets)) {
            // return attrib default.
            var defView = document.getElementById(this.widgetName).contentDocument.defaultView;
            var attribDefault = defView.options.attribs[attrib].default;
            return attribDefault;
        }
        if (attrib in widgets[this.widgetName].attribs) {
            return widgets[this.widgetName].attribs[attrib];
        } else {
            // DefView may have been deleted due to jumpToScreen script so defView needs to be checked
            if (typeof widgets[this.widgetName].defView == "undefined") {
                // Add defview back in.
                widgets[this.widgetName].defView = document.getElementById(this.widgetName).contentDocument.defaultView;
            }
            if (attrib in widgets[this.widgetName].defView.options.attribs) {
                return widgets[this.widgetName].defView.options.attribs[attrib].default;
            } else {
                return null;
            }
        }
    };

    func(funcName, param0, param1, param2, param3, param4, param5) {
        var funcRes = widgetRequest(this.widgetName, funcName, param0, param1, param2, param3, param4, param5);
        return funcRes;
    };

    async alert(message, title, options) {
        return  parent.alertHelp(message, title, options);
    }
    
    async confirm(message, title, options) {
        return  parent.confirmModal(message, title, options);
    }

    async prompt(message, title, options) {
        return parent.promptModal(message, title, options);
    }

    fireEvent(outEventName, data, usrmeta) {
        fireEvent(this.widgetName, outEventName, data, usrmeta)
    }

    // Tell framework that the widget is ready for the framework to handle. If a string is detected and error must of occured.
    ready(error) {
        if (typeof error === "string") {
            Log.verbose(`Widget '${this.widgetName}' flagged an error. Error: ${error}`);
            if (this.state !== "TOOLBOX") {
                badLoad(this.widgetName);
            } else {
                badTbLoad(this.widgetName);
            }
            return;
        }

        // Check if widget has already been loaded.
        if (this.loaded) {
            Log.verbose(`${this.widgetName} has already been loaded. Aborting widget load.`);
            return;
        }

        this.loaded = true;

        // Load framework functions of widget.
        widgetLoaded(this.widgetName);
    }
};
// Bind widget API to windows
window["widgetAPI"] = widgetAPI;

//#endregion