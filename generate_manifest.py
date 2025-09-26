import json
from pathlib import Path

# Definimos las carpetas y el nombre del archivo manifiesto
posts_dir = Path('posts')
manifest_file = posts_dir / 'posts.json'

# Obtenemos una lista de todos los archivos .md en la carpeta 'posts'
# Usamos .iterdir() para obtener solo el nombre de los archivos en la carpeta posts/
file_list = [f.name for f in posts_dir.iterdir() if f.suffix == '.md']
file_list.sort(reverse=True) # Ordena del más nuevo al más viejo (si el nombre es con fecha)

# Guardamos la lista como un archivo JSON
# El indent=2 es para que sea legible
with open(manifest_file, 'w', encoding='utf-8') as f:
    json.dump(file_list, f, indent=2)

print(f"Manifiesto de posts generado correctamente en: {manifest_file}")