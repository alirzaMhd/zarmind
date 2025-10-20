import os

# directory containing your HTML/CSS/JS files
input_dir = "./"   # change if needed
output_file = "html_files.txt"

with open(output_file, "w", encoding="utf-8") as out:
    for root, dirs, files in os.walk(input_dir):
        for filename in files:
            if filename.endswith((
                                "authController.ts",
                                "authService.ts",
                                'auth.middleware.ts', 
                                'auth.routes.ts', 
                                'error.middleware.ts', 
                                'User.ts',
                                
                                )):
                filepath = os.path.join(root, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    # escape single quotes so it stays valid
                    content = content.replace("'", "\\'")
                    # use relative path instead of just filename
                    rel_path = os.path.relpath(filepath, input_dir)
                    out.write(f"{rel_path} = '{content}'\n\n")

print(f"Done ✅ Saved to {output_file}")
