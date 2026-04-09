import os
import sys
import subprocess
import time

def kill_processes():
    """Kill all processes related to the project"""
    print("🔪 Killing existing processes...")
    
    # Kill processes on common ports
    try:
        # Kill port 8000 (backend)
        subprocess.run(['taskkill', '/F', '/IM', 'python.exe'], capture_output=True)
        subprocess.run(['netstat', '-ano'], capture_output=True)
        
        # Kill port 5173 (frontend)
        subprocess.run(['taskkill', '/F', '/IM', 'node.exe'], capture_output=True)
        
        print("✅ Processes killed")
    except Exception as e:
        print(f"⚠️  Could not kill some processes: {e}")

def cleanup_files():
    """Clean up all project files"""
    print("🧹 Cleaning up project files...")
    
    backend_dir = "c:\\Users\\ravin\\OneDrive\\Desktop\\Operon\\backend"
    frontend_dir = "c:\\Users\\ravin\\OneDrive\\Desktop\\Operon\\frontend"
    
    # Remove database file
    db_file = os.path.join(backend_dir, "procura.db")
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print(f"✅ Removed {db_file}")
        except:
            print(f"⚠️  Could not remove {db_file}")
    
    # Remove node_modules
    node_modules = os.path.join(frontend_dir, "node_modules")
    if os.path.exists(node_modules):
        try:
            import shutil
            shutil.rmtree(node_modules)
            print(f"✅ Removed {node_modules}")
        except:
            print(f"⚠️  Could not remove {node_modules}")
    
    # Remove dist folder
    dist_folder = os.path.join(frontend_dir, "dist")
    if os.path.exists(dist_folder):
        try:
            shutil.rmtree(dist_folder)
            print(f"✅ Removed {dist_folder}")
        except:
            print(f"⚠️  Could not remove {dist_folder}")
    
    # Remove package-lock.json
    package_lock = os.path.join(frontend_dir, "package-lock.json")
    if os.path.exists(package_lock):
        try:
            os.remove(package_lock)
            print(f"✅ Removed {package_lock}")
        except:
            print(f"⚠️  Could not remove {package_lock}")

def main():
    print("🔄 Complete Operon Project Reset")
    print("=" * 50)
    
    kill_processes()
    time.sleep(2)
    
    cleanup_files()
    
    print("\n✅ Cleanup complete!")
    print("\n📋 Next Steps:")
    print("1. Close this terminal")
    print("2. Open a new terminal")
    print("3. Navigate to backend and run: python -m venv myenv")
    print("4. Activate: .\\myenv\\Scripts\\activate")
    print("5. Install: pip install -r requirements.txt")
    print("6. Start backend: python -m uvicorn main:app --reload --port 8000")
    print("7. Open another terminal for frontend")
    print("8. Navigate to frontend and run: npm install")
    print("9. Start frontend: npm run dev")
    print("10. Open browser: http://localhost:5173")

if __name__ == "__main__":
    main()
