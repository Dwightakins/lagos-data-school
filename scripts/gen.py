import os, base64

base = r"C:\Users\USER\Desktop\lagos-data-school"

def w(path, content):
    os.makedirs(os.path.dirname(os.path.join(base, path)), exist_ok=True)
    with open(os.path.join(base, path), "w", encoding="utf-8") as f:
        f.write(content)

print("generator loaded")