"use strict";
//For Debugging in Visual Studio, change start file URL to client.html?debug&wsport=80 in Debug wwwroot properties
//localStorage.clear(); // TESTING NEW CLIENT CASE - BUT DON'T FORGET TO COMMENT BACK OUT ELSE CLIENT GOES INTO A LOOP TRYING TO SET LOCALSTORAGE
const loginModal = document.getElementById("loginModal");
const changePasswordModal = document.getElementById("changePasswordModal");
const DialogModal = document.getElementById("messageModal");
const helpModal  = document.getElementById("helpModal");
const backdrop = document.getElementById("backdrop");
const iFrameBacklog = [];

document.getElementById("iFrame").src = "dashboard.html?mode=dashboard";
var statusBar = document.querySelector("status-bar");

const Log = new Logger("Client");
var imReady = false;   // Client is ready

g.componentsLoaded = true;
loginModal.onlogin = requestLogonWrapper;
changePasswordModal.onsubmit = changePasswordWrapper;
statusBar.defaultStatus = "Ready";

// flag when the iFrame is ready due to timing of message returning from server (script in head as rest of script not loaded yet). v2
var MQTT, sess = {
    clientName: null,                                                                                       // Get my name from server or local storage
    user: null,
    fullname: "",
    firstName: "",
    lastName: "",
    email: "",                                                                                        // TODO: boolean for logged on or not, should be username instead
    permissions: [],                                                                                        // Server returns what screens user can get to
    accountId: -1,                                                                                          // account for the user
    debugURL: "",                                                                                           // Used to specify a random number at end of URL to flush file cache
    protocol: location.protocol === "https:" ? "wss:" : "ws:",                                              // Get protocol type from URL
    port: location.port,                                                                                    // Use webserver port for websockets server unless overridden on URL
    serverName: document.domain,                                                                            // Use webserver servername for websockets server unless overridden on URL
    deviceType: null, // null by default                                                                    // The type of device being used, to determine screen size
    params: window.location.search.replace("?", "").split("&"),                                             // Options specified on the command line (search gets rid of any trailing #)
    RECONNECT_TIME: (2 + Math.random() * 5) * 1000,                                                         // Time before reconnecting in case of error (add random so if server fails avoids clients reconnecting same time)
    resetTimer: null,                                                                                       // Network restart / reset timer
    status: "DISCONNECTED"
};


if (sess.port === "") {
    sess.port = location.protocol === "https:" ? 443 : 80; // default port number if it is not explicitely specified in URL
}

for (var param = 0; param < sess.params.length; param++) {                                                  // parse the URL options (#0 is blank)
    var split = sess.params[param].split("=");
    switch (split[0].toUpperCase()) {                                                                       // command line options after URL '?'
        case "DEVICE":                                                                                      // Specify device desktop, tablet, phone
            switch (split[1].toUpperCase()) {
                case "DESKTOP":
                    sess.deviceType = "Desktop";
                    break;
                case "TABLET":
                    sess.deviceType = "Tablet";
                    break;
                case "PHONE":
                    sess.deviceType = "Phone";
                    break;
                default:
                    sess.deviceType = null;
            }
            document.getElementById("deviceSelect").innerText = sess.deviceType;
            break;
        case "CLEARLOCALSTORAGE":
            localStorage.clear();
            break;
        case "SERVER":
            sess.serverName = split[1];                                                                        // Name of websockets server to connect to if different to webserver
            break;
        case "DEBUG":
            sess.debugURL = "?" + Math.random();                                                               // Force cache reloading for debugging
            break;
        case "WSPORT":                                                                                          // Useful if network setup requires a different port to the HTTP one
            sess.port = parseInt(split[1]);
            break;
        case "LOCAL":
        default:
    }
}

// Browser detect
g.isOpera = (!!window.opr && !!window.opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;                  // Opera 8.0+
g.isFirefox = typeof InstallTrigger !== "undefined";                                                                        // Firefox 1.0+
g.isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
    return p.toString() === "[object SafariRemoteNotification]";
})(!window['safari'] || (typeof safari !== "undefined" && safari.pushNotification));
if (navigator.userAgent.toUpperCase().indexOf("SAFARI") !== -1 && navigator.userAgent.toUpperCase().indexOf("CHROME") === -1) {
    g.isSafari = true;
}
g.isIE = /*@cc_on!@*/false || !!document.documentMode;                                                                      // Internet Explorer 6-11
g.isEdge = !g.isIE && !!window.StyleMedia;                                                                                  // Edge 20+
g.isChromium = false || !!window.chrome;
g.isChrome = false || !!g.isChromium && window.navigator.vendor === "Google Inc.";
g.isBlink = (g.isChrome || g.isOpera) && !!window.CSS;                                                                      // Blink engine detection

if (g.isOpera)
    g.browser = "OPERA";
else if (g.isFirefox)
    g.browser = "FIREFOX";
else if (g.isSafari)
    g.browser = "SAFARI";
else if (g.isIE)
    g.browser = "IE";
else if (g.isEdge)
    g.browser = "EDGE";
else if (g.isChrome)
    g.browser = "CHROME";
else
    g.browser = "UNKNOWN";

if (g.isEdge) {
    alert("Sorry - Sensahub does not support older versions of Microsoft Edge browser. Please use the latest version of Edge (Chromium), Chrome, Internet Explorer or Firefox")
}

// Mobile detect
var designButton = document.getElementById("designButton");
var flowButton = document.getElementById("flowButton");
g.isMobile = false;
if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
    g.isMobile = true;
    designButton.style.setProperty("display", "none");                                                                          // Hide design from mobile devices.
    flowButton.style.setProperty("display", "none");
}

if (sess.deviceType === null) {                                                                                             // If not specified as a URL parameter
    sess.deviceType = g.isMobile ? "Phone" : "Desktop";                                                                     // Detect mobile, then we are a phone
    document.getElementById("deviceSelect").innerText = sess.deviceType;
}

// Get unique name from store or create it
sess.clientName = localStorage.getItem("clientNameV5.1");

if (!sess.clientName) {
    sess.clientName = sess.deviceType.substr(0, 1).toUpperCase() + g.browser.substr(0, 1) + Date.now();                     // UTC time in mSec to ensure no 2 devices clash
    localStorage.setItem("clientNameV5", sess.clientName);
}

