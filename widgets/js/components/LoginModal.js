import Modal from "./Modal.js";
import ForgotPasswordModal from "./ForgotPasswordModal.js";
export default class LoginModal extends HTMLElement {
	constructor() {
		super();
		this._rememberInp;
		this._loginCallback;
		this._clientName;
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
      <style>
        :host([mode="username"]) .pinForm {
          display: none;
        }

        :host([mode="pin"]) .usernameForm {
          display: none;
        }   

		input[type='checkbox'] {
			position: absolute;
			left: -999em;
			line-height: 2.1ex;
		}

		input[type='checkbox'] + label {
			position: relative;
			overflow: hidden;
			cursor: pointer;
		}

		input[type='checkbox'] + label::before {
			content: "";
			display: inline-block;
			vertical-align: -25%;
			height: 13px;
   			width: 13px;
			border: 1px solid rgb(245, 129, 51);
			background-color: #f2f2f2;
			border-radius: 2px;
			margin-right: 0.5em;
			margin-left: 0.1em;
			margin-bottom: 0.25em;
		}

		input[type='checkbox']:hover + label::before {
			background-color: rgba(247, 152, 89, 0.7);
		}

		input[type='checkbox']:checked + label::before {
			background-color: rgb(245,129,51);
		}

		input[type="checkbox"]:checked + label::after {
			content: '';
			position: absolute;
			width: 0.75ex;
   			height: 0.4ex;
			background: rgba(0,0,0,0);
			top: 0.75ex;
  			left: 0.2ex;
			border: 2.5px solid white;
			border-top: none;
			border-right: none;
			font-size: 1.5em;
			-webkit-transform: rotate(-45deg);
			-moz-transform: rotate(-45deg);
			-o-transform: rotate(-45deg);
			-ms-transform: rotate(-45deg);
			transform: rotate(-45deg);
		}

		input[type="checkbox"]:focus + label::before {
			box-shadow: 0 0 0 0.1rem #f58133;
		}

      </style>
      <link href="css/modal.css" rel="stylesheet" type="text/css">
      <sensa-modal id="sensaModal" data-title="Logon to Server" logo="../wlabel/brand_icon.png" exitable="false" footer="true">
        <form id="formLogin" role="form" autocomplete="on">
          <div class="form-group">
            <div class="mb-3 col-xl-10">
              <label class="col-xl-2 form-control-label" for="username">Email</label>
              <input tabindex="3" type="text" name="username" class="form-control" id="inpUsername" 
                placeholder="Enter Email" required data-first-focusable="true"/>
            </div>
            <div class="mb-3 col-xl-10">
              <label for="current-password" class="col-xl-2 form-control-label">Password</label>
              <input tabindex="4" type="password" class="form-control" name="current-password" id="inpPassword" 
                placeholder="Enter Password" autocomplete="new-password" required />
            </div>
            <div class="container flex">
              <div class="mb-3 form-check">
                <input tabindex="5" type="checkbox" name="remember" class="form-check-input" id="remember" />
                <label for="remember">Remember me</label>
              </div>
              <div class="mb-3">
                <forgot-pass-modal mode="username"></forgot-pass-modal>
              </div>
          </div>
        </div>
        </form>
        <div slot="footer">
          <button class="btn btn-primary" form="formLogin" type="submit" tabindex="6" data-last-focusable="true">Sign in</button>
        </div>
      </sensa-modal>
    `;

		this._usernameInp = this.shadowRoot.getElementById("inpUsername");
		this._passwordInp = this.shadowRoot.getElementById("inpPassword");
		this._modal = this.shadowRoot.getElementById("sensaModal");
		this._rememberInp = this.shadowRoot.getElementById("remember");
		this._form = this.shadowRoot.getElementById("formLogin");
	}

	connectedCallback() {
		this.shadowRoot.querySelector("#formLogin").addEventListener("submit", this._handleSubmit.bind(this));

		if (this.hasAttribute("open")) {
			this._modal.open = this.getAttribute("open");
		} else {
			this._modal.open = false;
		}

		if (this.hasAttribute("data-title")) {
			this._modal.title = this.getAttribute("data-title");
		}

		if (this.hasAttribute("remember") && this.getAttribute("remember") === "true") {
			this._rememberInp.checked = true;
			this.setAttribute("remember", true);
		} else {
			this._rememberInp.checked = false;
			this.setAttribute("remember", false);
		}
	}

	disconnectedCallback() {
		this.shadowRoot.querySelector("#formLogin").removeEventListener("submit", this._handleSubmit);
	}

	_handleSubmit(e) {
		e.preventDefault();

		this.setAttribute("remember", this._rememberInp.checked);

		const userDetails = {
			username: this._usernameInp.value,
			password: this._passwordInp.value,
			remember: this._rememberInp.checked,
		};

		this._loginCallback(userDetails);

		// Must return false to block get request and appending to url.
		return false;
	}

	set onlogin(callback) {
		if (typeof callback === "function") {
			this._loginCallback = callback;
		}
	}

	get onlogin() {
		return this._loginCallback;
	}

	set clientname(newValue) {
		this._clientName = newValue;
	}

	get open() {
		return this._modal.open === "true" ? true : false;
	}

	set open(newValue) {
		this._modal.open = newValue;
		if (newValue === true) {
			this._usernameInp.focus();
		} else {
			// Clear form;
			this._form.reset();
		}
	}

	get title() {
		return this._modal.title;
	}

	set title(newValue) {
		this._modal.title = newValue;
	}

	set remember(newValue) {
		this._rememberInp.checked = newValue;
		this.setAttribute("remember", newValue);
	}

	get remember() {
		this._rememberInp.checked;
	}

	set bottom(value) {
        this._modal.shadowRoot.querySelector(".modal").style.setProperty("bottom", `${value}px`);
    }
}

customElements.define("login-modal", LoginModal);
