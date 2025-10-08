import { app } from "/scripts/app.js";

function getAllNodesInGraph() {
    const allNodes = [...app.graph._nodes];
    if (app.graph._subgraphs) {
        for (const subgraph of app.graph._subgraphs.values()) {
            allNodes.push(...subgraph.nodes);
        }
    }
    return allNodes;
}

function updateNodeStates(selection, groupID) {
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
                    let shouldBeActive = false;
                    if (Array.isArray(selection)) {
                        shouldBeActive = selection.includes(nodeTag);
                    } else {
                        shouldBeActive = selection && nodeTag === selection;
                    }
                    const newMode = shouldBeActive ? 0 : 4;
                    if (targetNode.mode !== newMode) {
                        changesToApply.push({ node: targetNode, mode: newMode });
                        if (targetNode.graph) dirtyGraphs.add(targetNode.graph);
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

                // On utilise this.properties pour un état persistant
                if (!this.properties) this.properties = {};
                if (this.properties.show_settings === undefined) this.properties.show_settings = true;
                if (this.properties.group_id === undefined) this.properties.group_id = "DEFAULT";
                if (this.properties.node_mode === undefined) this.properties.node_mode = true;


                const discoverAndBuildUI = () => {
                    const groupID = this.properties.group_id;
                    const isExclusiveMode = this.properties.node_mode;
                    const settingsVisible = this.properties.show_settings;

                    // On efface tout sauf le widget de base qui ne sera jamais créé ici
                    this.widgets = [];

                    // On recrée les widgets à chaque fois à partir de this.properties
                    this.addWidget("toggle", "node_settings", settingsVisible, (value) => {
                        this.properties.show_settings = value;
                        discoverAndBuildUI();
                    }, { on: "Hide Settings", off: "Show Settings" });

                    if (settingsVisible) {
                        this.addWidget("STRING", "group_id", groupID, (value) => {
                            this.properties.group_id = value;
                            discoverAndBuildUI();
                        });
                        this.addWidget("toggle", "node_mode", isExclusiveMode, (value) => {
                        this.properties.node_mode = value;
                        // Si on passe en mode exclusif, on désactive tout pour forcer un nouveau choix.
                        if (value === true) {
                            updateNodeStates(null, this.properties.group_id);
                        }
                        discoverAndBuildUI();
                    }, { on: "Exclusive selection", off: "Multiple selection" });
                    }

                    const activeTagsInGraph = new Set();
                    if (groupID) {
                        const regex = /\[\[(.*?):(.*?)\]\]/g;
                        for (const node of getAllNodesInGraph()) {
                            if (node.mode === 0 && node.title) {
                                for (const match of node.title.matchAll(regex)) {
                                    if (match[1] === groupID) activeTagsInGraph.add(match[2]);
                                }
                            }
                        }
                    }

                    const discoveredTags = new Set();
                    if (groupID) {
                        const regex = /\[\[(.*?):(.*?)\]\]/g;
                        for (const node of getAllNodesInGraph()) {
                            if (node.title) {
                                for (const match of [...node.title.matchAll(regex)]) {
                                    if (match[1] === groupID) discoveredTags.add(match[2]);
                                }
                            }
                        }
                    }

                    const WORKFLOW_TAGS = Array.from(discoveredTags).sort();
                    if (WORKFLOW_TAGS.length > 0) {
                        this.widgets.push({ name: "top_spacer", type: "CUSTOM_SPACER", draw: () => {}, computeSize: () => [0, 10] });

                        const handleToggleClick = (toggledTagName, isTurningOn) => {
                            if (isExclusiveMode) {
                                const newSelectedTag = isTurningOn ? toggledTagName : null;
                                updateNodeStates(newSelectedTag, groupID);
                            } else {
                                const activeTags = WORKFLOW_TAGS.filter(tag => {
                                    const w = this.widgets.find(w => w.name === tag);
                                    if (!w) return false;
                                    return (tag === toggledTagName) ? isTurningOn : w.value;
                                });
                                updateNodeStates(activeTags, groupID);
                            }
                            // Léger délai pour s'assurer que l'état du graphe est mis à jour avant de reconstruire l'UI
                            setTimeout(() => discoverAndBuildUI(), 50);
                        };

                        for (const tag of WORKFLOW_TAGS) {
                            this.addWidget("toggle", tag, activeTagsInGraph.has(tag), (value) => handleToggleClick(tag, value));
                        }
                    }

                    // Redimensionnement correct, uniquement sur la hauteur
                    const newComputedSize = this.computeSize();
                    this.size = [this.size[0], newComputedSize[1]];
                    app.graph.setDirtyCanvas(true, true);
                };
                
                // Le premier appel pour construire l'interface
                setTimeout(() => discoverAndBuildUI(), 100);
            };

            const onDrawBackground = nodeType.prototype.onDrawBackground;
            nodeType.prototype.onDrawBackground = function(ctx) {
                onDrawBackground?.apply(this, arguments);
                let titlesSignature = "";
                for (const node of getAllNodesInGraph()) {
                    if (node.title?.includes('[[')) titlesSignature += node.title;
                }
                if (this.lastKnownNodeTitles !== titlesSignature) {
                    this.lastKnownNodeTitles = titlesSignature;
                    // On peut simplement appeler le callback du premier widget (node_settings) pour tout reconstruire
                    this.widgets[0]?.callback(this.widgets[0].value);
                }
            };
        }
    },
});