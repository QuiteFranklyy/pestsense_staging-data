export default class StatusBar extends HTMLElement {
	constructor() {
		super();
        this._MAX_LOGS = 100; // Maximum number of logs.
        this._MESSAGE_TIMEOUT = 5000; // Time messages are displayed in milliseconds;
        this._statusImportant = false; // If status important drop other messages.
        this._defaultStatus = ""; // Default message to display when status times out.
		this._modal;
        this._logHistory = [];
		this.closeCallback;
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
        <style>
            .bg-dark {
                background-color: #343a40!important;
            }

            .text-white {
                color: #fff!important;
            }

            .navbar {
                position: relative;
                display: -ms-flexbox;
                display: flex;
                -ms-flex-wrap: wrap;
                flex-wrap: wrap;
                -ms-flex-align: center;
                align-items: center;
                -ms-flex-pack: justify;
                justify-content: space-between;
                padding: .5rem 1rem;
            }

            .navbar-fixed-bottom {
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 -1px -2px rgba(0, 0, 0, 0.24);
            }

            #logHamburger {
                padding: 0 0.6rem;
                cursor: pointer;
            }

            #logBox {
                display: none; 
                align-self: center; 
                width: 100%;
                background-color: black;
                margin-bottom: 8px;
            }

            #logArea {
                width: 100%;
                resize: none;
                border-style: none;
                padding: 0 1rem 0.5rem 1rem;
                background-color: black;
                align-self: center;
            }

            #container {
                display: flex;
                flex-direction: column;
                position: absolute;
                border-radius: 0;
                bottom: 0;
                right: 0;
                left: 0;
                margin: 0;
                overflow: hidden;
                width: 100%;
                padding-left: 0; 
                padding-right: 0;
            }

            #subTitle {
                margin-right: 20px;
            }

            :host([open="true"]) #logBox {
                display: block;
            }

        </style>
        <footer class="bg-dark">
            <div id="container" class="bg-dark navbar navbar-fixed-bottom text-white">
                <div id="logBox">
                    <textarea id="logArea" class="text-white" rows="15" readonly>
                    </textarea>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; width: 100%">
                        <svg id="logHamburger" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-list" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                        </svg>
                    <span id="serverStatus" class="unselectable" style="flex-grow: 1;"></span>
                    <span id="subTitle" class="float-right"></span>
                </div>
            </div>
        </footer>
        `;
        this._messageSpan = this.shadowRoot.querySelector("#serverStatus");
        this._logArea = this.shadowRoot.querySelector("#logArea");
        this._hamburger = this.shadowRoot.querySelector("#logHamburger");
        this._subTitle = this.shadowRoot.querySelector("#subTitle");
	}


    connectedCallback() {
        if (this.hasAttribute("open")) {
			let isOpen = this.getAttribute("open");
			if (isOpen === "true") {
				this._showLogs();
			} else if (isOpen === "false") {
				this._hideLogs();
			} else {
				this.setAttribute("open", false);
			}
		} else {
			this.setAttribute("open", false);
		}   
		this._hamburger.addEventListener("click", this._toggleLogs.bind(this));
        this.source = "Client";
        this.level = "Info";
        this.message = "Client starting...";
	}

    
    status(messageObj) {
        if (this._logHistory.length > this._MAX_LOGS) {
            this._logHistory.pop();
        }
        
        let defaultMessage = {
            timestamp: new Date(),
            source: this.source,
            level: this.level,
            message: "",
            timeout: this._MESSAGE_TIMEOUT,
            important: false
        }
        
        let finalObj = Object.assign(defaultMessage, messageObj);
        this._logHistory.push(finalObj);
        
        // if current status is important drop new messages.
        // if new message is also important, replace current message
        if (this._statusImportant && !finalObj.important) return;
        this.message = finalObj.message;
        // Adjust height of backdrop and modal background as the message might make the statusbar taller
        // this._adjustHeightForModals();
        const newMsgEvent = new CustomEvent("new_message", {
            bubbles: false,
            detail: {value: this.height }
        });
        this.dispatchEvent(newMsgEvent);
        this._statusImportant = finalObj.important;
        
        // Don't timeout if timeout = 0.
        if (finalObj.timeout !== 0) {
            setTimeout(() => {
                // Set status bar back to default status.
                this.message = this._defaultStatus;
                this._statusImportant = false;
            }, this._MESSAGE_TIMEOUT);
        }
    }

    clear() {
        this.message = this._defaultStatus;
    }

    set subtitle(value) {
        this._subTitle.innerHTML = value;
    }

    set important(value) {
        this._statusImportant = value;
    }

    get important() {
        return this._statusImportant;
    }
    
    get message() {
        this._messageSpan.innerText;
    }

    set message(value) {
        this._messageSpan.innerText = value;
    }

    get open() {
        let isOpen = this.getAttribute("open");
        return isOpen === "true" ? true: false;
    }

    set open(value) {
        if (value === true) {
            this._hideLogs();
        } else {
            this._showLogs();
        }
    }

    get height() {
        return this.shadowRoot.querySelector("#container").clientHeight;
    }

    set level(value) {
        this.setAttribute("level", value);
    }

    set defaultStatus(value) {
        this._defaultStatus = value;
    }

    get defaultStatus() {
        return this._defaultStatus;
    }

    get level() {
        return this.getAttribute("level");
    }

    set source(value) {
        this.setAttribute("source", value);
    }

    get source() {
        return this.getAttribute("source");
    }

    clear() {
        this.message = this._defaultStatus;
    }

    _showLogs() {
        // Fill logbox with Logs.
        let res = this._formateLogHistory();
        this._logArea.value = res;
        this.setAttribute("open", "true");
        // Opening the logs may require changing the height
        // this._adjustHeightForModals();
    }

    _hideLogs() {
        this.setAttribute("open", "false");
        // Clear log values from dom to save space.
        this._logArea.value = "";
    }

    _toggleLogs() {
        if (this.open === false) {
            this._showLogs();
        } else {
            this._hideLogs();
        }
        const toggleEvent = new CustomEvent("toggled", {
            bubbles: false,
            detail: {value: this.open }
        });
        this.dispatchEvent(toggleEvent);
    }

    _messageFormatter(messageObj) {
        return `${messageObj.timestamp.toLocaleTimeString('en-AU')} [${messageObj.source}] \t ${messageObj.level.toUpperCase()} ${messageObj.message} `
    }

    _formateLogHistory() {
        let formattedArray = [];
        // Calculated each time so they can be filtered in future.
        this._logHistory.forEach((messageObj) => {
            formattedArray.push(this._messageFormatter(messageObj));
        });
        return formattedArray.join("\n");
    }

    /**
     * Adjusts the bottom style of the modals and backdrop so the statusbar is not obscured by the dark backdrop/background
     */
    _adjustHeightForModals() {
        let height = this.shadowRoot.querySelector("#container").clientHeight;
        let modals = document.querySelectorAll("[id$=Modal]");
        modals.forEach((modal) => {
            modal.shadowRoot.querySelector("sensa-modal").bottom = height;
        });
        document.querySelector("back-drop").bottom = height;
    }

}

customElements.define("status-bar", StatusBar);
