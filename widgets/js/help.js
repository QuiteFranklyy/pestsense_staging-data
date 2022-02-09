"use strict";

// Variable Setup
var sidebar = SideBar("Help");

// "reload folders" button, not needed anymore but keep it here if you are working on markdown a lot
// sidebar.content.addChild(ElementFactory(
//     "button",
//     {
//         "style": "position: absolute; bottom: 0px; left: 0px; background-color: transparent; border: 0;",
//         "onclick": "getHelpFiles()"
//     },
//     [
//         ElementFactory("i", { "class": "material-icons" }, ["refresh"]),
//         ElementFactory("span", { "style": "display: inline-block; padding: 0 1rem;" }, ["Reload Folders"]),
//     ]
// ));

sidebar.content.addChild(ElementFactory(
    "button",
    {
        "id": "close-button",
        "style": "position: absolute; top: 10px; right: 10px; background-color: transparent; border: 0;",
        "onclick": "parent.closeHelpSidebar()"
    },
    [
        ElementFactory("span", { "style": "display: inline-block; padding: 0 1rem; font-size: 30px" }, ["✕"]),
    ]
));

sidebar.inputBar.toggleVisibility();
//sidebar.minimiseButton.toggleVisibility();

var container = document.querySelector(".flexcontainer");
container.appendChild(sidebar.html);

var mainContent = document.querySelector(".help-content");

var dashReady = true;

// Store user permissions
var permissions = [];

/**
 * Request help files from server using client.html publishCmd
 * @author Elijah Blowes
 */
function getHelpFiles(permissions) {
    if (typeof permissions !== "undefined") {
        window.permissions = permissions;
    }
    var data = { "sysmeta": { "label": "string", "source": "sidebar" }, "usermeta": "", "value": "string" };
    parent.publishCmd("GETHELP", JSON.stringify(data));
}

var g = {};

// add event listener to document as clicking inside the help sidebar will remove focus from the dashboard
// which is where most of the keyboard bindings are
document.addEventListener("keyup", (e) => {
    if (e.code == "Escape") {
        parent.closeHelpSidebar();
    }
});

//getHelpFiles();

//open_markdown("help/help.md");

// 'Classes'
/**
 * A Folder Object factory
 * @author Elijah Blowes
 * @param {String} title - A title/name for the Folder
 * @parm {Folder, File} children - Children of the Folder. Usually a File or Folder Object.
 * @param {Folder} parent - Either a Folder object or can be null
 * @return {Folder} returns a Folder Object
 */
function Folder(title, children, parent) {
    var folder = {};
    folder.__proto__ = Folder.prototype;
    // Children should be an object. where the key is the name
    // and the value is either a folder or file object.
    if (!(children instanceof Object) || typeof children !== "object") {
        children = {};
    }
    folder.children = children;
    folder.parent = parent;
    folder.title = title;

    return folder;
}

Folder.prototype.setTitle = function (string) {
    this.title = string;
}

/**
 * A File Object factory.
 * @author Elijah Blowes
 * @param {String} name - Name for the File
 * @param {String} source - A path to the file
 * @param {Folder} parent - A parent Folder that the file belongs to
 * @return {File} - A File Object
 */
function File(name, source, parent) {
    var file = {};
    file.__proto__ = File.prototype;
    file.title = name;
    file.parent = parent;
    file.source = source;
    return file;
}

// Functions
/**
 * Update the inner HTML of the Main Content div
 * @author Elijah Blowes
 * @param {HTMLElement} element - The element to update
 * @param {String} content - The content to update element with
 * NOTE: Security risk in having the ability to set innerHTML.
 */
function update_main_content(element, content) {
    element.innerHTML = content;
}
/**
 * Get the help files and add the filesystem index to the sidebar
 * @author Elijah Blowes
 * @param {Array} arr - An array of file paths
 * @param {SideBar} sidebar - A SideBar object to update
 */
function get_help(arr, sidebar) {
    var sidebarIndex = {};
    sidebarIndex = generate_help_tree(arr);
    sidebarIndex = build_index_html(sidebarIndex);
    sidebar.content.addChild(sidebarIndex.value.html);
    return sidebarIndex;
}

/**
 * Client.html calls iFrame.contentWindow.recvHost() when it recvs a
 * message destined for another iFrame.
 *
 * This is needed because we have to send the request for files through the client.html
 *
 * @author Elijah Blowes
 * @param {} topicItems -
 * @param {} data -
 * @param {} retain -
 */
function recvHost(topicItems, data, retain) {
    switch (topicItems[topicItems.length - 1]) {
        case "GETHELP":
            var arr = [];
            
            if (typeof permissions !== "undefined" && permissions.includes("design")) {
                // User has full permissions, show all help
                Object.keys(data.value).forEach(function (key) {
                    arr.push(data.value[key]);
                });
            } else {
                // User doesn't have design permissions, only show application help
                Object.keys(data.value).forEach(function (key) {
                    if (data.value[key].startsWith("application")) {
                        var app_help = data.value[key].substring(12);
                        arr.push(app_help);
                    }
                });
            }
            get_help(arr, sidebar);
            break;

        default:
            console.log("Don't know that one");
    }
}

/**
 * Generate the tree data structure for the help document filesystem
 * @author Elijah Blowes
 * @param {Array} - An array of file paths
 * @return {Folder} - Returns a Folder object with the name 'RootFolder'
 * that contains Folder and File objects as it's children.
 * Parent is set to null.
 * */
