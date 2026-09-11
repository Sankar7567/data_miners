#!/usr/bin/env python3
import sys
import subprocess
from pathlib import Path

target_script = Path(__file__).resolve().parent / "cmpdi-ai-reporting" / "run_demo.py"
if target_script.exists():
    sys.exit(subprocess.call([sys.executable, str(target_script)] + sys.argv[1:]))
else:
    print(f"Error: {target_script} not found.")
    sys.exit(1)
