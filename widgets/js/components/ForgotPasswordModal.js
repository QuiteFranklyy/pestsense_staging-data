import Modal from "./Modal.js";
export default class ForgotPasswordModal extends HTMLElement {
  constructor() {
    super();
    this._username;
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        .forgotLabel {
          color: rgb(245, 129, 51);
          cursor: pointer;
        }

        :host([mode="username"]) .pinForm {
          display: none;
        }

        :host([mode="pin"]) .usernameForm {
          display: none;
        }
        
      </style>
      <link href="css/modal.css" rel="stylesheet" type="text/css">
      <sensa-modal data-title="Having trouble signing in?" background="false" footer="true">
        <span slot="toggle" class="forgotLabel">Forgot my password</span>
        <div id="message" class="form-group">
          Enter your email to get started.
        </div>
        <div class="usernameForm">
          <div class="form-group">
            <label for="username">Email:</label>
            <input
              tabindex="1"
              type="text"
              class="form-control"
              id="usernameInput"
              name="username"
              placeholder="Email"
              required
              data-first-focusable="true"
            />
          </div>
        </div>
        <div class="pinForm">
          <div class="form-group">
            <label for="pin">Validation Pin:</label>
            <input
              name="pin"
              id="pinInput"
              tabindex="1"
              type="text"
              class="form-control"
              placeholder="Validation Pin"
              required
            />
          </div>
          <div class="form-group">
            <label for="newpassword">New Password:</label>
            <input
              name="newpassword"
              id="newPassInput"
              tabindex="2"
              type="password"
              class="form-control"
              placeholder="New Password"
              required
            />
          </div>
          <div class="form-group">
            <label for="confirmpassword">Confirm Password:</label>
            <input
              name="confirmpassword"
              id="confirmPassInput"
              tabindex="3"
              type="password"
              class="form-control"
              placeholder="Confirm Password"
              required
            />
          </div>
        </div>
        <div slot="footer">
          <div class="usernameForm">
            <button id="sendPinBtn" data-last-focusable="true" class="btn btn-primary">Continue</button>
          </div>
          <div class="pinForm">
            <button id="confirmBtn" class="btn btn-primary" type="submit">
              Confirm
            </button>
          </div>
        </div>
      </sensa-modal>
    `;

    this._sensaModal = this.shadowRoot.querySelector("sensa-modal");
    this._newPass = this.shadowRoot.getElementById("newPassInput");
    this._confPass = this.shadowRoot.getElementById("confirmPassInput");
    this._pin = this.shadowRoot.getElementById("pinInput");

    if (!this.hasAttribute("mode")) {
      this.setAttribute("mode", "username");
    }
  }

  connectedCallback() {
    this.shadowRoot
      .querySelector("#sendPinBtn")
      .addEventListener("click", this._sendPin.bind(this));
    this.shadowRoot
      .querySelector("#confirmBtn")
      .addEventListener("click", this._confirmPin.bind(this));

    this._sensaModal.onclose = this._hideModal.bind(this);
  }

  disconnectedCallback() {
    this.shadowRoot
      .querySelector("#confirmBtn")
      .removeEventListener("click", this._confirmPin);
  }

  _sendPin = async () => {
    const usernameInp = this.shadowRoot.getElementById("usernameInput");
    const username = usernameInp.value;
    // Clear username field
    usernameInp.value = "";
    if (username === "") {
      return;
    }

    this._username = username;

    const url = "/forgot";
    const payload = {
      username: username,
    };

    // request options
    const options = {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    };

    // send POST request
    const packet = await fetch(url, options).then((response) =>
      response.json()
    );

    if (packet.status == "401") {
      this.message = packet.message;
      return;
    }

    this.message = `A reset pin was sent to '${packet.email}'.`;
    this.setAttribute("mode", "pin");
  };

  // Reset modal when exited.
  _hideModal() {
    this.setAttribute("mode", "username");
    this.message = "Enter your username to get started.";
    this._username = null;
    this._pin.value = "";
    this._newPass.value = "";
    this._confPass.value = "";
  }

  // Confirm password
  _confirmPin = async () => {
    this._newPass = this.shadowRoot.getElementById("newPassInput");
    this._confPass = this.shadowRoot.getElementById("confirmPassInput");
    this._pin = this.shadowRoot.getElementById("pinInput");

    if (this._newPass.value !== this._confPass.value) {
      this._confPass.setCustomValidity("Passwords did not match. Try again.");
      return;
    } else {
      this._confPass.setCustomValidity("");
    }

    const strongReg = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})");

    // Check strength of password.
    if (!strongReg.test(this._newPass.value)) {
			this._newPass.setCustomValidity(
        "Password too weak! The password must be: \n\t At least 8 characters long \n\t Contain at least 1 uppercase alphabetical character \n\t Contain atleast 1 lowercase alphabetical character \n\t Contain at least 1 numeric character");
        this._newPass.reportValidity();
        return;
      } else {
        this._newPass.setCustomValidity('');
      }

    const url = "/forgotPin";
    const payload = {
      pin: this._pin.value,
      password: this._newPass.value,
      username: this._username,
    };
7
    // request options
    const options = {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    };

    // send POST request
    const packet = await fetch(url, options).then((response) =>
      response.json()
    );

    // If successful show, else reshow pin page.
    switch (packet.status) {
      case "401":
        this.message = `${packet.message}. Try again.`;
        break;
      case "200":
        this.message = "Password successfully changed!";
        setTimeout(() => {
          this._sensaModal.open = false;
        }, 3000);
    }
  };

  set message(newValue) {
    this.setAttribute("message", newValue);
    this.shadowRoot.getElementById("message").innerText = newValue;
  }

  get message() {
    return this.getAttribute("message");
  }

}

customElements.define("forgot-pass-modal", ForgotPasswordModal);
