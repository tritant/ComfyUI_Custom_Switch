import { app } from "/scripts/app.js";

function updateNodeStates(selectedWorkflow, workflowTags) {
    const changesToApply = [];
    for (const targetNode of app.graph.nodes) {
        if (targetNode.type === "OrchestratorNodeMuter") continue;
        const title = targetNode.title || "";
        let isTaggedNode = false;
        for (const tag of workflowTags) {
            if (title.startsWith(`[[${tag}]]`)) {
                isTaggedNode = true;
                break;
            }
        }
        if (isTaggedNode) {
            // --- LOGIQUE MODIFIÉE ---
            // Si un workflow est sélectionné ET que c'est le bon, on active.
            // Sinon (si aucun n'est sélectionné ou si c'est le mauvais tag), on bypasse.
            const newMode = (selectedWorkflow && title.startsWith(`[[${selectedWorkflow}]]`)) ? 0 : 4;
            
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
    name: "Comfy.OrchestratorNodeMuter.AutoDiscovery",

    beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "OrchestratorNodeMuter") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                onNodeCreated?.apply(this, arguments);
			   
			   if (!this.widgets) {
                   this.widgets = [];
                }

                const discoverAndBuildUI = () => {
                    if(this.widgets?.length > 0) {
                        this.widgets.length = 0;
                    }
                    
                    const discoveredTags = new Set();
                    const regex = /\[\[(.*?)\]\]/g; 

                    for (const node of app.graph.nodes) {
                        if (node.title) {
                            const matches = node.title.match(regex);
                            if (matches) {
                                matches.forEach(match => {
                                    const tag = match.substring(2, match.length - 2);
                                    discoveredTags.add(tag);
                                });
                            }
                        }
                    }

                    const WORKFLOW_TAGS = Array.from(discoveredTags);
                    if (WORKFLOW_TAGS.length === 0) return;

                    this.widgets.push({ name: "top_spacer", type: "CUSTOM_SPACER", draw: () => {}, computeSize: () => [0, 10] });

                    // --- LOGIQUE MODIFIÉE ---
                    const handleToggleClick = (toggledWidgetName, isTurningOn) => {
                        let newSelectedWorkflow = null;

                        if (isTurningOn) {
                            // Si on active un interrupteur, on désactive les autres.
                            newSelectedWorkflow = toggledWidgetName;
                            for (const w of this.widgets) {
                                if (WORKFLOW_TAGS.includes(w.name) && w.name !== toggledWidgetName) { 
                                    w.value = false;
                                }
                            }
                        }
                        // Si on désactive un interrupteur (isTurningOn = false), newSelectedWorkflow reste null.
                        
                        setTimeout(() => { updateNodeStates(newSelectedWorkflow, WORKFLOW_TAGS); }, 0);
                    };

                    for (const tag of WORKFLOW_TAGS) {
                        this.addWidget("toggle", tag, false, (value) => { handleToggleClick(tag, value); });
                    }

                    const firstWidget = this.widgets.find(w => w.name === WORKFLOW_TAGS[0]);
                    if (firstWidget) {
                        firstWidget.value = true;
                        setTimeout(() => { updateNodeStates(firstWidget.name, WORKFLOW_TAGS); }, 200);
                    }
                };
                
                discoverAndBuildUI();
            };
        }
    },
});