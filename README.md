# ComfyUI_Custom_Switch

https://github.com/user-attachments/assets/282dfdc3-9562-4ef0-a9d8-01c35508c272


-----

# 🧑‍指揮 Orchestrator Node for ComfyUI

A custom node for ComfyUI that acts as a "Workflow Switch" or "Orchestrator". It allows you to control complex graphs by activating and bypassing entire groups of nodes from a single dropdown menu.

This is perfect for quickly switching between different models (e.g., SDXL, SD1.5, Flux), LoRA configurations, or any other workflow variation without manual rewiring.

## ✨ Features

  * **Centralized Control:** Manage multiple workflow branches from a single node.
  * **Tagging System:** Organize your nodes into logical groups by adding a simple `[TAG]` to their titles.
  * **Dynamic Activation/Bypass:** Activate one group of nodes while automatically bypassing the others.
  * **Flexibility:** Untagged nodes are treated as "common" and are never affected.
  * **Easy to Customize:** The list of available workflows in the menu can be easily edited in one configuration file.

-----

## 🚀 Usage

Using the node is a simple two-step process:

### Step 1: Tag Your Nodes

For each node you want to assign to a group, edit its title to include a tag in brackets at the beginning.

  * **Example:**
      * Rename your SDXL KSampler to `[SDXL] KSampler`.
      * Rename your Flux model loader to `[FLUX] Checkpoint Loader`.
      * Rename your Qwen positive prompt to `[QWEN] Positive Prompt`.

Nodes without a tag (like a `Save Image` at the end) will always remain active.

### Step 2: Add and Use the Orchestrator Node

1.  Right-click on the canvas \> `Add Node`.
2.  Go to the `Logic` category and select `Orchestrator (Workflow Switch)`.
3.  Use the dropdown menu on this new node to choose the workflow you want to activate.

By selecting `[FLUX]`, all nodes starting with `[SDXL]` or `[QWEN]` will automatically be bypassed, and vice-versa.

-----

## 🔧 Customization

The list of tags that appear in the dropdown menu is easy to modify.

1.  Open the file: `ComfyUI/custom_nodes/OrchestratorNode/js/orchestrator.js`.
2.  Edit the `WORKFLOW_TAGS` array at the top of the file to add, remove, or rename your tags.

<!-- end list -->

```javascript
// Edit this list to change the menu options.
const WORKFLOW_TAGS = ["FLUX", "QWEN", "WAN2.2", "SDXL", "SD1.5"];
```

Save the file, hard-refresh the ComfyUI interface, and the menu will be updated.

