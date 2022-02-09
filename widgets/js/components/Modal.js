export default class Modal extends HTMLElement {
	constructor() {
		super();
		this._modal;
		this.closeCallback;
        this._KEYCODE_TAB = 9;
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
        <style>
            /* Attribute styling */
            :host([footer='false']) div.modal-footer {
                display: none;
            }

            :host([exitable='false']) span.close {
                display: none;
            }

            :host([logo='']) .modal-logo-img {
                display: none;
            }

            h5 {
                font-size: 1.25rem;
                margin-top: 0;
                margin-bottom: 0;
                font-weight: 500;
            }

            .modal-header {
                display: -ms-flexbox;
                display: flex;
                -ms-flex-align: start;
                align-items: flex-start;
                -ms-flex-pack: justify;
                justify-content: space-between;
                padding: 1rem 1.5rem;
                border-bottom: 1px solid #dee2e6;
                border-top-left-radius: .3rem;
                border-top-right-radius: .3rem;
            }

            .modal {
                display: none; 
                position: fixed; 
                z-index: 1; 
                padding-top: 25px; 
                left: 0;
                top: 0;
                width: 100%; 
                bottom: 35px;
                overflow: auto; 
                font-family: 'Open Sans', sans-serif;
                background-color: rgba(0,0,0,0.4); 
            }
            
            :host([background='false']) div.modal {       
                background-color: inherit;    
            }

            /* Modal Content */
            .modal-content {
                border-radius: 5px;
                position: relative;
                background-color: #fefefe;
                margin: auto;
                padding: 0;
                border: 1px solid #888;
                width: 500px;
                max-width: 90%;
                box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
                -webkit-animation-name: animatetop;
                -webkit-animation-duration: 0.4s;
                animation-name: animatetop;
                animation-duration: 0.4s
            }

            :host([help='true']) .modal-content {
                width: 900px
            }

            .modal-title {
                color: #4C4C4C;
                margin-bottom: 0;
                line-height: 1.5;
            }

            /* Add Animation */
            @-webkit-keyframes animatetop {
                from {top:-300px; opacity:0} 
                to {top:0; opacity:1}
            }

            @keyframes animatetop {
                from {top:-300px; opacity:0}
                to {top:0; opacity:1}
            }

            /* The Close Button */
            .close {
                float: right;
                font-size: 1.5rem;
                font-weight: 700;
                line-height: 1;
                color: #000;
                text-shadow: 0 1px 0 #fff;
                opacity: .5;
            }

            .close:hover,
            .close:focus {
            color: #000;
                text-decoration: none;
                cursor: pointer;
            }

            .modal-body {
                padding: 2px 16px;
                margin: 20px 2px
            }

            .modal-footer {
                display: -ms-flexbox;
                display: flex;
                -ms-flex-align: center;
                align-items: center;
                -ms-flex-pack: end;
                justify-content: flex-end;
                padding: 1rem;
                border-top: 1px solid #dee2e6;
                border-bottom-right-radius: .3rem;
                border-bottom-left-radius: .3rem;
            }

        </style>
        <div id="toggle"><slot name="toggle"></slot></div>
        <div class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <img class="modal-logo-img" height=30>
                    <h5 class="modal-title"><h5>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <slot></slot>
                </div>
                <div class="modal-footer">
                    <slot name="footer"></slot>
                </div>
            </div>
        </div>
        `;
        this._title = this.shadowRoot.querySelector(".modal-title");
        this._logo = this.shadowRoot.querySelector(".modal-logo-img");
        this._firstFocusable;
		this._lastFocusable;
	}

	connectedCallback() {
		this._modal = this.shadowRoot.querySelector(".modal");
        this._modalContent = this.shadowRoot.querySelector(".modal-content");
		this.shadowRoot.querySelector(".close").addEventListener("click", this._hideModal.bind(this));
		this.shadowRoot.querySelector("[name='toggle']").addEventListener("click", this._showModal.bind(this));

		if (this.hasAttribute("data-title")) {
			this.title = this.getAttribute("data-title");
		} else {
			this.title = "Modal Title";
		}

        if (this.hasAttribute("exitable")) {
            if (this.getAttribute("exitable") === "true") {
                // Allow modal to be closed when clicking in the greyed out area
                this._modalContent.addEventListener("click", (e) => {e.stopPropagation()});
                this._modal.addEventListener("click", this._hideModal.bind(this));
            }
        }

        if (this.hasAttribute("logo")) {
            this.logo = this.getAttribute("logo");            
        } else {
            this.logo = "";
        }

		if (this.hasAttribute("open")) {
			let isOpen = this.getAttribute("open");
			if (isOpen === "true") {
				this._showModal();
			} else if (isOpen === "false") {
				this._hideModal();
			} else {
				this.setAttribute("open", false);
			}
		} else {
			this.setAttribute("open", false);
		}

        this.onkeydown = (e) => {
            if (e.keyCode === this._KEYCODE_TAB) {
                // debugger;
				e.stopPropagation();
                if (document.activeElement?.shadowRoot.activeElement.id == this._lastFocusable?.id) {
                    setTimeout(() => this._firstFocusable.focus(), 0);
                }
                // if (document.activeElement?.shadowRoot.activeElement.id == "cancelBtn") {
                //     setTimeout(() => this._confirmBtn.focus(), 0);
                // }
            }
        };
	}

	disconnectedCallback() {
		this.shadowRoot.querySelector(".close").removeEventListener("click", this._hideModal);
        this._modal.removeEventListener("click", this._hideModal);
        this._modalContent.removeEventListener("click", (e) => {e.stopPropagation()});
	}

	_showModal() {
		this._modal.style.display = "block";
		this.setAttribute("open", true);
	}

	_hideModal() {
		if (typeof this.closeCallback === "function") {
			this.closeCallback();
		}

		this._modal.style.display = "none";
		this.setAttribute("open", false);
	}

	set open(newValue) {
		if (newValue === "true") {
			newValue = true;
		} else if (newValue === "false") {
			newValue = false;
		} else if (typeof newValue !== "boolean") {
			return;
		}

		if (newValue) {
			this._showModal();
		} else {
			this._hideModal();
		}
        this._firstFocusable = this.querySelector("[data-first-focusable]");
		this._lastFocusable  = this.querySelector("[data-last-focusable]");
	}

    set logo(imageURL) {
        this.setAttribute("logo", imageURL);
        this._logo.src = imageURL;
    }

    get logo() {
        this.getAttribtue("logo");
    }

	get open() {
		return this.getAttribute("open");
	}

	get title() {
		return this.getAttribute("data-title");
	}

	set title(newValue) {
		this._title.innerText = newValue;
		this.setAttribute("data-title", newValue);
	}

	set onclose(callback) {
		this.closeCallback = callback;
	}

	get onclose() {
		return this.closeCallback;
	}
}

customElements.define("sensa-modal", Modal);
