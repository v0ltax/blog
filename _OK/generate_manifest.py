import json
from pathlib import Path

posts_dir = Path('posts')
manifest_file = posts_dir / 'posts.json'

# Esto es clave: asegurarse de que solo itera sobre el directorio de posts
file_list = [f.name for f in posts_dir.iterdir() if f.suffix == '.md']
file_list.sort(reverse=True)

with open(manifest_file, 'w', encoding='utf-8') as f:
    json.dump(file_list, f, indent=2)

print(f"Manifiesto de posts generado correctamente en: {manifest_file}")