/******************************************************************************
 *                  MARKDOWN
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
 var stateStore = new StateStore("markdown");
 stateStore.set("markdownDependencies", false);
 stateStore.set("highlight", false);
 stateStore.set("highlightStyle", false);
 stateStore.set("remarkable", false);
 stateStore.set("helpStylesheet", false);

// Data object for events
var evData = function (sysmeta, usrmeta, value) {
    this.sysmeta = sysmeta;
    this.usrmeta = usrmeta;
    this.value = value;
};

//TODO: suffix these with ID so that you know they are elements
var headerTitle = document.getElementById("headerTitle");
var dashButton = document.getElementById("dashButton");
var settingsButton = document.getElementById("settingsButton");
var appSettingsButton = document.getElementById("appSettingsButton");
var helpButton = document.getElementById("helpButton");
var iFrame = document.getElementById("iFrame");
var navButs = document.getElementsByClassName("nav-link");
var toolboxContents = document.getElementById("toolboxContents");
var accountDropdown = document.getElementById("accountDropdown");
var accountButton = document.getElementById("accountButton");
var deviceButton = document.getElementById("deviceButton");
var logBox = document.getElementById("logBox");
var logArea = document.getElementById("logArea");

g.rememberMeChecked = false;
g.initLoad = true;                                                                                          // Flag for the initial screen load
g.serverVer;                                                                                                // Build version from the server (in short RFC3999 yymmdd)
g.CLIENT_VER = "210519";                                                                                    // Client framework version (in short RFC3999 yymmdd)
g.AUTH_TIMEOUT = 10000                                                                                      // Timeout waiting for server to authenticate
g.logonTimer;                                                                                               // Pointer to timer for logon timeout
g.TOOLTIPDELAY = 1500;                                                                                      // Delay before showing tooltip when hovering
g.netName;                                                                                                  // Network scope name
g.mode = "Dashboard";                                                                                       // Must be upper case first letter same as mode button name
g.clientTypes;                                                                                              // Server sends list of the device types we support
g.modalFunction;                                                                                            // Object to track modal callback
g.toolboxParam;                                                                                             // toolbox parameter global for async functions to use
g.channels;                                                                                                 // Array of channels
g.iFrameReadyCnt = 0;
g.iFrameLoaded = false;
g.title = "Sensahub";                                                                                       // Title in the browser bar (modify for white boxing)
g.subtitle = "Sensavation";                                                                                 // Whitebox subtitle
g.wbIcon = "sensahub";                                                                                      // Whitebox icon
g.wbURL = "www.sensahub.com";
g.dashName;                                                                                                 // Group name of the dashboard
g.modalOpen = false;                                                                                        // Test if the modal is open
g.modalWaiting = false;                                                                                     // Flag if the modal is animating and we have to wait for the animation to end before changing modal
g.modalWaitCnt = 0;                                                                                         // Bootstrap modal states with animation aren't reliable with multiple calls before animation ends, so timer loop used as backup
g.startRest = false;                                                                                        // Flag to wait until all initialisation data has come from the server before switching screens
//g.restWaiting = 0;                                                                                          // Counter to wait for the rest of screens to come across
g.statusTimeout;                                                                                            // Pointer to timeout function for status message
g.currentStatusImportant = false;                                                                           // Flag if message is important
g.logsOpen = false;
g.passwordRules = {                                                                                         // Password rules
    minLength: 5,
    reqAlphaNum: false,
    reqUpperCase: false,
    reqSpecialChr: false
}
g.oldScreens = [
    { "mode": "DashDesign", "screen": null },
    { "mode": "Flows", "screen": null },
    { "mode": "Settings", "screen": null }
];                                                                                                          // Save the old screen to get back to

loginModal.remember = localStorage.getItem("user") !== null;                                                 // Keep state of remember me in the checkbox (for screen refresh)

var toolBoxItemSearchCat;                                                                                   // holds the state of the type of items being searched in the toolbox
var channelKeySelect;                                                                                       // holds the data-key of the channel item selected for flows

// For sliding the navbar when in mobile view
const slideDown = element => element.style.height = `${element.scrollHeight}px`;
const slideUp = element => element.style.height = '0px';
var defaultNavHeight = 0;

// For PWA support
//TODO: Needs to have the service worker registered for the correct subdomain name used. See https://stackoverflow.com/questions/35190711/using-service-workers-across-multiple-subdomains
if ("serviceWorker" in navigator) {
    // navigator.serviceWorker.register("/js/serviceworker.js");
}

// Network webworker
const netWorker = new Worker("js/mqtt.js");
netWorker.onmessage = function (e) {
    MQTTEvents(e.data);
}

handShake();
startNet(sess.protocol, sess.serverName, sess.port, "Connecting to server " + sess.serverName + "...");                                                        // Establish websockets connection
Log.verbose("Connecting to server " + sess.serverName + "...");

function postMessageToNetWorker() {
    netWorker.postMessage({ "func": "reconnect" });
}

function MQTTEvents(event) {
    clearTimeout(sess.resetTimer);
    sess.status = event.eventType;

    switch (event.eventType) {
        case "WSCONNECTED":                                                                                 // Client autoscribes to $SYS event when connecting
            Log.info("Network session established. " + event.eventType);
            statusBar.status({
                message: "Connected to server " + sess.serverName, 
                timeout: 0,
                important: true,
            });
            statusBar.defaultStatus = "Connected to server " + sess.serverName;
            headerTitle.innerHTML = "Logon";
            document.title = g.title + " - Logon Needed";
            showLogon(sess.status);                                                                                            // Connected, now logon
            clearTimeout(g.logonTimer);
            break;
        case "SESSION":
            Log.info("Logon session established. " + event.eventType);
            statusBar.status({ 
                message: "Session established. Waiting on configuration from server " + sess.serverName + "...", 
                timeout: 0
            });
            clearTimeout(g.logonTimer);
            loginModal.open = false;
            backdrop.enabled = false;
            break;
        case "MESSAGE":
            procPublish(event.data.topic, event.data.data, event.data.retain);
            break;
        case "STATUS":
            Log.info("Status message: " + event.data);
            statusBar.status({
                message: event.data
            });
            break;
        case "UNAUTHORIZED":
            Log.error("Bad user/password logon. " + event.data);
            disconNavbar("Invalid Username or Password.", "(no session)");               // adjust navbar for disconnected view
            showLogon(sess.status);
            alertModal("Please re-enter your username and password.", "Invalid Username or Password");
            clearTimeout(g.logonTimer);
            break;
        case "CLEARCACHE":
            if (localStorage.getItem("CACHE_VER") !== event.data) {                         // Only reset the client cache if the server build is new to us
                localStorage.setItem("CACHE_VER", event.data);
                reset(true);
            }
            break;
        case "CACHEEXPIRED":
            Log.info("Logon cache expired. " + event.data);
            sessionStorage.removeItem("user");                                                                                      // TEMPORARY UNTIL SESSIONS PERSISTED ON SERVER Ask users to log back
            localStorage.removeItem("user");                                                                                      // TEMPORARY UNTIL SESSIONS PERSISTED ON SERVER Ask users to log back
            disconNavbar("Logon session expired, please logon", "(no session)");        // adjust navbar for disconnected view
            clearTimeout(g.logonTimer);
            break;
        case "LOGOFF":
            Log.info("user " + sess.user + " logged out. ");
            disconNavbar("User '" + sess.user + "' logged out of server " + sess.serverName + ".", "(disconnected)");                               // adjust navbar for disconnected view
            clearTimeout(g.logonTimer);
            document.title = g.title + " - Logon Needed";
            showLogon(sess.status);                                                                                            // Connected, now logon
        case "RESET":
            Log.info("Session reset. " + event.data);
            disconNavbar("Can't communicate with server " + sess.serverName + " - session reset. Retrying...", "(disconnected)");    
            sess.resetTimer = setTimeout(postMessageToNetWorker, sess.RECONNECT_TIME);
            clearTimeout(g.logonTimer);
            break;
        case "MQTTREJECTED":
            Log.info("MQTT Session rejected. " + event.data);
            sess.resetTimer = setTimeout(startNet, sess.RECONNECT_TIME, sess.protocol, sess.serverName, sess.port);
            disconNavbar("Session rejected", "(no session)");                                                                                             // adjust navbar for disconnected view
            clearTimeout(g.logonTimer);
            break;
        case "WSERROR":
            sessionStorage.removeItem("user"); 
            Log.error(`WS Error:${event.data}`);                                                                                  // TEMPORARY UNTIL SESSIONS PERSISTED ON SERVER Ask users to log back
            sess.resetTimer = setTimeout(startNet, sess.RECONNECT_TIME, sess.protocol, sess.serverName, sess.port);
            disconNavbar(`Server (${sess.serverName}) connection lost. Reconnecting...`, "(disconnected)");                               // adjust navbar for disconnected view
            backdrop.enabled = true;
            clearTimeout(g.logonTimer);
            break;
        case "MQTTERROR":
            Log.error("MQTT error: " + event.data);
            sess.resetTimer = setTimeout(postMessageToNetWorker, sess.RECONNECT_TIME);
            disconNavbar("Can't connect to server " + sess.serverName + " due to protocol error. Retrying...", "(disconnected)");        // adjust navbar for disconnected view
            backdrop.enabled = true;
            loginModal.open = false;
            clearTimeout(g.logonTimer);
            break;
        case "CLOSE":
            if (!event.data) {
                event.data = "Normal close";
            }
            disconNavbar("Network closed - " + event.data, "(disconnected)");                                                                                              // adjust navbar for disconnected view
            sess.resetTimer = setTimeout(startNet, 0, sess.protocol, sess.serverName, sess.port);                                         // Not an error - reconnect immediately
            clearTimeout(g.logonTimer);
            break;
    }
}

statusBar.addEventListener("toggled", adjustModalBottomStyle);
statusBar.addEventListener("new_message", adjustModalBottomStyle);


function adjustModalBottomStyle(e) {
    let modals = document.querySelectorAll("[id$=Modal]");
    modals.forEach((modal) => {
        modal.bottom = statusBar.height;
    });
    backdrop.bottom = statusBar.height;
}

// Bootstrap doesn't close the nav menus, so we close them with lostfocus
function closeNavMenu(divId) {
    // console.log("Closing " + divId);
    var dropDownElem = document.getElementById(divId).childNodes[3];
    var navContent = document.getElementById("navbarSupportedContent");
    dropDownElem.classList.remove("nav-content-display");
}

function showDropDown(divId) {
    var dropDownElem = document.getElementById(divId).childNodes[3];
    if (window.innerWidth < 767 || sess.deviceType == "Mobile") {
        // Mobile view
        if (defaultNavHeight == 0) {
            defaultNavHeight = document.getElementById("navbarSupportedContent").offsetHeight;
        }
        var navContent = document.getElementById("navbarSupportedContent");

        if (dropDownElem.classList.contains("nav-content-display")) {
            navContent.style.height = `${defaultNavHeight}px`;
            dropDownElem.classList.remove("nav-content-display");
        } else {
            dropDownElem.classList.add("nav-content-display");
            // console.log(`${(navContent.offsetHeight + dropDownElem.offsetHeight)}px`);
            navContent.style.height = `${(defaultNavHeight + dropDownElem.offsetHeight)}px`;
        }
    } else {
        // Desktop view
        dropDownElem.classList.toggle("nav-content-display");
    }
}

function navBarToggle() {
    var navContent = document.getElementById("navbarSupportedContent");
    if (navContent.classList.contains("nav-content-display")) {

        slideUp(navContent);
        setTimeout(function () {
            navContent.classList.remove("nav-content-display");
        }, 300);
    } else {
        navContent.classList.add("nav-content-display");
        slideDown(navContent);
    }
}

window.addEventListener("resize", setWinScale);
window.addEventListener("load", winLoaded);
document.addEventListener("keydown", keydown);

function keydown(e) {
    if (e.keyCode === 27) {
        toggleToolbox("close");
        closeHelpSidebar();
    }
}

// If we have made changes, ask the user if they want to navigate away
window.addEventListener("beforeunload", function (e) {
    Log.verbose("Unloading client.");
    if (iFrame.contentDocument.defaultView.g) {
        var confirmationMessage;
        if (iFrame.contentDocument.defaultView.g.dirty) {
            confirmationMessage = "There are changes to your settings that are unsaved and will be discarded if you navigate away from this page.";
            e.returnValue = confirmationMessage;                                                            // Gecko, Trident, Chrome 34+
        }
        return confirmationMessage;
    }
    return null;
});

// Assume we have hit the browser refresh key, so setting up for resetting the dashboard on reload to work around IE/Edge reload issues. All 4 workarounds are needed
window.addEventListener("unload", function () {
    var widgetsDiv = iFrame.contentDocument.getElementById("widgetsDiv");                               // Workarounds for Edge/IE bug that loads widgets from before refresh pressed
    if (widgetsDiv) {
        widgetsDiv.parentNode.removeChild(widgetsDiv);
    }
    changeIframe("dashboard.html?mode=dashboard" + sess.debugURL);
    this.localStorage.setItem("SENSAHUB_RESET", Date.now().toString());                                 // Used to tell if we have pressed browser refresh, it will only be a couple of seconds until we read this in dashboard
});

// Reload to change devices
function changeDevice(devName) {
    let params = new URLSearchParams(window.location.search);
    if (params.has("device")) {
        params.set("device", devName);
    } else {
        params.append("device", devName);
    }

    window.location.search = params.toString();
}

/**
 * Server request for screens depending on mode
 * @param mode
 */
