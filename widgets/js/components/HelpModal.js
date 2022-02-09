import Modal from "./Modal.js";
export default class HelpModal extends HTMLElement {
	constructor() {
		super();
		this._onsubmit;
        this._oncancel;
        this._resolvePromise;
        this._rejectPromise;
        this._KEYCODE_ESC = 27;
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
        <style>
            :host([message=""]) #message {
                display: none;
            }

            :host(:not([mode="prompt"])) #promptForm {
                display: none;
            }

        </style>
        <link href="css/modal.css" rel="stylesheet" type="text/css">
        <link href="css/help.min.css" rel="stylesheet" type="text/css">
        <sensa-modal data-title="Help for Widget" footer="true" help="true" exitable="true" tabindex=0>
          <div id="message" class="form-group"></div>
            <form id="promptForm" class="form-group" role="form">
            </form> 
          <div slot="footer">
            <button id="confirmBtn" class="btn btn-primary" form="promptForm" type="submit">
                OK
            </button>
          </div>
        </sensa-modal>
      `;

		this._modal = this.shadowRoot.querySelector("sensa-modal");
		this._confirmBtn = this.shadowRoot.querySelector("#confirmBtn");
        this._promptForm = this.shadowRoot.querySelector("#promptForm");
		this._message = this.shadowRoot.querySelector("#message");      
	}

	connectedCallback() {
		this._confirmBtn.addEventListener("click", this._confirmAlert.bind(this));
        this._promptForm.addEventListener("submit", this._handleSubmit.bind(this));

        this.onkeydown = (e) => {
            if (e.keyCode === this._KEYCODE_ESC) {
                this._confirmBtn.click();
            }
        };
        
        // Empty message hides div.
        this.message = "";
	}

	disconnectedCallback() {
        this._confirmBtn.removeEventListener("click", this._confirmAlert);
        this._promptForm.removeEventListener("submit", this._handleSubmit.bind(this));
        this.onkeydown = null;
	}

	// Reset modal when exited.
	_hideModal() {
		this.title = "Alert";
		this.message = "";

        this._onsubmit = null;
        this._oncancel = null;
        this._rejectPromise = null;
        this._resolvePromise = null;
        this._promptForm.reset();
        this.open = false;
        this.setAttribute("mode", "alert");
	}

    _confirmAlert(e) {
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

	set open(newValue) {
		this._modal.open = newValue;
        setTimeout(() => this._modal.focus(), 0);
	}

	set title(newTitle) {
		this._modal.title = newTitle;
	}

	set confirmText(text) {
		this._confirmBtn.innerText = text;
	}

    set bottom(value) {
        this._modal.shadowRoot.querySelector(".modal").style.setProperty("bottom", `${value}px`);
    }
}

customElements.define("help-modal", HelpModal);
