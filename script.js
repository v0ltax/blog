document.addEventListener('DOMContentLoaded', () => {
    // 1. Apuntamos al archivo JSON que contiene la lista
    const MANIFEST_FILE = 'posts/posts.json';

    const postsSection = document.querySelector('.posts-section .post-list-container');
    const postsData = [];

    // Esta función no cambia (procesa y renderiza el contenido Markdown)
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
            const manifestResponse = await fetch(MANIFEST_FILE);
            if (!manifestResponse.ok) {
                throw new Error("No se encontró el manifiesto de posts.");
            }
            fileList = await manifestResponse.json();
            
        } catch (error) {
            console.error("Error al cargar la lista de posts:", error);
            postsSection.innerHTML = "<p>No se pudo obtener la lista de posts. Asegurate de que `posts/posts.json` exista.</p>";
            return;
        }


        // --- PASO 2: Descargar cada archivo .md de la lista ---
        const fetchPromises = fileList.map(filename => {
            const filePath = `posts/${filename}`; // Creamos la ruta completa
            
            return fetch(filePath)
                .then(response => response.text())
                .then(text => {
                    // (La lógica para extraer metadata sigue siendo la misma)
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
                                metadata[key.trim()] = value.join(':').trim();
                            }
                        } else {
                            markdownContent += line + '\n';
                        }
                    }
                    
                    return {
                        markdownContent,
                        metadata,
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
            console.error("Hubo un error al procesar un post .md:", error);
            postsSection.innerHTML += `<p>Error al procesar algunos posts. Revise el formato.</p>`;
        }
    };

    loadPosts();
});