function getScreens(mode) {
    if (sess.user !== null) {
        //JAN19: change to using metadata instead of | when changing over to new security model
        publishCmd(mode, sess.deviceType.toUpperCase() + "|" + sess.user.toUpperCase(), { "source": "client/getscreens" });
    }
}


/**
 * Switch to different modes for the iframe.
 * @param frameSrc
 */
function changeIframe(frameSrc) {
    if (iFrame.src.toUpperCase().trim() !== frameSrc.toUpperCase().trim()) {
        g.iFrameLoaded = false;
        iFrame.setAttribute("src", frameSrc);                                                               // Design uses dashboard, reload it if not active
    }
}

// Stop backspace button from moving off the page
history.pushState(null, document.title, location.href);
window.addEventListener('popstate', function () {
    history.pushState(null, document.title, location.href);
});

/**
 * Any function that needs to be loaded after window is active
 * @param ev
 */
function winLoaded(ev) {
    Log.verbose("Client: I'm ready!");
}

/**
 * Set the window scaling for the browser and screen density.
 */
function setWinScale() {
    var ratio = window.devicePixelRatio;
    if (g.isChrome)
        ratio = window.outerWidth / window.innerWidth;
}

/**
 * Set the main screen as fullscreen (without navbar or status bar)
*/
function goFullScreen() {
    if (iFrame.requestFullscreen)
        iFrame.requestFullscreen();
    else if (iFrame.msRequestFullscreen)
        iFrame.msRequestFullscreen();
    else if (iFrame.mozRequestFullScreen)
        iFrame.mozRequestFullScreen();
    else if (iFrame.webkitRequestFullscreen)
        iFrame.webkitRequestFullscreen();
}

/**
 * Displays the correct modal at login.
 *
 * @param sessStatus Session status to check.
 */
function showLogon(sessStatus) {
    ///sess.user = null;
    var logonTitle = "Logon to Server";
    switch (sessStatus) {
        case "UNAUTHORIZED":
            logonTitle = "Sorry, logon failed, try again";
            sessionStorage.removeItem("user");          // Token incorrect, remove to force manual logon
            localStorage.removeItem("user");
            break;
        case "CACHEXPIRED":
            logonTitle = "Logon credentials required";
            sessionStorage.removeItem("user");          // Token expired, remove to force manual logon
            localStorage.removeItem("user");
            break;
        case "WSERROR":
            backdrop.enabled = true;                      // Network/server is down, can't display the logon yet
            return;
    }

    // If user is stored set the remember me flag
    var myUser = sessionStorage.getItem("user"); // Session vs local storage
    if (myUser === null) {
        myUser = localStorage.getItem("user");
    }

    if (myUser === null || myUser === "undefined" || myUser === "") {
        modalLogon(logonTitle, "Please enter username and password to logon", "Login", "logon");
    } else {
        var userObj = JSON.parse(myUser);
        if (typeof userObj.token !== "undefined") {
            userObj.sessionToken = userObj.token;
        }

        requestLogon(sess.clientName, "_" + userObj.username, userObj.sessionToken);
    }
}

