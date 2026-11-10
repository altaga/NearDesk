import os
from pathlib import Path
from typing import Dict, Any, List

DESK_ROOT = Path(os.environ.get("DESK_ROOT", Path.cwd()))

def resolve_path(relative_path: str = ".") -> Path:
    """Resolve a path safely under the desk root."""
    cleaned = relative_path.strip().lstrip("/\\")
    if not cleaned or cleaned == ".":
        return DESK_ROOT
    target = (DESK_ROOT / cleaned).resolve()
    # Prevent directory traversal
    if not str(target).startswith(str(DESK_ROOT)):
        return DESK_ROOT
    return target

def list_files(relative_path: str = ".") -> Dict[str, Any]:
    """List entries inside a directory under desk root."""
    target = resolve_path(relative_path)
    if not target.exists() or not target.is_dir():
        return {"ok": False, "error": "Directory not found", "path": relative_path, "entries": []}
    
    entries = []
    try:
        for child in sorted(target.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
            # skip large or hidden git/build directories
            if child.name in [".git", "node_modules", ".venv", "__pycache__", ".next"]:
                continue
            is_dir = child.is_dir()
            size = 0 if is_dir else child.stat().st_size
            entries.append({
                "name": child.name,
                "type": "dir" if is_dir else "file",
                "size": size,
                "extension": child.suffix.lower() if not is_dir else None
            })
        
        display_path = str(target.relative_to(DESK_ROOT)).replace("\\", "/")
        if display_path == ".":
            display_path = "/"
        else:
            display_path = "/" + display_path
            
        return {
            "ok": True,
            "path": display_path,
            "relative_path": str(target.relative_to(DESK_ROOT)).replace("\\", "/"),
            "entries": entries
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "entries": []}

def read_file(relative_path: str) -> Dict[str, Any]:
    """Read a text file capped at 256KB."""
    target = resolve_path(relative_path)
    if not target.exists() or not target.is_file():
        return {"ok": False, "error": "File not found"}
    
    try:
        size = target.stat().st_size
        cap = 256 * 1024
        with open(target, "rb") as f:
            raw = f.read(cap)
        content = raw.decode("utf-8", errors="replace")
        return {
            "ok": True,
            "path": relative_path,
            "name": target.name,
            "size": size,
            "content": content,
            "truncated": size > cap
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}

def write_file(relative_path: str, content: str) -> Dict[str, Any]:
    """Write contents to a file under desk root."""
    target = resolve_path(relative_path)
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        return {"ok": True, "path": relative_path, "size": len(content.encode("utf-8"))}
    except Exception as e:
        return {"ok": False, "error": str(e)}
