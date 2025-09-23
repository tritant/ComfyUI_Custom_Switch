import { app } from "/scripts/app.js";

function updateNodeStates(selectedTag, groupID, workflowTags) {
    const changesToApply = [];
    for (const targetNode of app.graph.nodes) {
        if (targetNode.type === "OrchestratorNodeMuter") continue;
        const title = targetNode.title || "";
        const match = title.match(/\[\[(.*?):(.*?)\]\]/);
        if (match && match[1] === groupID) {
            const nodeTag = match[2];
            const newMode = (selectedTag && nodeTag === selectedTag) ? 0 : 2;
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
    name: "Comfy.OrchestratorNodeMuter.Groups.Mute",

    beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "OrchestratorNodeMuter") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                onNodeCreated?.apply(this, arguments);

                const discoverAndBuildUI = () => {
                    const groupID = groupIDWidget.value;
                    if (!groupID) return;

                    this.widgets = this.widgets.filter(w => w.name === "group_id");
                    
                    const discoveredTags = new Set();
                    const regex = /\[\[(.*?):(.*?)\]\]/g;

                    for (const node of app.graph.nodes) {
                        if (node.title) {
                            const allMatches = [...node.title.matchAll(regex)];
                            for (const match of allMatches) {
                                if (match[1] === groupID) {
                                    discoveredTags.add(match[2]);
                                }
                            }
                        }
                    }

                    const WORKFLOW_TAGS = Array.from(discoveredTags);
                    if (WORKFLOW_TAGS.length === 0) return;

                    this.widgets.push({ name: "top_spacer", type: "CUSTOM_SPACER", draw: () => {}, computeSize: () => [0, 10] });

                    const handleToggleClick = (toggledTagName, isTurningOn) => {
                        let newSelectedTag = isTurningOn ? toggledTagName : null;
                        for (const w of this.widgets) {
                            if (WORKFLOW_TAGS.includes(w.name) && w.name !== toggledTagName) { 
                                w.value = false;
                            }
                        }
                        setTimeout(() => { updateNodeStates(newSelectedTag, groupID, WORKFLOW_TAGS); }, 0);
                    };

                    for (const tag of WORKFLOW_TAGS) {
                        this.addWidget("toggle", tag, false, (value) => { handleToggleClick(tag, value); });
                    }

                    const firstWidget = this.widgets.find(w => w.name === WORKFLOW_TAGS[0]);
                    if (firstWidget) {
                        firstWidget.value = true;
                        setTimeout(() => { updateNodeStates(firstWidget.name, groupID, WORKFLOW_TAGS); }, 0);
                    }
                };

                const groupIDWidget = this.addWidget(
                    "STRING",
                    "group_id",
                    "DEFAULT",
                    discoverAndBuildUI
                );
                
                setTimeout(() => discoverAndBuildUI(), 100);
            };
        }
    },
});