function requestLogonWrapper(userDetails) {
    g.rememberMeChecked = userDetails.remember;
    loginModal.remember = g.rememberMeChecked;
    requestLogon(sess.clientName, userDetails.username, userDetails.password);
}

function changePasswordWrapper(passwordDetails) {
    publishCmd("CHANGEPWD", JSON.stringify({
        "user": sess.user,
        "oldPass": passwordDetails.oldPass,
        "newPass": passwordDetails.newPass,
        "confirmPass": passwordDetails.confirmPass
    }), { "source": "client/security" });
    changePasswordModal.open = false;
}


/**
 * Logon to server and setup logon timeouts
 * @param clientName device unique name used to identify the device.
 * @param username username to connect to MQTT server with.
 * @param password password to connect to MQTT server with.
 */
function requestLogon(clientName, username, password) {
    //MQTT.connect(clientName, username, password);                                    // Logon via cached credentials
    netWorker.postMessage({
        "func": "connect",
        "clientname": clientName,
        "username": username,
        "password": password
    });

    statusBar.status({
        message: "Waiting on server to authenticate logon request...",
        timeout: 0
    });
    clearTimeout(g.logonTimer);
    g.logonTimer = setTimeout(logonTimeout, g.AUTH_TIMEOUT);
}

/**
 * Server did not respond to logon request in time.
 */
function logonTimeout() {
    statusBar.status({
        message: "WARNING - Server did not respond to logon request, resetting browser to try again"
    });
    setTimeout(reset, 3000, true);                                                                           // Reset after a short pause for user to read status message
}


/**
 * Start websockets network.
 * @param protocol
 * @param serverName
 * @param port
 * @param msg
 */
function startNet(protocol, serverName, port, msg) {
    // Start the network and establish WS connection
    netWorker.postMessage({
        "func": "start",
        "protocol": protocol,
        "serverName": serverName,
        "port": port
    });

    if (typeof msg !== "undefined") {
        statusBar.status({
            message: msg,
            timeout: 0
        });
    }
}

//#region /////////////////////////////////////// Handle Server messages

var returnChannelsFunc; // Used to store callback function if channels api is used;

/**
 * Process publish messages received (topics in net/cat/class/instance/scope structure, data is JSON)
 * @param topic topic to publish to
 * @param data data to publish
 * @param retain retain flag. If the server should remember the last value.
 */
function procPublish(topic, data, retain) {
    var topicItems = topic.toUpperCase().split("/");
    var dataObj;

    Log.verbose("Server message topic " + topic + " data: " + data);

    if (topicItems.length !== 5) {
        Log.warn("WARNING - Invalid message received from Server (topic not formed correctly): " + topic);
        return false;
    }

    if (data !== "") {
        try {
            dataObj = JSON.parse(data);
        } catch (e) {
            if (data.substr(10, 1) === "T" && data.substr(data.length - 1) === "Z") {                           // RDC33339 formatted date
                dataObj = data;
            } else {
                Log.warn("WARNING - Invalid message received from Server (data not JSON or DATE): '" + data + "'");
                return false;
            }
        }
    } else {
        dataObj = "";
    }

    switch (topicItems[1]) {                                                        // Handle system messages
        case "$DIR":
            switch (topicItems[3]) {
                default:
                    sendToIframe(topicItems, dataObj, retain);
            }
            break;
        case "$SYS":
            switch (topicItems[2]) {
                case "WEBCLIENT":
                    switch (topicItems[4]) {
                        case "SECURITY":
                            if (dataObj.passwordExpired) {                                                                            // Logged in successfully, server returns authorisation data
                                changePasswordModal.change("Password Expired");
                            }
                            sess.user = dataObj.username;
                            sess.accountId = parseInt(dataObj.accountID);
                            dataObj.accountid = dataObj.accountID;
                            delete dataObj.accountID;
                            getScreens("STARTWIDGETS");
                            sess.firstName = dataObj.firstName;
                            sess.lastName = dataObj.lastName;
                            sess.fullname = `${sess.firstName.charAt(0)}. ${sess.lastName}`;

                            if (g.mode !== "Dashboard") {                                                                   // If I have disconnected and now connecting again NOTE - Dashboard text is case sensitive
                                iFrame.contentWindow.g.dirty = false;                                                       // Too bad, edits can't be saved safely
                                adjustNavBar("Dashboard");                                                                  // Always go back to dashboard
                            }
                            accountDropdown.innerText = sess.fullname;

                            sessionStorage.setItem("user", JSON.stringify(dataObj));

                            if (g.rememberMeChecked) {
                                localStorage.setItem("user", JSON.stringify(dataObj));                                 // Only store the token and user for autologin in the future (never permissions)
                            } else {
                                localStorage.removeItem("user");
                            }
                            // TODO permissions needs to be taken from new clientpermissions table
                            sess.permissions = dataObj.clientPermissions.map(function (e) { return e.toLowerCase() });            // Client deals with lowercase
                            var allPerms = ["dashboard", "design", "developer", "flows", "settings", "appsettings"];

                            for (var i = 0; i < allPerms.length; i++) {
                                if (sess.permissions[i] == '1') {
                                    sess.permissions[i] = allPerms[i];
                                } else {
                                    sess.permissions[i] = '';
                                }
                            }
                            // Hide hamburger.
                            if (sess.permissions.indexOf('design') === -1) {
                                // TODO these elements can no longer be accessed like this
                                // document.getElementById('logHamburger').style.setProperty("display", "none");
                                // document.getElementById('serverStatus').style.setProperty('padding', "0 0.6rem");
                            } else {
                                document.getElementById('deviceDropdown').style.setProperty("display", "");
                            }

                            enableOptions("block");

                            break;

                        case "CLEARCACHE":
                            reset(true);
                            break;

                        case "STARTNODES":                                                                                  // Server data needed to build initial screen (do as fast as possible)
                        case "STARTSETTINGS":                                                                               // Server data needed to build initial screen (do as fast as possible)
                        case "STARTWIDGETS":
                            //profiler("GotWidgetData");
                            startSess(topicItems, dataObj);
                            break;

                        case "ALERT":                                                                                       // Server can create alerts (eg. error messages)
                            alert("INFORMATION - Message from server: " + dataObj.text);
                            break;

                        case "NOTIFY":
                            notify("System", dataObj.text);
                            break;

                        case "WIDGETREST":                                                                                  // Rest of server data not critical to show initial dashboard
                        case "SETTINGSREST":                                                                                // Rest of server data not critical to show initial dashboard
                        case "APPSETTINGSREST":
                        case "NODEREST":                                                                                    // Rest of server data not critical to show initial dashboard
                            startRest(topicItems, dataObj);
                            break;

                        case "GETCHANNELS":
                            if (typeof returnChannelsFunc === "undefined") {                                                // Channels are dynamically added so get them when design mode is selected
                                g.channels = dataObj.value;
                            } else {
                                dataObj.sysmeta.ctid = "" + returnChannelsFunc[0];                                          // Check for ctid.

                                returnChannelsFunc[1]("API", "GETCHANNELS", dataObj);
                                returnChannelsFunc = undefined;
                            }
                            break;

                        case "CHANGEPASSRESPONSE":
                            if (!dataObj.usrmeta) {
                                changePasswordModal.change("Please try again.");
                            } else {
                                changePasswordModal.resolve();
                                alertModal("Password successfully updated.", "Password Changed");
                            }
                            break;

                        case "GETHELP":
                            var helpiFrame = document.getElementById("helpSidebariFrame");
                            helpiFrame.contentWindow.recvHost(topicItems, dataObj, retain);

                        default:
                            sendToIframe(topicItems, dataObj, retain);                                                      // Client doesn't know, check if the iframe knows about this topic
                    }
                    break;
                default:
                    sendToIframe(topicItems, dataObj, retain);
            }
            break;
        default:
            sendToIframe(topicItems, dataObj, retain);
    }
    return true;
}

