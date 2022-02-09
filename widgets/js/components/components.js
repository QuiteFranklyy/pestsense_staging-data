import LoginModal from "./LoginModal.js";
import DialogModal from "./DialogModal.js";
import HelpModal from "./HelpModal.js";
import StatusBar from "./StatusBar.js";
import Backdrop from "./Backdrop.js";
import Logger from "/js/Logger.js";
import SensaCollection from "/js/SensaCollection.js";
import StateStore from "/js/StateStore.js";
import {material_icons} from "/js/MaterialIcons.js";

// Attach classes to window.
window["Logger"] = Logger;
window["SensaCollection"] = SensaCollection;
window["StateStore"] = StateStore;
window["material_icons"] = material_icons;
