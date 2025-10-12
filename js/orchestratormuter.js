import { app } from "/scripts/app.js";

function isNodeSubgraph(node) {
    if (!node.type || typeof node.type !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(node.type);
}

function getNodeDefaultTitle(node) {
    const nodeType = LiteGraph.getNodeType(node.type);
    if (nodeType && nodeType.title) {
        return nodeType.title;
    }
    return node.type;
}

function saveTitlesToLocalStorage(workflowId) {
    //console.log(`[Orchestrator] SAVE: Lancement de la sauvegarde pour workflow '${workflowId}'.`);
    if (!workflowId) return;
    const allNodes = getAllNodesInGraph();
    const backup = {
        taggedProfiles: {},
        allNodeIds: allNodes.map(n => n.id)
    };

    for (const node of allNodes) {
        if (node.title && node.title.includes('[[')) {
            backup.taggedProfiles[node.id] = {
                title: node.title,
                type: node.type
            };
        }
    }
    const key = `orchestrator_titles_${workflowId}`;
    localStorage.setItem(key, JSON.stringify(backup));
    //console.log("[Orchestrator] SAVE: Sauvegarde terminée avec les données :", backup);
}

function restoreTitlesFromLocalStorage(workflowId) {
    //console.log(`[Orchestrator] RESTORE: Lancement pour workflow '${workflowId}'.`);
    if (!workflowId) return false;
    const key = `orchestrator_titles_${workflowId}`;
    const savedBackupJSON = localStorage.getItem(key);
    if (!savedBackupJSON) {
        //console.log("[Orchestrator] RESTORE: Aucune sauvegarde trouvée.");
        return false;
    }

    let backup = JSON.parse(savedBackupJSON);
    let hasChanged = false;

    const graphNodes = getAllNodesInGraph();
    const graphNodeIds = new Set(graphNodes.map(n => n.id));
    const backupAllNodeIds = new Set(backup.allNodeIds || []);
    const backupTaggedProfiles = backup.taggedProfiles || {};

    const orphans = Array.from(backupAllNodeIds).filter(id => !graphNodeIds.has(id));
    const newcomers = Array.from(graphNodeIds).filter(id => !backupAllNodeIds.has(id));

    if (orphans.length === 1 && newcomers.length === 1) {
        const orphanId = orphans[0];
        const newcomerId = newcomers[0];
        const orphanProfile = backupTaggedProfiles[orphanId];
        const newcomerNode = graphNodes.find(n => n.id === newcomerId);

        if (orphanProfile && newcomerNode && orphanProfile.type === newcomerNode.type) {
            //console.log(`%c[Orchestrator] RECREATE DÉTECTÉ ! L'orphelin #${orphanId} devient #${newcomerId}. RESTAURATION du titre.`, 'color: orange; font-weight: bold;');
            newcomerNode.title = orphanProfile.title;
            hasChanged = true;
            
            backup.taggedProfiles[newcomerId] = orphanProfile;
            delete backup.taggedProfiles[orphanId];
            
            const newAllNodeIds = Array.from(backupAllNodeIds).filter(id => id != orphanId);
            newAllNodeIds.push(newcomerId);
            backup.allNodeIds = newAllNodeIds;

            localStorage.setItem(key, JSON.stringify(backup));
        }
    }
    
    //console.log(`[Orchestrator] RESTORE: Terminé. Un changement a-t-il eu lieu ? ${hasChanged}`);
    return hasChanged;
}

function getAllNodesInGraph() {
    if (!app.graph) return [];
    const allNodes = [...app.graph._nodes];
    if (app.graph._subgraphs) {
        for (const subgraph of app.graph._subgraphs.values()) {
            allNodes.push(...subgraph.nodes);
        }
    }
    return allNodes;
}

function recreateNodeSafely(node, parentGraph) {
    try {
        const graph = parentGraph || app.graph;
        const nodeType = node.type;
        const pos = Array.isArray(node.pos) ? [...node.pos] : [0, 0];
        const title = node.title || node.type;
        const properties = structuredClone(node.properties || {});
        const widgets_values = structuredClone(node.widgets_values || []);
        const flags = structuredClone(node.flags || {});
        const inputs = node.inputs ? structuredClone(node.inputs) : undefined;
        const outputs = node.outputs ? structuredClone(node.outputs) : undefined;

        //console.log(`[Orchestrator] RECREATE DÉTECTÉ ! L'orphelin #${node.id} → recréation "${title}"`);

        try { graph.remove(node); } catch(e) { /* ignore */ }

        const newNode = LiteGraph.createNode(nodeType);
        if (!newNode) {
            console.warn(`[Orchestrator] Impossible de recréer le node de type "${nodeType}"`);
            return null;
        }

        newNode.pos = pos;
        if (title) newNode.title = title;
        try { newNode.properties = Object.assign({}, newNode.properties || {}, properties); } catch(e){}
        try { newNode.widgets_values = widgets_values; } catch(e){}
        try { newNode.flags = flags; } catch(e){}
        if (inputs) newNode.inputs = inputs;
        if (outputs) newNode.outputs = outputs;

        graph.add(newNode);

        try {
            if (app.graph._subgraphs) {
                app.graph._subgraphs = new Map([...app.graph._subgraphs.entries()].filter(([k, s]) => s && s.nodes));
            }
        } catch (e) { /* ignore */ }

        try { app.graph.setDirtyCanvas(true, true); } catch(e){}
        try { if (app.canvas) app.canvas.setDirty(true, true); } catch(e){}

        //console.log(`[Orchestrator] ✅ Node "${title}" recréé proprement (nouvel ID=${newNode.id})`);
        return newNode;
    } catch (e) {
        console.error("[Orchestrator] Erreur dans recreateNodeSafely:", e);
        return null;
    }
}

function updateNodeStates(selection, groupID) {
    const changesToApply = [];
    const dirtyGraphs = new Set([app.graph]);
    for (const targetNode of getAllNodesInGraph()) {
        if (targetNode.type === "OrchestratorNodeMuter") continue;
        const title = targetNode.title || "";
        const match = title.match(/\[\[(.*?):(.*?)\]\]/g);
        if (match) {
            for (const m of match) {
                const parts = m.substring(2, m.length - 2).split(':');
                const nodeGroupID = parts[0];
                const nodeTag = parts[1];
                if (nodeGroupID === groupID) {
                    let shouldBeActive = false;
                    if (Array.isArray(selection)) { shouldBeActive = selection.includes(nodeTag); } 
                    else { shouldBeActive = selection && nodeTag === selection; }
                    
                    const newMode = shouldBeActive ? 0 : 2; 

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
        for (const change of changesToApply) { change.node.mode = change.mode; }
        for (const graph of dirtyGraphs) { graph.setDirtyCanvas(true, true); }
    }
}

app.registerExtension({
    name: "Comfy.OrchestratorNodeMuter.Final.Flexible", 
    beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "OrchestratorNodeMuter") { 

            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                onNodeCreated?.apply(this, arguments);

                //console.log(`[Orchestrator] onNodeCreated: Création du nœud ID ${this.id}`);
                this.lastKnownNodeTitles = null;
                this.resyncDebounce = null;
                this.isFixingDuplicate = false;

                if (!this.properties) this.properties = {};
                if (this.properties.workflow_id === undefined) this.properties.workflow_id = "default_workflow";
                if (this.properties.show_settings === undefined) this.properties.show_settings = true;
                if (this.properties.group_id === undefined) this.properties.group_id = "DEFAULT";
                if (this.properties.node_mode === undefined) this.properties.node_mode = true;

                  const discoverAndBuildUI = () => {
                      //console.log("[Orchestrator] discoverAndBuildUI: Lancement...");
                      const groupID = this.properties.group_id;
                      const isExclusiveMode = this.properties.node_mode;
                      const settingsVisible = this.properties.show_settings;

                      this.widgets = [];
                      this.addWidget("toggle", "node_settings", settingsVisible, (v) => { this.properties.show_settings = v; this.resync(); }, { on: "Hide Settings", off: "Show Settings" });

                      if (settingsVisible) {
                          this.addWidget("STRING", "workflow_id", this.properties.workflow_id, (v) => { this.properties.workflow_id = v; this.resync(); });
                          this.addWidget("STRING", "group_id", groupID, (v) => { this.properties.group_id = v; this.resync(); });
                          this.addWidget("toggle", "node_mode", isExclusiveMode, (v) => {
                              this.properties.node_mode = v;
                              if (v === true) updateNodeStates(null, this.properties.group_id);
                              this.resync();
                          }, { on: "Exclusive selection", off: "Multiple selection" });
                      }
                      
                      const activeTagsInGraph = new Set();
                      const discoveredTags = new Set();
                      if (groupID) {
                          const regex = /\[\[(.*?):(.*?)\]\]/g;
                          for (const node of getAllNodesInGraph()) {
                              if (node.mode === 0 && node.title) { for (const match of node.title.matchAll(regex)) { if (match[1] === groupID) activeTagsInGraph.add(match[2]); } }
                              if (node.title) { for (const match of [...node.title.matchAll(regex)]) { if (match[1] === groupID) discoveredTags.add(match[2]); } }
                          }
                      }
                      const WORKFLOW_TAGS = Array.from(discoveredTags).sort();
                      if (WORKFLOW_TAGS.length > 0) {
                          this.widgets.push({ name: "top_spacer", type: "CUSTOM_SPACER", draw: () => {}, computeSize: () => [0, 10] });
                          
                          if (!isExclusiveMode && WORKFLOW_TAGS.length > 1) {
                              const allAreActive = WORKFLOW_TAGS.every(tag => activeTagsInGraph.has(tag));
                              this.addWidget("toggle", "Active All", allAreActive, (v) => {
                                  const newSelection = v ? WORKFLOW_TAGS : [];
                                  updateNodeStates(newSelection, this.properties.group_id);
                                  this.resync();
                              });
                              this.widgets.push({ name: "separator_spacer", type: "CUSTOM_SPACER", draw: (ctx, node, width, y) => {
                                  ctx.strokeStyle = "#222";
                                  ctx.beginPath();
                                  ctx.moveTo(10, y + 5);
                                  ctx.lineTo(width - 10, y + 5);
                                  ctx.stroke();
                              }, computeSize: () => [0, 10] });
                          }
                          
                          const handleToggleClick = (toggledTagName, isTurningOn) => {
                              //console.log(`[Orchestrator] Clic sur le toggle '${toggledTagName}', valeur: ${isTurningOn}`);
                              if (isExclusiveMode) { 
                                  updateNodeStates(isTurningOn ? toggledTagName : null, groupID); 
                              } 
                              else {
                                  const activeTags = WORKFLOW_TAGS.filter(tag => {
                                      const w = this.widgets.find(w => w.name === tag);
                                      return w && ((tag === toggledTagName) ? isTurningOn : w.value);
                                  });
                                  updateNodeStates(activeTags, groupID);
                              }
                               this.resync();
                          };

                          for (const tag of WORKFLOW_TAGS) {
                              this.addWidget("toggle", tag, activeTagsInGraph.has(tag), (v) => handleToggleClick(tag, v));
                          }
                      }

                      const newComputedSize = this.computeSize();
                      this.size = [this.size[0], newComputedSize[1]];
                      app.graph.setDirtyCanvas(true, true);
                  };
                
                this.discoverAndBuildUI = discoverAndBuildUI;

                this.resync = () => {
                    //console.log("[Orchestrator] --- CYCLE DE RESYNCHRONISATION COMPLET ---");
                    const restored = restoreTitlesFromLocalStorage(this.properties.workflow_id);
                    this.discoverAndBuildUI();
                    if (!restored) {
                        saveTitlesToLocalStorage(this.properties.workflow_id);
                    }
                     //console.log("[Orchestrator] --- FIN DU CYCLE ---");
                };
                
                //console.log("[Orchestrator] Planification du premier 'resync' dans 500ms.");
                setTimeout(() => this.resync(), 500);

                this.backgroundCheckInterval = setInterval(() => {
                    if (!this.resync) return;
                    const allNodes = getAllNodesInGraph();
                    const nodeCount = allNodes.length;

                    let titlesSignature = "";
                    for (const node of allNodes) {
                        if (node.title?.includes('[[')) titlesSignature += `${node.id}:${node.title};`;
                    }

                    if (this.lastKnownNodeTitles === null) {
                        this.lastKnownNodeTitles = titlesSignature;
                        this.lastNodeCount = nodeCount;
                        return;
                    }

                    if (this.lastNodeCount !== nodeCount || this.lastKnownNodeTitles !== titlesSignature) {
                        //console.log(`[Orchestrator] setInterval: Changement de signature détecté !`);
                        this.lastNodeCount = nodeCount;
                        this.lastKnownNodeTitles = titlesSignature;
                    
                        if (this.isFixingDuplicate) return;

                        const allIds = allNodes.map(n => String(n.id));
                        const seenIds = new Set();
                        let duplicateId = null;

                        for (const id of allIds) {
                            if (seenIds.has(id)) { duplicateId = id; break; }
                            seenIds.add(id);
                        }

                        if (duplicateId) {
                            const conflictingNodes = allNodes.filter(n => String(n.id) === duplicateId);
                            const hasSubgraph = conflictingNodes.some(n => isNodeSubgraph(n));
                            const hasNode = conflictingNodes.some(n => !isNodeSubgraph(n));
                            if (hasSubgraph && hasNode) {
                                const targetNode = conflictingNodes.find(n => !isNodeSubgraph(n));
                                if (targetNode) {
                                    this.isFixingDuplicate = true;
                                    //console.log(`%c[Orchestrator] Conflit détecté ! Remplacement du node "${targetNode.title}" (ID: ${targetNode.id}).`, "color: red; font-weight: bold;");
                                    let parentSubgraph = null;
                                    if (app.graph._subgraphs) {
                                        for (const subgraph of app.graph._subgraphs.values()) {
                                            if (subgraph.nodes.includes(targetNode)) {
                                                parentSubgraph = subgraph;
                                                break;
                                            }
                                        }
                                    }
                                    const correctPos = [...targetNode.pos];
                                    const graphToRemoveFrom = parentSubgraph || app.graph;
                                    graphToRemoveFrom.remove(targetNode);
                                    const recreated = recreateNodeSafely({
                                        type: targetNode.type, pos: correctPos, title: targetNode.title,
                                        properties: targetNode.properties, widgets_values: targetNode.widgets_values,
                                        flags: targetNode.flags, inputs: targetNode.inputs, outputs: targetNode.outputs
                                    }, graphToRemoveFrom);
                                    if (recreated) { 
									//console.log(`%c[Orchestrator] Node recréé proprement: ${recreated.type}`, "color: lightblue"); 
									}
                                    setTimeout(() => { this.isFixingDuplicate = false; this.resync(); }, 500);
                                    return;
                                }
                            }
                        }
                        this.resync();
                    }
                }, 200);
            };
          
            const onRemoved = nodeType.prototype.onRemoved;
            nodeType.prototype.onRemoved = function () {
                if (this.backgroundCheckInterval) {
                    clearInterval(this.backgroundCheckInterval);
                    //console.log(`[Orchestrator] Intervalle nettoyé pour le nœud ID ${this.id}`);
                }
                onRemoved?.apply(this, arguments);
            };          
        }
    },
});