/**
 * Enable the relevant navbar menu options.
 * @param displayState
 */
function enableOptions(displayState) {
    deviceButton.style.setProperty("display", displayState);
    helpButton.style.setProperty("display", displayState);
    accountButton.style.setProperty("display", displayState);

    // TODO each loop requires a repaint. [DD] Not sure as the dashboard dom isn't visible here
    if (sess.permissions && sess.permissions.length !== 0) {
        for (var option in sess.permissions) {
            if (sess.permissions.hasOwnProperty(option)) {
                switch (sess.permissions[option].toUpperCase()) {
                    case "DASHBOARD":
                        dashButton.style.setProperty("display", displayState);
                        break;
                    case "DESIGN":
                        designButton.style.setProperty("display", displayState);
                        break;
                    case "FLOWS":
                        flowButton.style.setProperty("display", displayState);
                        break;
                    case "SETTINGS":
                        settingsButton.style.setProperty("display", displayState);
                        break;
                    case "APPSETTINGS":
                        appSettingsButton.style.setProperty("display", displayState);
                        break;
                    default:
                }
            }
        }
    } else {
        if (sess.user !== null) {                                                   // null is unauthenticated user (password fail)
            alert("ERROR - Your account '" + sess.user + "' has been authenticated but does not have permissions setup, Dashboard permissions assumed. Please see your application administrator to set your account permissions correctly.")
            dashButton.style.setProperty("visibility", displayState);
        }
    }
}

/**
 * Shows and hides the logbox down the bottom.
 */
function toggleLogs() {
    if (g.logsOpen) {
        logBox.style.setProperty("display", "none");
    } else {
        logBox.style.setProperty("display", "");
        logArea.scrollTop = logArea.scrollHeight;
    }
    g.logsOpen = !g.logsOpen;
}

/**
 * Setup navigation bar to online and populate session parameters from server.
 * @param topicItems
 * @param dataObj
 */
function startSess(topicItems, dataObj) {
    // No dash assigned for user
    if (dataObj.value == null) {
        alert("No dashboard available for user '" + sess.user + "'. Please see your systems administrator to rectify");
        return;
    }

    g.netName = dataObj.value.netname.trim();
    g.dashName = dataObj.value.dashName;
    sendToIframe(topicItems, dataObj);                                                  // Pass screen and widget setup to dashboard

    g.title = dataObj.value.title;                                                      // White box info for displaying
    g.subtitle = dataObj.value.subtitle;
    g.wbIcon = dataObj.value.wbicon;
    g.wbURL = dataObj.value.wburl;
    document.getElementById("navBrand").href = g.wbURL;
    headerTitle.innerHTML = g.title;
    statusBar.subtitle = g.subtitle;
    document.title = g.title + " " + g.mode;
}

/**
 * Finish the startup initialisation with data from the server (runs after first screen displayed)
 * @param topicItems
 * @param dataObj
 */
function startRest(topicItems, dataObj) {
    g.categories = dataObj.value.categories;
    ///JAN19 TODO: client types not used but should be used to render the menu for the different devices in use (desktop, tablet, phone, print etc)
    g.clientTypes = dataObj.value.clientTypes;
    sendToIframe(topicItems, dataObj);                                                                  // Other data for the iframe to use
    g.startRest = true;
    g.serverVer = dataObj.value.buildVer;
    //g.restWaiting = 0;
    if (isURL(g.subtitle)) {                                                                        // Add a URL link if the subtitle is a URL
        var httpSub = g.subtitle.indexOf("http") === -1 ? "http://" + g.subtitle : g.subtitle
        statusBar.subtitle = "<a style='color:inherit' href='" + httpSub + "'  target='_blank'>" + g.subtitle + "</a>";
    }
}

function unloadIframeQueue() {
    // Unload queue and send to Dashboard.
    while (iFrameBacklog.length > 0) {
        let item = iFrameBacklog.shift();
        iFrame.contentWindow.recvHost(item.topic, item.data, item.ret);
    }
}

/**
 * Handle non-system messages to be processed by widgets.
 * @param topicItems
 * @param dataObj
 * @param retain
 */
function sendToIframe(topicItems, dataObj, retain) {
    // if iFrame is not loaded. Queue packets.
    let iframeObj = {
        topic: topicItems,
        data: dataObj,
        ret: retain
    }

    iFrameBacklog.push(iframeObj);
    if (g.iFrameLoaded) {
        unloadIframeQueue();
    }
}

/**
 * Reset navigation bar to offline.
 * @param msg message to be displayed on the status bar.
 * @param title Title of the document.
 */
function disconNavbar(msg, title) {
    document.title = g.title + " " + title;
    enableOptions("none");
    statusBar.defaultStatus = msg;
    statusBar.status({
        message: msg,
        timeout: 0,
        important: true
    });
}

/**
 * Unsubscribe to server in topic(s) format CATEGORY/CLASSNAME/INSTANCE/SCOPE with single or multiple topics.
 * @param topic topic to publish to (array of strings).
*/
function unsubscribeSvr(topicArr) {
    netWorker.postMessage({
        "func": "unsubscribe",
        "topicArr": topicArr
    });
}

/**
 * Subscribe to server in topic(s) format CATEGORY/CLASSNAME/INSTANCE/SCOPE with single or multiple topics.
 * @param topic topic to publish to (array of strings).
*/
function subscribeSvr(topicArr) {
    netWorker.postMessage({
        "func": "subscribe",
        "topicArr": topicArr
    });
}

/**
 * Send data to server in topic format CATEGORY/CLASSNAME/INSTANCE/SCOPE and in the evData object format. NOTE: Don't stringify data or meta before making this call else get JSON in JSON.
 * @param topic topic to publish to.
 * @param data data to publish to topic.
 */
function publishSvr(topic, data) {
    netWorker.postMessage({
        "func": "publish",
        "topic": topic,
        "payload": JSON.stringify(data)
    });
}

/**
 * Send a system request to the server.
 * @param func
 * @param data
 * @param sysmeta (object in format {source, channel, other})
 * @param usermeta
 */
function publishCmd(func, data, sysmeta, usrmeta) {
    publishSvr("$SYS/WEBCLIENT/" + sess.clientName.toUpperCase() + "/" + func, new evData(sysmeta, usrmeta, data));
}

//#region //////////////////////////////////////////////////////////// Manage Navbar

/**
 * Show 'Change Password' modal.
 */
function changePass() {
    changePasswordModal.title = "Enter your old and new password for user '" + sess.user + "'"
    changePasswordModal.open = true;
}

/**
 * User selects for changing user settings.
 */
async function userProfile() {
    await alertModal("Not implemented in this version of Sensahub.", "User Profile");
}

/**
 * Simulates browser refresh for wpa applications
 */
function refreshPage() {
    location.reload(true);
}

/**
 * Activate the main framework functions and adjust button visibility.
 * @param button
 */
