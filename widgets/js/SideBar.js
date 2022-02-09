/**
 * Sidebar Factory. Used for creating sidebar objects
 * @author Elijah Blowes
 * @param {String} title 
 */
function SideBar(title) {
    // Check if title was given.
    if (!title) {
        title = "Sidebar";
    }
    //Check that title is a string or an instance of a string. Else throw a
    // TypeError.
    if (typeof title === "string" || title instanceof String) {
    } else {
        throw new TypeError("'title' is not a String");
    }

    var sidebar = {};

    sidebar.title = SideBarTitle(title);

    sidebar.inputBar = InputBar("search", "string");

    sidebar.content = SideBarContent();

    sidebar.minimiseButton = SideBarMinimiseButton();

    //sidebar.icons = SideBarIcons();

    sidebar.element = ElementFactory("div", { "class": "SideBar flexelement" }, [
        sidebar.title.html,
        sidebar.inputBar.html,
        ElementFactory("hr", { "class": "SideBarDivider" }, []),
        // Div to hold content of the toolbox.
        sidebar.content.html,
        //sidebar.icons.html,
    ]),

    // Create Sidebar skeleton html
    sidebar.html = ElementFactory("div", { "class": "sidebarcontainer flexelement flexcontainer" }, [
        // Create Sidebar element
        sidebar.element,
        sidebar.minimiseButton.html,
    ]);

    // Open sidebar function
    sidebar.open = function () {
        sidebar.element.classList.remove("flexremoved");
        sidebar.html.classList.remove("flexremoved")
        sidebar.minimiseButton.openIcon();
    }

    // Close sidebar function
    sidebar.close = function () {
        sidebar.element.classList.add("flexremoved");
        sidebar.html.classList.add("flexremoved");
        sidebar.minimiseButton.closeIcon();
    }

    sidebar.toggleVisibility = function () {
        if (sidebar.element.classList.contains("flexremoved")) {
            sidebar.open();
        } else {
            sidebar.close();
        }
    }

    sidebar.minimiseButton.html.addEventListener("click", sidebar.toggleVisibility, true);

    // Return sidebar object
    return sidebar;
}

function InputBar (placeholder, label) {
    var inputbar = {};
    label = (label ? label : "");
    inputbar.label = ElementFactory("label", {"tab-index" : "-1", "class" : "inputLabel"}, [ label ]);
    inputbar.input = ElementFactory("input", { "type": "search", "placeholder": placeholder }, []);
    inputbar.html = ElementFactory("div", { "class": "SearchInput" },
        [
            // Input element
            inputbar.label,
            inputbar.input,
        ]
    );
    
    inputbar.toggleLabelVisibility = function () {
        if (inputbar.label.style["display"] !== "none") {
            inputbar.label.style["display"] = "none";
        } else {
            inputbar.label.style["display"] = "block";
        }
    }

    inputbar.setLabel = function (string) {
        inputbar.label.textContent = string;
    }

    inputbar.setInputValue = function (string) {
        inputbar.input.value = string;
    }

    inputbar.toggleInputVisibility = function () {
        if (inputbar.input.style["display"] !== "none") {
        inputbar.input.style["display"] = "none";
        } else {
            inputbar.input.style["display"] = "revert";
        }
    }

    inputbar.toggleVisibility = function () {
        if (inputbar.html.style["display"] !== "none") {
            inputbar.html.style["display"] = "none";
        } else {
            inputbar.html.style["display"] = "revert";
        }
    }

    return inputbar;
}

function SideBarTitle(titleText) {
    var title = {};
    title.span = ElementFactory("span", {}, [titleText]);
    title.button = ElementFactory("button", {}, ["✕"]);
    title.html = ElementFactory("h5", {},
        [
            //Title
            title.span,
            //Cancel/Close button.
            title.button,
        ]
    );

    title.set = function (titleText) {
        title.html.querySelector("h5 > span").textContent = titleText;
    };

    title.toggleSpanVisibility = function () {
        if (title.span.style["display"] !== "none") {
            title.span.style["display"] = "none";
        } else {
            title.span.style["display"] = "revert";
        }
    }

    title.toggleButtonVisibility = function () {
        if (title.button.style["display"] !== "none") {
            title.button.style["display"] = "none";
        } else {
            title.button.style["display"] = "revert";
        }
    }

    title.setEventListener = function (event, callback) {
        title.html.addEventListener(event, callback, true);
    }

    return title;
}

