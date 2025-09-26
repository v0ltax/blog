import json
from pathlib import Path

# Definimos las carpetas y el nombre del archivo manifiesto
posts_dir = Path('posts')
manifest_file = posts_dir / 'posts.json'

# Obtenemos una lista de todos los archivos .md en la carpeta 'posts'
# Ordenamos la lista alfabéticamente (por lo que el nombre con fecha funciona bien)
file_list = [f.name for f in posts_dir.iterdir() if f.suffix == '.md']
file_list.sort(reverse=True) # Ordena del más nuevo al más viejo

# Creamos el diccionario que contendrá la lista de archivos
manifest_data = file_list

# Guardamos el diccionario como un archivo JSON
with open(manifest_file, 'w', encoding='utf-8') as f:
    json.dump(manifest_data, f, indent=2)

print(f"Manifiesto de posts generado correctamente en: {manifest_file}")
print(f"Archivos encontrados: {file_list}")