

https://github.com/user-attachments/assets/ab26685b-a0d8-45b9-aa1c-c44fcc136c43



# 🧑‍指揮 Orchestrator Node (Auto-Discovery) for ComfyUI

A "zero-configuration" custom node for ComfyUI that acts as an intelligent workflow switch. It automatically scans your graph for special tags (`[[TAG]]`) and creates a control interface with toggles to activate or deactivate groups of nodes on the fly.

No more config files or manual lists\! Just tag your nodes, and the Orchestrator does the rest.

-----

## \#\# ✨ Features

  * **Automatic Discovery:** Detects workflow groups based on your node titles.
  * **Zero-Configuration:** No `config.json` files or lists to manage. Just tag and go.
  * **Dynamic Interface:** Automatically creates toggle switches for each unique group detected.
  * **Exclusive Control:** Only one group can be active at a time (radio button behavior).
  * **Common Nodes Ignored:** Untagged nodes always remain active and are unaffected.

-----

## \#\# 🚀 Usage

The workflow is designed to be as simple and intuitive as possible.

### Step 1: Tag Your Nodes with Double Brackets

For each node you want to assign to a group, edit its title to include a tag surrounded by **double brackets** `[[...]]`.

  * **Example:**
      * Rename your SDXL KSampler to `[[SDXL]] KSampler`.
      * Rename your Flux checkpoint loader to `[[FLUX]] Checkpoint Loader`.
      * Common nodes like `Save Image` should not have a tag.

### Step 2: Add the Orchestrator Node

1.  Right-click on the canvas \> `Add Node`.
2.  Go to the `Logic` category and select `Orchestrator (Auto-Discovery)`.

### Step 3: The Node Configures Itself

As soon as you add the node, it will scan your workflow, find all unique tags (`[[SDXL]]`, `[[FLUX]]`, etc.), and automatically create a toggle switch for each one. The first toggle found will be enabled by default.

### Updating the Interface

If you add, remove, or modify tags in your workflow while the Orchestrator node is already present, simply **reload the node** The node will perform a new scan and update its interface with the correct toggles.

-----

## \#\# How It Works

On load, the node's script iterates through all other nodes in your graph. It uses a regular expression to find any titles containing a tag in the `[[...]]` format. It then compiles a list of all unique tags found and builds its interface by creating a toggle switch for each one.
