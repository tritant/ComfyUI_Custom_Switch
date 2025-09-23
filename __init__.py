# Importe les dictionnaires nécessaires depuis notre fichier de logique
from .orchestrator import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

# Spécifie que les fichiers web (JS, CSS) se trouvent dans le sous-dossier "js"
WEB_DIRECTORY = "./js"

# Rend les mappings accessibles à ComfyUI
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]