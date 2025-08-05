import subprocess
import os
import shutil
import tempfile
from pathlib import Path

# --- Configuration ---
GIT_REPO_URL = "https://github.com/RainbowRobotics/rby1-sdk.git"
# The path within the repository to download. This will checkout the full path.
REPO_SUB_PATH = "models/rby1a/mujoco"
# The root destination directory for the downloaded files.
DESTINATION_ROOT = Path("static/models")

def run_command(command, cwd):
    """Runs a command in a specified directory and checks for errors."""
    print(f"Running command: {' '.join(command)} in {cwd}")
    try:
        result = subprocess.run(command, cwd=cwd, check=True, capture_output=True, text=True, timeout=300)
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr)
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {' '.join(command)}")
        print(e.stderr)
        raise

def main():
    """
    Downloads or updates the specified folder from the git repository
    using sparse checkout.
    """
    # The final destination path for the 'rby1a' folder
    # This will result in `static/models/rby1a/mujoco`
    dest_path = DESTINATION_ROOT / "rby1a"

    # If the destination directory already exists, remove it for a clean update.
    if dest_path.exists():
        print(f"Removing existing directory for update: {dest_path}")
        shutil.rmtree(dest_path)

    with tempfile.TemporaryDirectory() as temp_dir_str:
        temp_dir = Path(temp_dir_str)
        repo_clone_path = temp_dir / "rby1-sdk"

        print(f"Cloning into temporary directory: {repo_clone_path}")

        # 1. Clone the repository with sparse checkout enabled
        run_command([
            "git", "clone", "--depth", "1", "--filter=blob:none", "--sparse",
            GIT_REPO_URL, str(repo_clone_path)
        ], cwd=".")

        # 2. Set the sparse checkout path to get only the files we need
        run_command(["git", "sparse-checkout", "set", REPO_SUB_PATH], cwd=repo_clone_path)

        # The source path of the 'rby1a' folder inside the cloned repo
        source_path = repo_clone_path / "models" / "rby1a"

        # 3. Move the 'rby1a' folder to the final destination
        print(f"Moving {source_path} to {dest_path}")
        shutil.move(str(source_path), str(dest_path))

    print("\nDownload and setup complete.")
    print(f"The '{REPO_SUB_PATH}' content has been placed in '{dest_path}'.")

if __name__ == "__main__":
    main()
