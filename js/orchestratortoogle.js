import { app } from "/scripts/app.js";

function getAllNodesInGraph() {
    const allNodes = [...app.graph._nodes];
    
    if (app.graph._subgraphs) {
        for (const subgraph of app.graph._subgraphs.values()) {
            //console.log(`[Orchestrator] Trouvé un Subgraph. Scan de ses ${subgraph.nodes.length} nœuds internes...`);
            allNodes.push(...subgraph.nodes);
        }
    }
    return allNodes;
}

function updateNodeStates(selectedTag, groupID, workflowTags) {
    const changesToApply = [];
    const dirtyGraphs = new Set([app.graph]);
    for (const targetNode of getAllNodesInGraph()) {
        if (targetNode.type === "OrchestratorNodeToogle") continue;
        const title = targetNode.title || "";
        const match = title.match(/\[\[(.*?):(.*?)\]\]/g);
        if (match) {
            for (const m of match) {
                const parts = m.substring(2, m.length - 2).split(':');
                const nodeGroupID = parts[0];
                const nodeTag = parts[1];
                if (nodeGroupID === groupID) {
                    const newMode = (selectedTag && nodeTag === selectedTag) ? 0 : 4;
                    if (targetNode.mode !== newMode) {
                        changesToApply.push({ node: targetNode, mode: newMode });
                        if (targetNode.graph) {
                            dirtyGraphs.add(targetNode.graph);
                        }
                    }
                    break;
                }
            }
        }
    }
    if (changesToApply.length > 0) {
        for (const change of changesToApply) {
            change.node.mode = change.mode;
        }
        for (const graph of dirtyGraphs) {
            graph.setDirtyCanvas(true, true);
        }
    }
}

app.registerExtension({
    name: "Comfy.OrchestratorNodeToogle.TheRealFinalVersion",

    beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "OrchestratorNodeToogle") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                onNodeCreated?.apply(this, arguments);

                this.lastKnownNodeTitles = null;

                const discoverAndBuildUI = () => {
                    const groupIDWidget = this.widgets.find(w => w.name === "group_id");
                    if (!groupIDWidget) return;
                    const groupID = groupIDWidget.value;
                    if (!groupID) return;

                    const activeWidget = this.widgets.find(w => w.type === 'toggle' && w.value);
                    const activeTagName = activeWidget ? activeWidget.name : null;
                    
                    this.widgets = this.widgets.filter(w => w.name === "group_id");
                    
                    const discoveredTags = new Set();
                    for (const node of getAllNodesInGraph()) {
                        if (node.title) {
                            const allMatches = [...node.title.matchAll(/\[\[(.*?):(.*?)\]\]/g)];
                            for (const match of allMatches) {
                                if (match[1] === groupID) {
                                    discoveredTags.add(match[2]);
                                }
                            }
                        }
                    }

                    const WORKFLOW_TAGS = Array.from(discoveredTags).sort();
                    
                    if (WORKFLOW_TAGS.length === 0) {
                        const currentWidth = this.size[0];
                        const newComputedSize = this.computeSize();
                        this.size = [currentWidth, newComputedSize[1]];
                        return;
                    }

                    this.widgets.push({ name: "top_spacer", type: "CUSTOM_SPACER", draw: () => {}, computeSize: () => [0, 10] });

                    const handleToggleClick = (toggledTagName, isTurningOn) => {
                        let newSelectedTag = isTurningOn ? toggledTagName : null;
                        if (isTurningOn) {
                            for (const w of this.widgets) {
                                if (WORKFLOW_TAGS.includes(w.name) && w.name !== toggledTagName) {
                                    w.value = false;
                                }
                            }
                        }
                        updateNodeStates(newSelectedTag, groupID, WORKFLOW_TAGS);
                    };

                    for (const tag of WORKFLOW_TAGS) {
                        const isEnabled = (tag === activeTagName);
                        this.addWidget("toggle", tag, isEnabled, (value) => { handleToggleClick(tag, value); });
                    }

                    const anyTogglesOn = this.widgets.some(w => w.type === 'toggle' && w.value);
                    if (WORKFLOW_TAGS.length > 0 && !anyTogglesOn) {
                        const firstToggle = this.widgets.find(w => w.type === 'toggle');
                        if(firstToggle) firstToggle.value = true;
                    }
                    
                    updateNodeStates(this.widgets.find(w => w.type === 'toggle' && w.value)?.name || null, groupID, WORKFLOW_TAGS);

                    const currentWidth = this.size[0];
                    const newComputedSize = this.computeSize();
                    this.size = [Math.max(currentWidth, newComputedSize[0]), newComputedSize[1]];
                    app.graph.setDirtyCanvas(true, true);
                };

                const groupIDWidget = this.addWidget("STRING", "group_id", "DEFAULT", discoverAndBuildUI);
                
                setTimeout(() => discoverAndBuildUI(), 100);
            };

            const onDrawBackground = nodeType.prototype.onDrawBackground;
            nodeType.prototype.onDrawBackground = function(ctx) {
                onDrawBackground?.apply(this, arguments);
                let titlesSignature = "";
                for(const node of getAllNodesInGraph()) {
                    if(node.title?.includes('[[')) {
                        titlesSignature += node.title;
                    }
                }
                
                if (this.lastKnownNodeTitles !== titlesSignature) {
                    this.lastKnownNodeTitles = titlesSignature;
                    const groupIDWidget = this.widgets.find(w => w.name === "group_id");
                    if(groupIDWidget?.callback) {
                        groupIDWidget.callback(groupIDWidget.value);
                    }
                }
            };
        }
    },
});