function generate_help_tree(arr) {
    if (!(Array.isArray(arr))) {
        throw new TypeError(arr + " isn't instance of Array");
    }
    if (arr.length <= 0) {
        throw new Error("Empty array");
    }
    // Match a / or a \.
    var regex = /[\/|\\]/g;

    // map arr to arrArr.
    // Before mapping
    /**
    * [
    *   "path/to/file1",
    *   "path/to/file2",
    *   "path/to/file3",
    *   "path/to/another/file1",
    * ]
    */
    // After mapping:
    /**
    * [
    *   ["path", "to", "file1"],
    *   ["path", "to", "file2"],
    *   ["path", "to", "file3"],
    *   ["path", "to", "another", "file1"]
    * ]
    *
    */
    var arrArr = arr.map(function (elem) {
        // split /path/to/file into ["path", "to", "file"]
        return elem.split(regex);
    });

    // Initialise a Folder with no children
    var struct = Folder("RootFolder", {}, null);
    // For each file path in arrArr do the following.
    arrArr.forEach(function (array, index) {
        // set the parent to be the root of the file system.
        var parent = struct;
        // loop through all the elements of the array.
        // e.g ["path", "to", "file"].
        var element
        for (var i = 0; i < array.length; i++, parent = parent.children[element]) {
            element = array[i];
            // If the element exists in the parent. Do nothing and go to next item
            if (parent.children[element]) {
                continue;
            }
            // If it is the last element create a file else create a folder.
            if (i == array.length - 1) {
                parent.children[element] = File(element.split(".")[0], arr[index], parent);
            } else {
                parent.children[element] = Folder(element, {}, parent);
            }

        }
    });
    return struct;
}

/**
 * Used to generate the HTML for each element (children) in a Folder object.
 * @author Elijah Blowes
 */
function build_index_html(folder) {
    /**
     * Generic Depth First Search used for search a tree structure.
     * @author Daniel Gormly
     * @param {Folder} folder - The folder/tree structure to search
     * @param {CallbackFunction} seen_callback - callback function to call when an item is seen
     * @param {CallbackFunction} leaf_callback - callback function when a leaf is visited.
     */
    function generic_search(folder, seen_callback, leaf_callback) {
        var seen = [];
        var stack = [];

        stack.push(folder);
        seen.push(folder);

        while (stack.length != 0) {
            var node = stack.pop();
            var children_nodes = node.children;
            // If we are at the end of the tree e.g. no more children
            if (children_nodes == null) {
                // Found leaf.
                // Do something with leaf.
                leaf_callback(node);
                continue;
            }
            // Else we add the children to the stack;
            for (var child in children_nodes) {
                // If we haven't seen the child add it to the stack
                if (seen.indexOf(children_nodes[child]) == -1) {
                    stack.push(children_nodes[child]);
                    seen.push(children_nodes[child]);
                }
            }
            // This is where you gotta do something e.g. build folder.
            seen_callback(node);
        }
    }

    /**
     * Create the HTML element for a Folder object
     * @author Elijah Blowes
     * @param {Folder} - Folder object to create the HTML for
     */
    function create_html_folder(folder) {
        folder.value = SideBarFolder(folder.title);
        // Toggle children visibility
        folder.value.span.addEventListener("click", folder.value.toggleChildren, true);
        // Add HTML parent
        if (folder.parent) {
            folder.parent.value.childrenDiv.appendChild(folder.value.html);
        }
    }

    /**
     * Create the HTML element for a File object
     * @author Elijah Blowes
     * @param {File} - File object to create HTML for.
     */
    function create_html_link(leaf) {
        leaf.value = SideBarFile(leaf.title, leaf.source);
        // Display Markdown when clicked
        leaf.value.html.addEventListener(
            "click",
            function (e) {
                changeFocus(this);
                // if the user has design permissions, the tree is created like this
                if (permissions.includes("design") || permissions.includes("flows") || permissions.includes("settings")) {
                    open_markdown("help/" + leaf.source);
                }
                // if the user only has dashboard permissions, the tree is missing the application/ part, so is needed here to access the md links
                else if (permissions[0] == "dashboard"){
                    open_markdown("help/application/" + leaf.source);
                }
            },
            true
        );
        // Add HTML to parent
        if (leaf.parent) {
            leaf.parent.value.childrenDiv.appendChild(leaf.value.html);
        }
    }

    function changeFocus(selected) {
        var leaves = document.querySelectorAll(".SideBarLink");
        // Convert leaves to Array instead of Node List
        leaves = Array.prototype.slice.call(leaves);
        // loop through leaves
        leaves.forEach(function (leaf, index, arr) {
            if (leaf.classList.contains("active") && leaf !== selected) {
                leaf.classList.remove("active");
            }
        });

        if (!(selected.classList.contains("active"))) {
            selected.classList.add("active");
        }

    }

    generic_search(folder, create_html_folder, create_html_link);

    return folder;

}

/**
    * Get Markdown file, parse to HTML string. Display in Main Content div
    * @author Elijah Blowes
    * @param {String} - file path as a string
    */
function open_markdown(file) {
    // An unholy callback hell
    getFileAsBlob(file, function (e) {
        processRequest(e.target, function (blob) {
            parseBlob(blob, function (e) {
                var string = parseToMarkdown(e.target.result);
                update_main_content(mainContent, string);
            });
        });
    });
}