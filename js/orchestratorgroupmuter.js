import { app } from "/scripts/app.js";

function discoverAndBuildUI(node) {
    const existingWidgets = new Set(node.widgets.map(w => w.name));
    let hasChanges = false;
    const currentGroupTitles = new Set(app.graph._groups.map(g => g.title));
    const originalWidgetCount = node.widgets.length;
    
    node.widgets = node.widgets.filter(w => currentGroupTitles.has(w.name));
    if (node.widgets.length !== originalWidgetCount) {
        hasChanges = true;
    }

    const handleRadioClick = (clickedWidget) => {
        if (clickedWidget.value) {
            for (const widget of node.widgets) {
                if (widget.type === 'toggle' && widget !== clickedWidget) {
                    widget.value = false;
                }
            }
        } else {
            const anyOtherIsEnabled = node.widgets.some(w => w.type === 'toggle' && w.value === true);
            if(!anyOtherIsEnabled) {
                clickedWidget.value = true;
            }
        }
        for (const widget of node.widgets) {
            if (widget.type === 'toggle') {
                const group = app.graph._groups.find(g => g.title === widget.name);
                if (group) {
                    const newMode = widget.value ? 0 : 2;
                    group.recomputeInsideNodes();
                    for (const nodeInGroup of group._nodes) {
                        if (nodeInGroup.mode !== newMode) {
                            nodeInGroup.mode = newMode;
                        }
                    }
                }
            }
        }
        app.graph.setDirtyCanvas(true, true);
    };

    for (const group of app.graph._groups) {
        if (!existingWidgets.has(group.title)) {
            hasChanges = true;
            let isInitiallyEnabled = true;
            const anyOtherIsEnabled = node.widgets.some(w => w.type === 'toggle' && w.value === true);
            if (anyOtherIsEnabled || (group._nodes.length > 0 && group._nodes[0].mode === 2)) {
                isInitiallyEnabled = false;
            }
            node.addWidget("toggle", group.title, isInitiallyEnabled, function (value) {
                handleRadioClick(this);
            });
        }
    }
    
    const spacerIndex = node.widgets.findIndex(w => w.name === "top_spacer");
    if (spacerIndex !== -1) node.widgets.splice(spacerIndex, 1);
    
    const toggleExists = node.widgets.some(w => w.type === 'toggle');
    if(toggleExists) {
        node.widgets.unshift({ name: "top_spacer", type: "CUSTOM_SPACER", draw: () => {}, computeSize: () => [0, 10] });
    }

    if (hasChanges || (!toggleExists && originalWidgetCount > 0)) {
        const currentWidth = node.size[0];
        const newComputedSize = node.computeSize();
        node.size = [currentWidth, newComputedSize[1]];
        
        app.graph.setDirtyCanvas(true, true);
    }
}

app.registerExtension({
	name: "Comfy.GroupMuter.Heartbeat.Radio.Spacer.FixedResize",

	beforeRegisterNodeDef(nodeType, nodeData, app) {
		if (nodeData.name === "OrchestratorNodeGroupMuter") {
			const onNodeCreated = nodeType.prototype.onNodeCreated;
			nodeType.prototype.onNodeCreated = function () {
			onNodeCreated?.apply(this, arguments);
               if (!this.widgets) {
                    this.widgets = [];
                }                
                this.lastKnownGroupTitles = null;
                setTimeout(() => discoverAndBuildUI(this), 100);
			};
            
            const onDrawBackground = nodeType.prototype.onDrawBackground;
            nodeType.prototype.onDrawBackground = function(ctx) {
                onDrawBackground?.apply(this, arguments);
                const currentGroupTitles = (app.graph._groups?.map(g => g.title) || []).join();
                if (this.lastKnownGroupTitles !== currentGroupTitles) {
                    this.lastKnownGroupTitles = currentGroupTitles;
                    discoverAndBuildUI(this);
                }
            };
		}
	},
});