async function adjustNavBar(button) {
    closeHelpSidebar();
    if (button !== g.mode) {                                                                                  // Don't adjust mode if the current mode is the button that is pressed
        toggleToolbox("close");                                                                                 // If open, close before changing screens
        if (!g.startRest) {
            statusBar.status({ message: "Please wait while the remaining screens are loading..." });
            return;
        }

        if (sess.user !== null) {
            if (iFrame.contentWindow.g.dirty === true) {
                let res = await confirmModal("Unsaved changes have not been saved and will be lost if you continue.<br/><br/><b>OK</b> to continue and lose changes, <b>cancel</b> to return to save changes.", "Unsaved Changes");
                if (res) {
                    iFrame.contentWindow.g.dirty = false;
                    adjustNavBar(button);
                };
            } else {
                for (var butNum = 0; butNum < navButs.length; butNum++) {
                    navButs[butNum].classList.remove("active");
                    navButs[butNum].classList.add("pointer");
                }
                enableOptions("block");

                if (g.mode === "Dashboard" || g.mode === "Settings") {
                    var unsub = iFrame.contentWindow.endWidgetSess("NAVCHANGE");// Switching away from the dashboard, call widget end sessions
                    iFrame.contentWindow.events?.svrUnsubList(unsub);   // Remove existing subscriptions. Events may not setup on new screen.
                }

                // Save the current screen to get back to
                if (typeof iFrame.contentDocument.defaultView.selScreenName !== "undefined") {
                    setOldScreen(iFrame.contentDocument.defaultView.selScreenName);
                }

                g.startRest = false;                                                                                // Make user wait if still loading screens (dashboard gets reloaded so we need to reinitialise)

                //TODO: Not secure to switch the modes for design and settings via the URL
                switch (button.toUpperCase()) {
                    case "DESIGN":
                        g.mode = "Design";
                        designButton.classList.add("active");
                        changeIframe("dashboard.html?mode=design" + sess.debugURL);
                        getScreens("STARTWIDGETS");
                        break;
                    case "FLOWS":
                        g.mode = "Flows";
                        flowButton.classList.add("active");
                        changeIframe("dashboard.html?mode=flows" + sess.debugURL);
                        getScreens("STARTNODES");
                        break;
                    case "DASHBOARD":
                        g.mode = "Dashboard";
                        changeIframe("dashboard.html?mode=dashboard" + sess.debugURL);
                        getScreens("STARTWIDGETS");
                        dashButton.classList.add("active");
                        break;
                    case "SETTINGS":
                        g.mode = "Settings";
                        changeIframe("dashboard.html?mode=dashboard" + sess.debugURL);
                        getScreens("STARTSETTINGS");
                        settingsButton.classList.add("active");
                        break;
                    case "APP SETTINGS":
                        g.mode = "App Settings";
                        changeIframe("dashboard.html?mode=dashboard" + sess.debugURL);
                        getScreens("STARTAPPSETTINGS");
                        appSettingsButton.classList.add("active");
                        break;
                    case "LOGOUT":                                  // Logout menu option selected
                        statusBar.status({
                            message: "Logged user '" + sess.user + "' out.",
                            important: true
                        });

                        localStorage.removeItem("user");
                        sessionStorage.removeItem("user");
                        sess.permissions = null;
                        sess.user = null;
                        netWorker.postMessage({ "func": "close" });                                                               // Tell server I'm logging out to cleanup my session
                        setTimeout(reset, 50, false);                                                                                  // Reset after a short pause for server to close session
                        break;
                }
                statusBar.defaultStatus = `${button} Mode`;
            }
        }
    }
}

/**
 * Gets the old screen object when switching modes (called by dashboard.html)
 */
function getOldScreenName() {
    var oldScreen;
    switch (parent.g.mode) {
        case "Dashboard":
        case "Design":
            oldScreen = parent.g.oldScreens[0].screen;
            break;
        case "Flows":
            oldScreen = parent.g.oldScreens[1].screen;
            break;
        case "Settings":
            oldScreen = parent.g.oldScreens[2].screen;
            break;
    }
    return oldScreen;
}

/**
 * Sets the old screen object when switching modes. (also called by dashboard.html)
 */
function setOldScreen(screen) {
    if (g.mode === "Dashboard" || g.mode === "Design") {
        g.mode = "DashDesign";
    }
    for (var i = 0; i < g.oldScreens.length; i++) {
        if (g.oldScreens[i].mode === g.mode) {                                                      // Only set the current mode in the oldscreens array
            g.oldScreens[i].screen = screen;
        }
    }
}

/**
 * Function called to print the current dashboard (the current iFrame contents).
 * Strips menu bars and makes iFrame full screen.
 */
async function printDashboard() {
    if (iFrame.contentWindow.g.design && (iFrame.contentWindow.g.design && !iFrame.contentWindow.g.flowEditor)) {
        await alertModal("You can only print the dashboard or flow editor.<br /><br />Please exit design and try again.", "Print Failed");
    }
    // close the toolboxes and sidebars
    toggleToolbox("close");
    iFrame.contentWindow.toggleSidebar("CLOSE");
    iFrame.style.left = "0";
    iFrame.style.top = "0";
    iFrame.style.right = "0";
    iFrame.style.bottom = "0";
    iFrame.contentDocument.getElementById("sidebarGrp").style.display = "none";

    var currentScreen = iFrame.contentWindow;
    currentScreen.print();

    iFrame.style.top = "57px";
    iFrame.style.left = "8px";
    iFrame.style.right = "3px";
    iFrame.style.bottom = "38px";
    iFrame.contentDocument.getElementById("sidebarGrp").style.display = "inline";
    iFrame.contentWindow.toggleSidebar();
}

/**
 * Returns a basic modal to screen that has the core details of the sensahub version.
 */
async function aboutSensahub() {
    var message = "<div><pre>Client Name: " + sess.clientName + "<br/>" +
        "<b>Versions:</b><br/>" +
        "   Dashboard: " + g.CLIENT_VER + "<br/>" +
        "   Server: " + g.serverVer + "<br/>" +
        "   Browser: " + g.browser + "<br/>" +
        "   Agent: <div style='white-space: pre-wrap; word-break:break-all'>" + navigator.userAgent + "</div></pre></div>" +
        "&#169; Sensavation " + (new Date()).getFullYear() + "<br /><br />" +
        "For more information and contact information, visit <a href='http://www.sensahub.com/'>Sensahub.com</a>";
    await alertModal(message, "About Sensahub");
}

/**
 * Reset the session with a page reload or reload the cache of index.html by reloading with a different query string.
 * @param reloadCache
 */
function reset(reloadCache) {
    if (reloadCache) {
        statusBar.status({
            message: "Resetting browser cache for new Sensahub version..."
        });

        var cache_ver = localStorage.getItem("CACHE_VER");
        if (cache_ver !== "") {
            sess.debugURL = "?" + Math.random();
        } else {
            sess.debugURL = "?" + localStorage.getItem("CACHE_VER");
        }
        window.location.replace(window.location.protocol + "//" + window.location.host + window.location.pathname + sess.debugURL + "&" + window.location.search.replace("?", ""));
    } else {
        window.location.replace(window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.search);
    }
    //window.reload(true);
}

//#region //////////////////////////////////// Modals

// Logon prompts
function modalLogon(title, text, button, callback, param) {
    // Close current modal if one is open.
    backdrop.enabled = false;
    if (loginModal.open === true) return;
    loginModal.open = true;
    loginModal.title = title;
}

// General message (OK and cancel)
/**
 * Shows an alert modal with a callback.
 * @param {string} title - The title of the modal.
 * @param {string} text - Text to go into the body of the modal.
 * @param {function} callback - Callback function to run when the confirm button is pressed.
 * @param {any} params - Parameters to pass to the callback function.
 */
function modalMessage(text, title, confirmText, callback, param) {
    DialogModal.title = title || "Alert!";
    DialogModal.message = text || "";
    DialogModal.confirmText = confirmText || "OK";
    DialogModal.onsubmit = callback || null;
    DialogModal.params = param || null;
    DialogModal.open = true;
}

