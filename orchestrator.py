import torch

class OrchestratorNodeMuter:
    NAME = "OrchestratorNode Muter autoconfig"
    DISPLAY_NAME = "Orchestrator Muter (auto config)"
    FUNCTION = "do_nothing"
    CATEGORY = "Logic"
    
    @classmethod
    def INPUT_TYPES(cls):
        return { "required": {} }

    RETURN_TYPES = ()
    OUTPUT_NODE = True

    def do_nothing(self):
        return ()    

class OrchestratorNodeToogle:
    NAME = "OrchestratorNode Bypass autoconfig"
    DISPLAY_NAME = "Orchestrator Bypass (auto config)"
    FUNCTION = "do_nothing"
    CATEGORY = "Logic"
    
    @classmethod
    def INPUT_TYPES(cls):
        return { "required": {} }

    RETURN_TYPES = ()
    OUTPUT_NODE = True

    def do_nothing(self):
        return ()        

class OrchestratorNodeGroupBypasser:
    NAME = "OrchestratorNode Group Bypasser"
    DISPLAY_NAME = "Orchestrator Group Bypasser"
    FUNCTION = "do_nothing"
    CATEGORY = "Logic"
    
    @classmethod
    def INPUT_TYPES(cls):
        return { "required": {} }

    RETURN_TYPES = ()
    OUTPUT_NODE = True

    def do_nothing(self):
        return ()
        
class OrchestratorNodeGroupMuter:
    NAME = "OrchestratorNode Group Muter"
    DISPLAY_NAME = "Orchestrator Group Muter"
    FUNCTION = "do_nothing"
    CATEGORY = "Logic"
    
    @classmethod
    def INPUT_TYPES(cls):
        return { "required": {} }

    RETURN_TYPES = ()
    OUTPUT_NODE = True

    def do_nothing(self):
        return ()
        
class AutomaticImageSwitcher:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {},
            "optional": {
                "image_1": ("IMAGE",),
                "image_2": ("IMAGE",),
                "image_3": ("IMAGE",),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "switch_image"
    CATEGORY = "Logic"

    def switch_image(self, image_1=None, image_2=None, image_3=None):

        if image_1 is not None:
            return (image_1,)
        
        elif image_2 is not None:
            return (image_2,)
            
        elif image_3 is not None:
            return (image_3,)
            
        blank_image = torch.zeros((1, 64, 64, 3), dtype=torch.float32)
        return (blank_image,)
        
NODE_CLASS_MAPPINGS = { 
    "OrchestratorNodeToogle": OrchestratorNodeToogle,
    "OrchestratorNodeMuter": OrchestratorNodeMuter,
    "OrchestratorNodeGroupBypasser": OrchestratorNodeGroupBypasser,
    "OrchestratorNodeGroupMuter": OrchestratorNodeGroupMuter,
    "AutomaticImageSwitcher": AutomaticImageSwitcher
    }
NODE_DISPLAY_NAME_MAPPINGS = { 
    "OrchestratorNodeToogle": "OrchestratorNode Bypass autoconfig",
    "OrchestratorNodeMuter": "OrchestratorNode Muter autoconfig",
    "OrchestratorNodeGroupBypasser": "Orchestrator Group Bypasser",
    "OrchestratorNodeGroupMuter": "Orchestrator Group Muter",
    "AutomaticImageSwitcher": "Automatic Image Switch (3 inputs)"
    }