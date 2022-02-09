import Modal from "./Modal.js";
export default class DialogModal extends HTMLElement {
	constructor() {
		super();
		this._onsubmit;
        this._oncancel;
        this._resolvePromise;
        this._rejectPromise;
		this._params;
        this._KEYCODE_ESC = 27;
        this._KEYCODE_TAB = 9;
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
        <style>
            :host([message=""]) #message {
                display: none;
            }

            :host(:not([mode="prompt"])) #promptForm {
                display: none;
            }

            :host([promptLabel=""]) #promptLabel {
                display: none;
            }

            :host(:not([mode="confirm"])) #cancelBtn {
                display: none;
            }

            div[slot="footer"]:focus-visible {
                outline: none;
            }   

        </style>
        <link href="css/modal.css" rel="stylesheet" type="text/css">
        <sensa-modal data-title="Alert!" footer="true" exitable="false" tabindex=0>
          <div id="message" class="form-group"></div>
            <form id="promptForm" class="form-group" role="form">
                <div class="mb-3 col-xl-10">
                    <label id="promptLabel" class="col-xl-2 form-control-label" for="prompt"></label>
                    <input tabindex=1 type="text" name="prompt" class="form-control" id="promptInput" 
                        placeholder="" />
                </div> 
            </form> 
          <div slot="footer">
            <button id="cancelBtn" class="btn-secondary btn" tabindex=3>
                Cancel
            </button>
            <button id="confirmBtn" class="btn btn-primary" form="promptForm" type="submit" tabindex=2>
                OK
            </button>
          </div>
        </sensa-modal>
      `;

		this._modal = this.shadowRoot.querySelector("sensa-modal");
		this._confirmBtn = this.shadowRoot.querySelector("#confirmBtn");
        this._cancelBtn = this.shadowRoot.querySelector("#cancelBtn");
        this._promptForm = this.shadowRoot.querySelector("#promptForm");
        this._promptInput = this.shadowRoot.querySelector("#promptInput");
		this._message = this.shadowRoot.querySelector("#message");      
		this._promptLabel = this.shadowRoot.querySelector("#promptLabel");     
        // Set focus point to be modal by default
        this._focusPoint = this._modal;
	}

	connectedCallback() {
		this._confirmBtn.addEventListener("click", this._confirmAlert.bind(this));
        this._cancelBtn.addEventListener("click", this._cancelAlert.bind(this));
        this._promptForm.addEventListener("submit", this._handleSubmit.bind(this));        
        this.onkeydown = (e) => {
            if (e.keyCode === this._KEYCODE_ESC && (this.mode === "confirm" || this.getAttribute("exitable") === "true")) {
                this._cancelBtn.click();
            } 
        };

        this.mode = "alert";
        
        // Empty message hides div.
        this.message = "";
	}

	disconnectedCallback() {
        this._confirmBtn.removeEventListener("click", this._confirmAlert);
        this._cancelBtn.removeEventListener("click", this._cancelAlert);
        this._promptForm.removeEventListener("submit", this._handleSubmit.bind(this));
        this.onkeydown = null;
	}

	// Reset modal when exited.
	_hideModal() {
		this.title = "Alert";
		this.message = "";
		this.buttonText = "OK";
        this.cancelText = "Cancel";
        this.promptLabel = "";

        this._onsubmit = null;
        this._oncancel = null;
        this._rejectPromise = null;
        this._resolvePromise = null;
        this._params = null;
        this._promptForm.reset();
        this.setAttribute("mode", "alert");
	}

    _cancelAlert() {
        this.open = false;

        // Resolve promise if set
        if (this._resolvePromise) {
            this._resolvePromise(false);
        }
        
        if (typeof this._oncancel === "function") {
            this._oncancel(this._params);
        }

    }

    _confirmAlert(e) {

        if (this.mode === "prompt") {
            return;
        }

      if (this._resolvePromise) {
            this._resolvePromise(true);
        }

        if (typeof this._onsubmit === "function") {
            this._onsubmit(this._params);
        }

        this.open = false;
        this._hideModal();
    }

    _handleSubmit(e) {
        // Stop from HTTP posting form.
        e.preventDefault();

        if (this.mode !== "prompt" && this.mode !== "form") {
            return;
        }

        let formData = new FormData(this._promptForm);
        let formObject = Object.fromEntries(formData);

        // Check if correct mode.
        let ret;
        switch (this.mode) {
            case "prompt":
                ret = formObject.prompt;
                break;
            case "form":
                // Unused atm but return entire form as object.
                ret = formObject;
                break;
        }

        if (this._resolvePromise) {
            this._resolvePromise(ret);
        }

        this.open = false;
        this._hideModal();
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
    async alert(text, title, options) {
        this.title = title || "Alert!";
        this.message = text || "";
        this.confirmText = options?.confirmText ?? "OK";
        this.params = options?.params ?? null;

        this._modal.setAttribute("data-first-focusable", "true");
        this._confirmBtn.setAttribute("data-last-focusable", "true");

        this.setAttribute("mode", "alert");
        this.open = true;

        return new Promise((resolve, reject) => {
            this._resolvePromise = resolve;
            this._rejectPromise = reject;
        })
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
    async confirm(text, title, options) {
        this.title = title || "Alert!";
        this.message = text || "";
        this.confirmText = options?.confirmText ?? "OK";
        this.cancelText = options?.cancelText ?? "Cancel"
        this._confirmBtn.setAttribute("data-first-focusable", "true");
        this._cancelBtn.setAttribute("data-last-focusable", "true");

        this.mode = "confirm";
        this.open = true;

        return new Promise((resolve, reject) => {
            this._resolvePromise = resolve;
            this._rejectPromise = reject;
        })
    }

    /**
     * Show Prompt modal
     * @param {object} options
     * @param {string} options.text - sets the input label.
     * @param {string} options.placeholder - sets the prompt input placeholder text.
     * @param {string} options.type - sets the prompt input type.
     * @param {boolean} options.required - sets the the input to required. Defaults to false.
     *  
     * @returns 
     */
    async prompt(text, title, options) {
        this.title = title || "Alert!";
        this.message = text || "";
        this.confirmText = options?.confirmText ?? "OK";
        this.mode = "prompt";
        this.promptLabel = options?.label ?? "";
        this.promptPlaceholder = options?.placeholder ?? "";
        this.promptType = options?.type ?? "text";
        this._focusPoint = this._promptInput;
        this._promptInput.required = options?.required ?? false;

        this._promptInput.setAttribute("data-first-focusable", "true");
        this._confirmBtn.setAttribute("data-last-focusable", "true");

        this.open = true;

        return new Promise((resolve, reject) => {
            this._resolvePromise = resolve;
            this._rejectPromise = reject;
        }) 
    }

    // Set content body.
	set message(newValue) {
        if (newValue === "") {
            this.setAttribute("message", "");
        } else {
            this.setAttribute("message", "message set");
        }
		this._message.innerHTML = newValue;
	}

	get message() {
		return this._message.innerText;
	}


	get open() {
		return this._modal.open === "true" ? true : false;
	}

    // Set dialog mode.
    get mode() {
        return this.getAttribute("mode");
    }

    set mode(value) {
        this.setAttribute("mode", value);

        // Change button type so form will not submit.
        if (value !== "prompt") {
            this._confirmBtn.type = "button";
        } else {
            this._confirmBtn.type = "submit";
        }
    }

    // Form label for input.
    set promptLabel(value) {
        this.setAttribute("promptLabel", value);
        this._promptLabel.innerText = value;
    }

    // Form placeholder value for input.
    set promptPlaceholder(value) {
        this._promptInput.placeholder = value;
    }

    set promptType(value) {
        this._promptInput.type = value;
    }

	set open(newValue) {
		this._modal.open = newValue;
        setTimeout(() => this._focusPoint?.focus(), 0);
	}

	set title(newTitle) {
		this._modal.title = newTitle;
	}

	set confirmText(text) {
		this._confirmBtn.innerText = text;
	}

    set cancelText(text) {
        this._cancelBtn.innerText = text;
    }

	set onsubmit(callback) {
		if (typeof callback === "function") this._onsubmit = callback;
	}

	get onsubmit() {
		return this._onsubmit;
	}

    set oncancel(callback) {
		if (typeof callback === "function") this._oncancel = callback;
	}

	get oncancel() {
		return this._oncancel;
	}

	set params(value) {
		this._params = value;
	}

    get params() {
        return this._params;
    }
    
    set bottom(value) {
        this._modal.shadowRoot.querySelector(".modal").style.setProperty("bottom", `${value}px`);
    }
}

customElements.define("dialog-modal", DialogModal);
