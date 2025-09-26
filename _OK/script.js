document.addEventListener('DOMContentLoaded', () => {
    // 1. SELECTORES Y RUTAS
    const POSTS_MANIFEST = 'posts/posts.json';
    const postsListContainer = document.getElementById('posts-list');
    
    // Selectores del Modal (Overlay)
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // 2. FUNCIÓN PARA LEER METADATA Y RESUMEN
    // Esta función lee el encabezado YAML (---) de un archivo .md y el primer párrafo
    const parsePostData = (markdownText) => {
        let metadata = {};
        let content = '';
        let inMetadata = false;
        
        const lines = markdownText.split('\n');
        let metadataEndFound = false;
        let readingSummary = true;
        let summaryLines = [];

        for (const line of lines) {
            if (line.trim() === '---') {
                inMetadata = !inMetadata;
                if (!inMetadata) metadataEndFound = true;
                continue;
            }
            
            if (inMetadata) {
                const [key, ...value] = line.split(':');
                if (key && value.length) {
                    metadata[key.trim()] = value.join(':').trim().replace(/^['"]|['"]$/g, ''); // Limpiar comillas
                }
            } else if (metadataEndFound) {
                // Leer el resumen (el primer párrafo después de la metadata)
                if (readingSummary) {
                    if (line.trim() !== '') {
                        summaryLines.push(line);
                    } else if (summaryLines.length > 0) {
                        readingSummary = false; // El primer espacio en blanco termina el resumen
                    }
                }
                content += line + '\n';
            }
        }
        
        // El resumen es la primera parte del contenido
        const summary = summaryLines.join(' ').substring(0, 180).trim() + '...';

        return { metadata, content, summary };
    };


    // 3. FUNCIÓN PARA CERRAR MODAL
    const closeModal = () => {
        modalOverlay.style.display = 'none';
        modalContent.innerHTML = ''; 
    };
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') {
            closeModal();
        }
    });


    // 4. FUNCIÓN PARA ABRIR Y CARGAR CONTENIDO COMPLETO (Overlay)
    const loadFullPost = async (filename) => {
        modalOverlay.style.display = 'flex';
        modalContent.innerHTML = '<h2>Cargando...</h2>';

        const filePath = `posts/${filename}`;
        
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se encontró el archivo ${filename}`);
            }
            const markdownText = await response.text();
            
            const { metadata, content } = parsePostData(markdownText);
            
            // Renderizar el contenido completo en el modal
            const htmlContent = marked.parse(content);
            modalContent.innerHTML = `
                <p class="post-meta-modal">${metadata.autor || 'Voltax'} | ${metadata.fecha || 'Sin fecha'}</p>
                <h1 class="post-title-modal">${metadata.titulo || filename}</h1>
                <div class="post-body-modal">${htmlContent}</div>
            `;

        } catch (error) {
            modalContent.innerHTML = `<h2>Error al cargar el post.</h2><p>${error.message}</p>`;
            console.error(error);
        }
    };


    // 5. FUNCIÓN PRINCIPAL DE CARGA Y RENDERIZADO
    const loadPostsManifest = async () => {
        postsListContainer.innerHTML = '<p>Cargando lista de posts...</p>';
        try {
            const manifestResponse = await fetch(POSTS_MANIFEST);
            if (!manifestResponse.ok) {
                throw new Error("No se pudo cargar el manifiesto de posts.");
            }
            const fileList = await manifestResponse.json();

            // 5a. Crear un array de promesas para cargar TODOS los archivos MD a la vez
            const fetchPromises = fileList.map(filename => 
                fetch(`posts/${filename}`).then(res => res.text())
            );

            // 5b. Esperar a que todos los archivos se descarguen
            const allMarkdownTexts = await Promise.all(fetchPromises);
            postsListContainer.innerHTML = ''; 

            allMarkdownTexts.forEach((markdownText, index) => {
                const filename = fileList[index];
                const { metadata, summary } = parsePostData(markdownText);

                const postElement = document.createElement('article');
                postElement.classList.add('post-summary');
                
                postElement.innerHTML = `
                    <h3>${metadata.titulo || filename}</h3>
                    <p class="post-meta">
                        ${metadata.autor || 'Voltax'} &bull; ${metadata.fecha || 'Sin fecha'}
                    </p>
                    <p class="post-resumen">${summary}</p>
                    <a href="#" data-filename="${filename}" class="read-more-link">Leer Post Completo</a>
                `;

                // Añadimos el evento para cargar el post en el modal
                postElement.querySelector('.read-more-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    loadFullPost(filename);
                });

                postsListContainer.appendChild(postElement);
            });

        } catch (error) {
            console.error("Error al cargar y procesar los posts:", error);
            postsListContainer.innerHTML = `<p>Error crítico al cargar los posts: ${error.message}. Verifica que el archivo .nojekyll exista.</p>`;
        }
    };

    loadPostsManifest();
});