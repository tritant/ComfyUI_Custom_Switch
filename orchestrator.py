class OrchestratorNode:
    NAME = "OrchestratorNode"
    DISPLAY_NAME = "Orchestrator (Workflow Switch)"
    FUNCTION = "do_nothing"
    CATEGORY = "Logic"
    
    @classmethod
    def INPUT_TYPES(cls):
        # Le widget est maintenant 100% géré par le JavaScript.
        return { "required": {} }

    RETURN_TYPES = ()
    OUTPUT_NODE = True

    # La fonction n'a plus besoin d'argument.
    def do_nothing(self):
        return ()
        
class OrchestratorNodeMuter:
    NAME = "OrchestratorNode Muter"
    DISPLAY_NAME = "Orchestrator (Workflow Switch)"
    FUNCTION = "do_nothing"
    CATEGORY = "Logic"
    
    @classmethod
    def INPUT_TYPES(cls):
        # Le widget est maintenant 100% géré par le JavaScript.
        return { "required": {} }

    RETURN_TYPES = ()
    OUTPUT_NODE = True

    # La fonction n'a plus besoin d'argument.
    def do_nothing(self):
        return ()        

# Ces dictionnaires restent inchangés
NODE_CLASS_MAPPINGS = { "OrchestratorNode": OrchestratorNode, "OrchestratorNodeMuter": OrchestratorNodeMuter }
NODE_DISPLAY_NAME_MAPPINGS = { "OrchestratorNode": "OrchestratorNode", "OrchestratorNodeMuter": "OrchestratorNode Muter" }