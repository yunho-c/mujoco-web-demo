from pathlib import Path
import json
import xml.etree.ElementTree as ET

_HERE = Path(__file__).parent.parent / "static"

_ALLOWED_EXTENSIONS = [".xml", ".png", ".stl", ".obj"]


def generate_index_old():
    """Generates an index of all files in this directory."""
    files_to_download = []
    for path in _HERE.rglob("*"):
        if path.is_file() and path.suffix in _ALLOWED_EXTENSIONS:
            files_to_download.append(str(path.relative_to(_HERE)))
    files_to_download.sort()
    with open("index.json", mode="w") as f:
        json.dump(files_to_download, f, indent=2)


def get_dependencies(xml_file: Path, base_path: Path) -> set[str]:
    """
    Parses a MuJoCo XML file and returns a set of all files it depends on.
    """
    dependencies = set()
    try:
        tree = ET.parse(xml_file)
        root = tree.getroot()
    except (ET.ParseError, FileNotFoundError):
        return dependencies

    # Find all <include file="..."/> tags
    for include_tag in root.findall(".//include"):
        dependency = include_tag.get("file")
        if dependency:
            dependency_path = (xml_file.parent / dependency).resolve()
            dependencies.add(str(dependency_path.relative_to(base_path)))
            dependencies.update(get_dependencies(dependency_path, base_path))

    # Find all <mesh file="..."/> tags
    for mesh_tag in root.findall(".//mesh"):
        dependency = mesh_tag.get("file")
        if dependency:
            dependency_path = (xml_file.parent / dependency).resolve()
            dependencies.add(str(dependency_path.relative_to(base_path)))

    # Find all <texture file="..."/> tags
    for texture_tag in root.findall(".//texture"):
        dependency = texture_tag.get("file")
        if dependency:
            dependency_path = (xml_file.parent / dependency).resolve()
            dependencies.add(str(dependency_path.relative_to(base_path)))

    return dependencies


def generate_index(root_xml_file):
    """Generates an index of all files required by a root XML file."""
    xml_file = _HERE / root_xml_file
    base_path = xml_file.parent
    all_dependencies = get_dependencies(xml_file, base_path)
    all_dependencies.add(str(xml_file.relative_to(base_path)))

    files_to_download = sorted(list(all_dependencies))
    with open(base_path / "index.json", mode="w") as f:
        json.dump(files_to_download, f, indent=2)


if __name__ == "__main__":
    # Example: RB-Y1
    generate_index("models/rby1a/mujoco/model.xml")

    # Example: Unitree G1
    generate_index("models/unitree_g1/g1.xml")