function SideBarMinimiseButton () {
    var button = {};
 
    button.icon = ElementFactory("b", {}, ["⟨"]);
    button.html = ElementFactory("div", { "class": "iconColor minimiseButton flexelement" },
        [
            button.icon,
        ]
    );

    button.flipIcon = function () {
        if (button.icon.textContent === "⟩") {
            button.icon.textContent = "⟨";
        } else {
            button.icon.textContent = "⟩";
        }
    }

    button.closeIcon = function() {
        button.icon.textContent = "⟩";
    }

    button.openIcon = function () {
        button.icon.textContent = "⟨";
    }

    button.toggleVisibility = function() {
        if (button.html.classList.contains("flexremoved")) {
            button.html.classList.remove("flexremoved");
        } else {
            button.html.classList.add("flexremoved");
        }
    }

    return button;
}

function SideBarContent () {
    var content = {};
    content.html = ElementFactory("div", { "class": "SideBarContent" }, []);
    
    content.children = {};

    content.addChild = function (child) {
        if (child.id && content.children[child.id]) {
            content.children[child.id].remove();
        }
        content.children[child.id] = child;
        content.html.appendChild(child);
    }

    return content;
}

function SideBarIcons (icons) {
    var icons = {};
    
    icon.iconElements = [],

    icons.forEach(function (icon, index) {
        icons[index] = ElementFactory("a", {}, [
            ElementFactory("i", {}, [icon]),
        ])
    });

    icons.html = ElementFactory("div", {"class" : "SidebarIcons"}, 
    icons.iconElements
    
    );
    return icons;
}

function SideBarContentItem () {
    var item = {};
    
    item.html = ElementFactory("li", {}, ["Something"]);
    
    return item;
}

function SideBarFolder(title) {
    var folder = {};
    var id = title;
    folder.title = (title === "RootFolder" ? "" : title);
    
    folder.icon = ElementFactory(
        "i",
        {
            "class" : "material-icons icon_hidden",
            "style" :"color: rgb(245, 129, 51); display: inline-block; padding-right: 5px;",
        },
        [
            "folder",
        ]
    );

    folder.childrenDiv = ElementFactory(
        "div",
        {
            "class" : "FolderChildren hiddenChildren",
            "id" : id + "Children",
        },
        []
    );

    folder.span = ElementFactory(
        "h5",
        {
            "style" : "padding-right: 1rem;",
        },
        [
            folder.icon,
            ElementFactory("span", {"style" : "display: inline-block"}, [folder.title.replace(/_/g, " ")]),

        ]
    );

    folder.html = ElementFactory(
        "div",
        {
            "id": id,
            "class": "SideBarFolder",
        },
        [
            folder.span,
            folder.childrenDiv,
        ]
    );

    folder.toggleChildren = function () {
        if (folder.childrenDiv.classList.contains("hiddenChildren")) {
            folder.childrenDiv.classList.remove("hiddenChildren");
            folder.icon.textContent = "folder_open";
        } else {
            folder.childrenDiv.classList.add("hiddenChildren");
            folder.icon.textContent = "folder";
        }
    }
    
    return folder;
}

function SideBarFile(title, source) {
    var file = {};
    file.title = title;
    file.source = source;
    file.html = ElementFactory(
        "p",
        {
            "id" : file.title,
            "class" : "SideBarLink",
            "href" : file.source,
        },
        [
            ElementFactory(
                "i",
                {
                    "class" : "material-icons",
                },
                [
                    "description",
                ]
            ),
            ElementFactory(
                "span",
                {},
                [
                    file.title.replace(/_/g, " "),
                ]
            ),

        ]);

    return file;
}