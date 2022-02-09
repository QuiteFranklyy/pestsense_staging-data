export default class Backdrop extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
        <style>
            :host([enabled="false"]) .modal {
                display: none;
            }

            .modal {
                position: fixed; 
                z-index: 1; 
                padding-top: 25px; 
                left: 0;
                bottom: 36px;
                width: 100%; 
                height: 100%; 
                overflow: auto; 
                font-family: 'Open Sans', sans-serif;
                background-color: rgba(0,0,0,0.4); 
            }
        </style>
        <div class="modal"></div>
        `;
	}

	connectedCallback() {
		this._modal = this.shadowRoot.querySelector(".modal");
        this._modal.addEventListener("click", (e) => {
            e.preventDefault();
            return false;
        });
    
        this._modal.addEventListener("keydown", (e) => {
            e.preventDefault();
            return false;
        });
	}

	disconnectedCallback() {
        this._modal.removeEventListener("click");
        this._modal.removeEventListener("keydown");
    }


    set enabled(value) {
        this.setAttribute("enabled", value == true ? "true" : "false");
    }

    get enabled() {
        return this.getAttribute("enabled") == "true" ? true : false;
    }

    set bottom(value) {
        this._modal.style.setProperty("bottom", `${value}px`);
    }

}

customElements.define("back-drop", Backdrop);
