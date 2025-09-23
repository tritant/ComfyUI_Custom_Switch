import { app } from "/scripts/app.js";

// This list now drives the creation of toggles.
const WORKFLOW_TAGS = ["FLUX", "QWEN", "WAN2.2", "SDXL", "SD1.5"];

// This function doesn't need to change at all.
function updateNodeStates(selectedWorkflow) {
    const changesToApply = [];

    for (const targetNode of app.graph.nodes) {
        if (targetNode.type === "OrchestratorNodeMuter") continue;
        const title = targetNode.title || "";
        let isTaggedNode = false;
        for (const tag of WORKFLOW_TAGS) {
            if (title.startsWith(`[${tag}]`)) {
                isTaggedNode = true;
                break;
            }
        }
        if (isTaggedNode) {
            const newMode = title.startsWith(`[${selectedWorkflow}]`) ? 0 : 4;
            if (targetNode.mode !== newMode) {
                changesToApply.push({ node: targetNode, mode: newMode });
            }
        }
    }

    if (changesToApply.length > 0) {
        for (const change of changesToApply) {
            change.node.mode = change.mode;
        }
        app.graph.setDirtyCanvas(true, true);
    }
}

app.registerExtension({
    name: "Comfy.OrchestratorNodeMuter.Toggles",

    beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "OrchestratorNodeMuter") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                onNodeCreated?.apply(this, arguments);
                if (!this.widgets) {
                    this.widgets = [];
                }
                const topSpacer = {
                    name: "top_spacer",
                    type: "CUSTOM_SPACER",
                    draw: () => {},
                    computeSize: () => [0, 25] // [largeur, hauteur] en pixels
                };
                // Utilisez unshift pour l'ajouter en haut de la liste des widgets
                this.widgets.push(topSpacer);

                // This function ensures only one toggle is active at a time.
                const handleToggleClick = (toggledWidgetName, isTurningOn) => {
					
					
                    if (!isTurningOn) {
                        // Prevent the user from turning off the last active toggle.
                        const thisWidget = this.widgets.find(w => w.name === toggledWidgetName);
                        if (thisWidget) thisWidget.value = true;
                        return;
                    }

                    // Turn off all other toggles.
                    for (const w of this.widgets) {
                        if (WORKFLOW_TAGS.includes(w.name) && w.name !== toggledWidgetName) {
                            w.value = false;
                        }
                    }

                    // Update the graph state based on the selected toggle.
                    setTimeout(() => {
                        updateNodeStates(toggledWidgetName);
                    }, 0);
                };

                // Create one toggle for each tag in our list.
                for (const tag of WORKFLOW_TAGS) {
                    this.addWidget(
                        "toggle",
                        tag, // The name of the widget is the tag itself
                        false, // Default to OFF
                        (value) => { handleToggleClick(tag, value); }
                    );
                }

                // --- SET INITIAL STATE ---

                // Find the first toggle and turn it ON by default.
                const firstWidget = this.widgets.find(w => w.name === WORKFLOW_TAGS[0]);
                if (firstWidget) {
                    firstWidget.value = true;
                    // Trigger the initial update.
                    setTimeout(() => {
                        updateNodeStates(firstWidget.name);
                    }, 200);
                }
            };
        }
    },
});