/**
 * Displays a help modal
 * @param {string} text - Text to display in the body of the modal.
 * @param {string} title - Title to display at the top of the modal.
 * @param {string} confirmText - Text to display in the submit button.
 */
function modalHelp(text, title, confirmText) {
    document.addEventListener('keyup', (e) => {
        if (e.code == "Escape") {
            e.preventDefault();
            e.stopPropagation();
            helpModal.open = false;
        }
    });

    helpModal.title = title || "Widget Help";
    helpModal.message = text || "";
    helpModal.confirmText = confirmText || "Close";
    helpModal.open = true;
}

/**
 * Displays a alert modal
 * 
 * @param {string} text - Text to display in the body of the modal.
 * @param {string} title - Title to display at the top of the modal.
 * @param {object} options
 * @param {string} options.confirmText - Text to display in the submit button.
 * @param {string} options.cancelText - Text to display in the cancel button.
 *  
 * @returns {Promise} Returns a Promise containing the value from the user.
 */
async function alertModal(text, title, options) {
    return DialogModal.alert(text, title, options);
}


/**
 * Displays a confirm modal
 * 
 * @param {string} text - Text to display in the body of the modal.
 * @param {string} title - Title to display at the top of the modal.
 * @param {object} options
 * @param {string} options.confirmText - Text to display in the submit button.
 * @param {string} options.cancelText - Text to display in the cancel button.
 *  
 * @returns {Promise} Returns a Promise containing the value from the user.
 */
async function confirmModal(text, title, options) {
    return DialogModal.confirm(text, title, options);
}

/**
 * Displays a prompt modal
 * 
 * @param {string} text - Text to display in the body of the modal.
 * @param {string} title - Title to display at the top of the modal.
 * @param {object} options
 * @param {string} options.confirmText - Text to display in the submit button.
 * @param {string} options.label - sets the input label.
 * @param {string} options.placeholder - sets the prompt input placeholder text.
 * @param {string} options.type - sets the prompt input type.
 * @param {boolean} options.required - sets the the input to required. Defaults to false.
 *  
 * @returns {Promise} Returns a Promise containing the value from the user.
 */
async function promptModal(text, title, options) {
    return DialogModal.prompt(text, title, options);
}


//#region //////////////////////////////////// Parent Toolbox

var toolboxTitle = document.getElementById("toolboxTitle");
var toolboxDiv = document.getElementById("toolboxDiv");

function selectMenuItem(t) {
    var item = iFrame.contentDocument.getElementById("widgetNameDiv");
    var name = item.querySelector("input").value;
    var type = iFrame.contentWindow.widgets[name].defView.options.settings.category;
    toolItemSel(t, type);
}

// Item in the toolbox selected
function toolItemSel(event, widgetType, dataKey) {
    if (iFrame.contentWindow.editData === {}) {
        if (typeof widgetType === "undefined") {
            widgetType = iFrame.contentWindow.editData.defView.options.settings.category;
        }
    }
    iFrame.contentWindow.toolboxCallback(toolboxTitle.innerText, event.id.substr(2), widgetType, dataKey);                // pass to iframe callback, strip out leading TB from item id
}

// Close the toolbox if open and visa versa
function toggleToolbox(option) {
    toolboxDiv.style.setProperty("bottom", "38.5px");
    if (toolboxDiv.style.getPropertyValue("left") <= "8px" || option === "close") {                 // close toolbox if open
        toolboxDiv.style.setProperty("left", "-190px");
        document.getElementById("toolboxFilter").value = "";
    } else {
        toolboxDiv.style.setProperty("left", "8px");
    }
}

function checkCustomChannel() {
    if (!document.getElementById("customChannel").validity.valid) {
        alert("WARNING - Input isn't valid - " + document.getElementById("customChannel").value);
        setTimeout(function () { document.getElementById("customChannel").focus() }, 20);
    }
}

