import Modal from "./Modal.js";
export default class ChangePasswordModal extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this._onsubmit;
		this._changePromise;
		this.shadowRoot.innerHTML = `
      <link href="css/modal.css" rel="stylesheet" type="text/css">
      <sensa-modal id="sensaModal" data-title="Change Password" footer="true">
        <form id="formChange" role="form">
          <div class="form-group">
			<div class="mb-3 col-xl-10">
				<label class="col-xl-2 form-control-label" for="oldpassword">Old Password</label>
				<input tabindex="1" type="password" name="oldpassword" class="form-control" id="inpOldPassword" 
					placeholder="Enter old password" required data-first-focusable="true"/>
			</div>
			<div class="mb-3 col-xl-10">
              <label class="col-xl-2 form-control-label" for="newpassword">New Password</label>
              <input tabindex="1" type="password" name="newpassword" class="form-control" id="inpNewPassword" 
                placeholder="Enter new password" required />
            </div>
            <div class="mb-3 col-xl-10">
              <label for="confirmpassword" class="col-xl-2 form-control-label">Password</label>
              <input tabindex="2" type="password" class="form-control" name="confirmpassword" id="inpConfirmPassword" 
                placeholder="Confirm Password" required />
            </div>
        </div>
        </form>
        <div slot="footer">
          <button id="submitBtn" tabindex="3" class="btn btn-primary" form="formChange" type="submit" data-last-focusable="true">Change Password</button>
        </div>
      </sensa-modal>
    `;

		this._passwordInp = this.shadowRoot.getElementById("inpNewPassword");
		this._oldPasswordInp = this.shadowRoot.getElementById("inpOldPassword");
		this._confirmPasswordInp = this.shadowRoot.getElementById("inpConfirmPassword");
		this._submitBtn = this.shadowRoot.getElementById("submitBtn");
		this._modal = this.shadowRoot.getElementById("sensaModal");
		this._form = this.shadowRoot.getElementById("formChange");
	}

	connectedCallback() {
		this.shadowRoot.querySelector("#formChange").addEventListener("submit", this._handleSubmit.bind(this));
		this._passwordInp.addEventListener("change", this._checkPass.bind(this));
		this._confirmPasswordInp.addEventListener("change", this._checkPass.bind(this));
		
		if (this.hasAttribute("open")) {
			this._modal.open = this.getAttribute("open");
		} else {
			this._modal.open = false;
		}
	}

	disconnectedCallback() {
		this.shadowRoot.querySelector("#formChange").removeEventListener("submit", this._handleSubmit);
		this._passwordInp.removeEventListener("change", this._checkPass);
		this._confirmPasswordInp.removeEventListener("change", this._checkPass);
	}

	_checkPass() {
		const strongReg = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})");

		// Check strength of password.
		if (!strongReg.test(this._passwordInp.value)) {
			this._passwordInp.setCustomValidity(
			"Password too weak! The password must be: \n\t At least 8 characters long \n\t Contain at least 1 uppercase alphabetical character \n\t Contain atleast 1 lowercase alphabetical character \n\t Contain at least 1 numeric character");
			this._passwordInp.reportValidity();
			return false;
		} else {
			this._passwordInp.setCustomValidity('');
		}

		if (this._passwordInp.value == this._oldPasswordInp.value) {
			this._passwordInp.setCustomValidity('Passwords cannot be the same.');
			return false;
		} else {
			this._passwordInp.setCustomValidity('');
		}

		if (this._passwordInp.value == this._confirmPasswordInp.value) {
			this._confirmPasswordInp.setCustomValidity('');
		} else {
			this._confirmPasswordInp.setCustomValidity('Passwords do not match.')
			this._confirmPasswordInp.reportValidity();
			return false;
		}

		return true;
	}

	_handleSubmit(e) {
		// Block form HTTP submitting.
		e.preventDefault();
		if (!this._checkPass()) return;

		// Change password.
		if (typeof this._onsubmit === "function") {
			this._onsubmit({ 
				"newPass": this._passwordInp.value,
				"oldPass": this._oldPasswordInp.value,
				"confirmPass": this._confirmPasswordInp.value
			});
			this._form.reset();
			if (this._changePromise) {
				this._changePromise(true);
				this._changePromise = null;
			}
		}
	}

	change(title) {
		this.exitable = false;
		this.title = title;
		this.open = true;
		return new Promise((resolve, reject) => {
			this._changePromise = resolve;
		});
	}

	resolve(value) {
		if (this._changePromise) {
			this._changePromise(value);
			this._changePromise = null;
		}
		this.exitable = true;
	}

	get open() {
		return this._modal.open === "true" ? true : false;
	}

	set open(newValue) {
		this._modal.open = newValue;
		if (newValue === true) {
			setTimeout(() => this._oldPasswordInp.focus(), 0);
		} else {
			// Clear form;
			this._form.reset();
		}
	}

	set exitable(value) {
		this._modal.setAttribute("exitable", value);
	}

	set onsubmit(callback) {
		if (typeof callback === "function") {
			this._onsubmit = callback;
		}
	}

	get onsubmit() {
		return this._onsubmit;
	}

	set title(newTitle) {
		this._modal.title = newTitle;
	}

	set bottom(value) {
        this._modal.shadowRoot.querySelector(".modal").style.setProperty("bottom", `${value}px`);
    }
}

customElements.define("change-password-modal", ChangePasswordModal);
