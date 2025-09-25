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
        
NODE_CLASS_MAPPINGS = { 
    "OrchestratorNodeToogle": OrchestratorNodeToogle,
    "OrchestratorNodeMuter": OrchestratorNodeMuter,
    "OrchestratorNodeGroupBypasser": OrchestratorNodeGroupBypasser,
    "OrchestratorNodeGroupMuter": OrchestratorNodeGroupMuter
    }
NODE_DISPLAY_NAME_MAPPINGS = { 
    "OrchestratorNodeToogle": "OrchestratorNode Bypass autoconfig",
    "OrchestratorNodeMuter": "OrchestratorNode Muter autoconfig",
    "OrchestratorNodeGroupBypasser": "Orchestrator Group Bypasser",
    "OrchestratorNodeGroupMuter": "Orchestrator Group Muter"
    }