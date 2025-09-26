document.addEventListener('DOMContentLoaded', () => {
    // La etiqueta <base> en el HTML ahora se encarga de la ruta del repositorio.
    // Solo necesitamos las rutas relativas a la carpeta raíz del proyecto.
    const MANIFEST_FILE = 'posts/posts.json'; 

    const postsSection = document.querySelector('.posts-section .post-list-container');
    const postsData = [];

    // Función para procesar y renderizar un post
    const renderPost = (markdownContent, metadata) => {
        const postElement = document.createElement('article');
        postElement.classList.add('post');

        const metaHTML = `
            <p class="post-meta">
                <span class="post-date">${metadata.fecha}</span>
                <span class="post-author">por ${metadata.autor}</span>
            </p>
        `;

        const htmlContent = marked.parse(markdownContent);
        postElement.innerHTML = metaHTML + `<div class="post-body">${htmlContent}</div>`;
        return postElement;
    };

    const loadPosts = async () => {
        let fileList = [];
        
        // --- PASO 1: Descargar la lista de archivos (el manifiesto) ---
        try {
            // El fetch ahora usa la base correcta gracias a la etiqueta <base>
            const manifestResponse = await fetch(MANIFEST_FILE);
            if (!manifestResponse.ok) {
                // Si falla aquí, es que posts.json no está o la BASE_HREF está mal escrita.
                throw new Error("No se encontró el manifiesto de posts.");
            }
            fileList = await manifestResponse.json();
            
        } catch (error) {
            console.error("Error al cargar la lista de posts:", error);
            postsSection.innerHTML = "<p>Hubo un problema al cargar la lista de posts. Asegurate de que posts.json exista y la etiqueta &lt;base&gt; sea correcta.</p>";
            return;
        }

        // --- PASO 2: Descargar cada archivo .md de la lista ---
        const fetchPromises = fileList.map(filename => {
            // La ruta es simplemente relativa a la carpeta posts/
            const filePath = `posts/${filename}`; 
            
            return fetch(filePath)
                .then(response => {
                    if (!response.ok) {
                         // Si falla aquí, es que el .md específico no se encontró
                         throw new Error(`Error al cargar el archivo: ${filename}`);
                    }
                    return response.text();
                })
                .then(text => {
                    // Lógica para extraer metadata (asegurate de que haya metadata en el .md)
                    const lines = text.split('\n');
                    let metadata = {};
                    let markdownContent = '';
                    let inMetadata = false;
                    let metadataEndFound = false;

                    for (const line of lines) {
                        if (line.trim() === '---') {
                            if (!metadataEndFound) {
                                inMetadata = !inMetadata;
                                if (!inMetadata) metadataEndFound = true;
                                continue;
                            }
                        }
                        if (inMetadata) {
                            const [key, ...value] = line.split(':');
                            if (key && value.length) {
                                metadata[key.trim().toLowerCase()] = value.join(':').trim(); // Pasamos la clave a minúscula
                            }
                        } else {
                            markdownContent += line + '\n';
                        }
                    }
                    
                    return {
                        markdownContent,
                        metadata,
                        // Usamos la clave 'fecha' de la metadata
                        date: new Date(metadata.fecha) 
                    };
                });
        });

        // --- PASO 3: Esperar, ordenar y renderizar ---
        try {
            const loadedPosts = await Promise.all(fetchPromises);
            postsData.push(...loadedPosts);
            
            // Ordenamiento cronológico (Del más nuevo al más viejo)
            postsData.sort((a, b) => b.date - a.date);
            
            postsData.forEach(post => {
                const postElement = renderPost(post.markdownContent, post.metadata);
                postsSection.appendChild(postElement);
            });
            
        } catch (error) {
            console.error("Hubo un error al procesar un post:", error);
            postsSection.innerHTML += `<p>Error al procesar: ${error.message}</p>`;
        }
    };

    loadPosts();
});