import { app } from "/scripts/app.js";

const WORKFLOW_TAGS = ["FLUX", "QWEN", "WAN2.2", "SDXL", "SD1.5"];

function updateNodeStates(selectedWorkflow) {
    const changesToApply = [];

    // Phase 1 : On collecte les changements nécessaires sans toucher au graphe.
    for (const targetNode of app.graph.nodes) {
        if (targetNode.type === "OrchestratorNode") continue;

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

    // Phase 2 : On applique les changements de données silencieusement.
    if (changesToApply.length > 0) {
        for (const change of changesToApply) {
            // On change UNIQUEMENT la donnée.
            change.node.mode = change.mode;
            // ON NE TOUCHE PAS à setDirty() ici.
        }

        // On ne demande qu'UN SEUL rafraîchissement global à la toute fin.
        app.graph.setDirtyCanvas(true, true);
    }
}

app.registerExtension({
    name: "Comfy.OrchestratorNode.FinalAttempt",

    beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "OrchestratorNode") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                onNodeCreated?.apply(this, arguments);

                const widget = this.addWidget(
                    "combo",                      
                    "Active Workflow",            
                    WORKFLOW_TAGS[0],             
                    (value) => {
                        setTimeout(() => {
                            updateNodeStates(value);
                        }, 0);
                    },
                    { values: WORKFLOW_TAGS }     
                );

                setTimeout(() => {
                    updateNodeStates(widget.value);
                }, 200);
            };
        }
    },
});