// Load the toolbox with system level items
function loadToolbox(items, filter, param, widgetType, dataKey) {
    if (param !== undefined) g.toolboxParam = param;
    // Save global for callbacks to use
    var docFrag = document.createDocumentFragment();                                                                                        // load icons into icon toolbox
    if (items === "")
        items = toolboxTitle.innerText.toLowerCase();

    var noneBtn = document.getElementById('TBNone');

    var itemElement;
    var title;
    var categories = [];
    switch (items) {
        case "icons":
            //TODO: Drag icons onto the design surface (can do with SVG icons)
            if (toolboxTitle !== "Icons") {                                                                                                             // Don't reload if loaded
                toolboxContents.innerHTML = "";
                toolboxTitle.innerText = "Icons";
                noneBtn.style.display = "none";
                for (var i = 0; i < material_icons.length; i++) {
                    if (material_icons[i].toUpperCase().indexOf(filter.toUpperCase()) !== -1 || filter === "") {
                        itemElement = document.createElement("div");
                        itemElement.style.cursor = "pointer";
                        itemElement.id = "TB" + material_icons[i];
                        itemElement.style.pointer = "none";
                        itemElement.setAttribute("onclick", "toolItemSel(this)");
                        itemElement.innerHTML = "<i style='cursor: pointer' class='material-icons md-48'>" + material_icons[i] + "</i>";
                        title = document.createElement("p");
                        title.innerHTML = "<span style='text-transform:capitalize;'>" + material_icons[i].replace(/_/g, " ") + "</span><br/><br/>";
                        itemElement.appendChild(title);
                        docFrag.appendChild(itemElement);
                    }
                }
            }
            break;

        case "channels":
            if (toolboxTitle !== "Channels") {                                                                                                             // Don't reload if loaded
                var outerContainer = document.createElement("div");
                outerContainer.className = "toolBoxContainer";

                // sort the channels alphabetically
                var sortedChannels = g.channels.sort(function (a, b) {
                    var fqn1 = a.category.toLowerCase() + a.className.toLowerCase() + a.instance.toLowerCase();
                    var fqn2 = b.category.toLowerCase() + b.className.toLowerCase() + b.instance.toLowerCase();

                    if (typeof a.scope !== "undefined") fqn1 += a.scope;
                    if (typeof b.scope !== "undefined") fqn2 += b.scope;

                    if (fqn1 < fqn2) return -1;
                    if (fqn2 < fqn1) return 1;
                    return 0;
                });
                sortedChannels.forEach(function (item) {
                    if ((categories.indexOf(item.category)) === -1) {
                        categories.push(item.category);

                        var d = document.createElement("div");
                        d.className = "categoryGroup";

                        var ct = document.createElement("div");
                        ct.className = "categoryTitle";
                        ct.innerHTML = capitalise(item.category) + "<span class='categoryTitle' id='toggle" + item.category + "'>&#9650;</span>";

                        var catItems = document.createElement("div");
                        catItems.id = "cat-" + item.category;

                        d.appendChild(ct);
                        d.appendChild(catItems);

                        outerContainer.appendChild(d);
                    }
                });

                docFrag.appendChild(outerContainer);

                toolboxContents.innerHTML = "";
                toolboxTitle.innerText = "Channels";
                noneBtn.style.display = "block";
                for (var num in g.channels) {
                    if (g.channels.hasOwnProperty(num)) {
                        var testFilter = (g.channels[num].category + g.channels[num].className + g.channels[num].instance + g.channels[num].instance + g.channels[num].scope).toUpperCase();
                        if (testFilter.indexOf(filter.toUpperCase()) !== -1 || filter === "") {
                            itemElement = document.createElement("div");
                            var sc = "";
                            if (typeof g.channels[num].scope !== "undefined") {
                                sc = "/" + g.channels[num].scope;
                            }
                            itemElement.setAttribute("id",
                                "TB" +
                                g.channels[num].category +
                                "/" +
                                g.channels[num].className +
                                "/" +
                                g.channels[num].instance +
                                sc); // does the check for existence of a scope
                            itemElement.style.cursor = "pointer";
                            itemElement.style.pointer = "none";
                            itemElement.setAttribute("data-placement", "top");
                            itemElement.setAttribute("data-toggle", "tooltip");
                            itemElement.setAttribute("data-original-title", "" + g.channels[num].desc + "");
                            itemElement.setAttribute("onclick", "toolItemSel(this, " + "\"" + widgetType + "\"," + "\"" + dataKey + "\")");
                            parent.channelKeySelect = dataKey;
                            title = document.createElement("p");
                            title.innerHTML = "<span class='tip wordwrap' >" +
                                g.channels[num].className.toLowerCase() +
                                "<br/>" +
                                g.channels[num].instance.toLowerCase();
                            if (typeof g.channels[num].scope !== "undefined") {
                                title.innerHTML += " (" + g.channels[num].scope.toLowerCase() + ")</span>";
                            } else {
                                title.innerHTML += "</span>";
                            }

                            var channelIcon;
                            var iconSet = g.channels[num].icon;

                            // if we have hardcoded a channel icon
                            if (typeof iconSet !== "undefined" && iconSet !== "" && iconSet !== null) {
                                channelIcon = iconSet;
                            } else {
                                // break this down into steps as this is source of the icon bug
                                // converts the categories into a list in uppercase
                                var mapLoc = g.categories.map(function (e) {
                                    return e.name.toUpperCase();
                                });
                                // gets the index of our current channel's category
                                var reqIndex = mapLoc.indexOf(g.channels[num].category.toUpperCase());
                                // assigns default icon OR the found icon
                                channelIcon = (reqIndex === -1) ? "swap_calls" : g.categories[reqIndex].icon;
                            }

                            // this is the arrow to the left of the main icon
                            var ioIcon;
                            switch (g.channels[num].io) { // select icon to represent channel direction
                                case "input":
                                    ioIcon = "&#8595;";
                                    break;
                                case "output":
                                    ioIcon = "&#8593;";
                                    break;
                                case "inputoutput":
                                    ioIcon = "&#8597;";
                                    break;
                                //case "virtual":
                                //    ioIcon = "&fnof;";
                                default:
                                    ioIcon = "&#8597;";
                            }

                            var setupEl =
                                "<ul class='list-inline text-left'style='padding-left: 25px;'>" +
                                "<li class='list-inline-item  align-middle tip' style='font-size: 36px; font-weight: 700;'>" +
                                ioIcon +
                                "</li>";

                            //if (channelIcon === undefined) {
                            channelIcon = (typeof channelIcon === "undefined") ? "swap_calls" : channelIcon;
                            //setupEl = setupEl + "<li class='list-inline-item material-icons md-48 align-middle tip' style='padding-left: 7px; transform: rotate(90deg);'> usb</li></ul>";        // rotate USB icon to indicate flows
                            //}

                            if (channelIcon === "swap_calls") {
                                setupEl = setupEl + "<li class='list-inline-item material-icons md-48 align-middle tip' style='padding-left: 7px; transform: rotate(90deg);'>" +
                                    channelIcon.toLowerCase() + "</li></ul>";
                            } else {
                                setupEl = setupEl + "<li class='list-inline-item material-icons md-48 align-middle tip' style='padding-left: 7px;'>" +
                                    channelIcon.toLowerCase() + "</li></ul>";
                            }

                            itemElement.innerHTML = setupEl;
                            itemElement.appendChild(title);

                            //docFrag.getElementById(g.channels[num].category).appendChild(itemElement);
                            docFrag.querySelector("#cat-" + g.channels[num].category.replace("$", "\\$").replace("[", "\\[").replace("]", "\\]")).appendChild(itemElement);
                        }
                    }
                }
            }
    }
    toolboxContents.appendChild(docFrag);
    toolboxDiv.style.setProperty("left", "8px");

    document.getElementById("toolboxFilter").focus();

    categories.forEach(function (item) {
        document.getElementById("toggle" + item).addEventListener("click", function () {
            if (document.getElementById(item).classList.contains("hidden")) {
                document.getElementById(item).classList.remove("hidden");
                this.innerHTML = "&#9650;";
            } else {
                document.getElementById(item).classList.add("hidden");
                this.innerHTML = "&#9660;";
            }
        });
    });

}

//#region ///////////////////////////// Utilities

/**
 * Function used to capitalise raw data as js cannot do it natively
 * @param input
 */
function capitalise(input) {
    return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

// TODO icon assignment is never used?
/**
 * Notifications (native alert popups, especially useful for alarms and on smartphones if the client isn't in focus the popup will notify)
 * @param type Type of notification to display.
 * @param message Message to display with notification.
 */
function notify(type, message) {
    var icon;
    switch (type.toUpperCase().substr(0, 4)) {
        case "ERRO":
            icon = "images/notify/error.png";
            //TODO: Flash the browser tab title to show the end user a notify message is due
            break;
        case "WARN":
            icon = "images/notify/warning.png";
            break;
        case "INFO":
            icon = "images/notify/info.png";
            break;
        default:
            icon = "images/notify/default.png";
            type = "message";
            break;
    }
    if (!window.Notification) {
        statusBar.status({
            message: "Notification (" + type.toLowerCase() + ") from " + g.title + ": " + message
        });                         // No support for native browser notification, so display in status bar instead.
    } else if (Notification.permission === "granted") {
        if (window.navigator.vibrate)
            window.navigator.vibrate(500);
    } else if (Notification.permission !== "denied") {                                                                    // Ask the user for permission, note Chrome does not implement permission static property so have to check for NOT 'denied'
        Notification.requestPermission(function (permission) {
            if (!("permission" in Notification)) {
                Notification.permission = permission;                                                                   // Whatever the user answers, we make sure Chrome stores the information
            }
            if (permission === "granted") {                                                                             // If the user is okay, let's create a notification
                if (window.navigator.vibrate)
                    window.navigator.vibrate(500);
            }
        });
    }
}

/**
 * Display status message in the bottom status bar (message will clear after timeout unless NO_TIMEOUT passed as second parameter, IMPORTANT will override other messages)
 * @param message Message to display.
 * @param func
 */
function status(message, func) {
    let messageObj = {
        message: message,
        important: func === "IMPORTANT" ? true : false
    }

    if (message === "MODE") {
        messageObj.message = `${g.mode} Mode`;
    }

    if (func === "NO_TIMEOUT") {
        messageObj.timeout = 0;
    }

    statusBar.status(messageObj);
}

/**
 * Write system status / errors to browser console, or to status if a developer is logged in.
 * @param type
 * @param source
 * @param message
 */
function writeConsole(type, source, message, important) {
    Log.warn("WriteConsole is deprecated.")
    return
}


/**
 * Custom handshake protocol to run a function when both the client and dashboard are ready.
 *
 */
function handShake() {
    imReady = true;
    if (typeof _waitForParent == "undefined") {
        Log.verbose("Client: Dashboard not ready :'(");
        return;
    }

    Log.verbose("Client: Yay! We are both loaded :D");
    _waitForParent();
}

// TEMPORARY Performance profiling
var profileLast = performance.now();
var profileStr = "";

function profiler(name) {
    if (name !== "show") {
        if (profileStr !== "undefined") {
            profileStr = profileStr + name + ": " + (performance.now() - profileLast).toFixed(3) + ", ";
        } else {
            profileStr = "";
        }
        profileLast = performance.now();
    } else {
        alert(profileStr + "Last: " + (performance.now() - profileLast).toFixed(3));
    }
}
// Dashboard uses to determine if the parent has finished running init JS