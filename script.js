document.addEventListener('DOMContentLoaded', () => {
    const GITHUB_USERNAME = "v0ltax"; // Tu nombre de usuario de GitHub
    const REPO_NAME = "blog";
    const POSTS_MANIFEST = `https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/posts/posts.json`; 
    // ...
    // 1. SELECTORES Y RUTAS
    const POSTS_MANIFEST = 'posts/posts.json';
    const postsListContainer = document.getElementById('posts-list');
    
    // Selectores del Modal (Overlay)
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // 2. FUNCIÓN PARA CERRAR MODAL
    const closeModal = () => {
        modalOverlay.style.display = 'none';
        modalContent.innerHTML = ''; // Limpiamos el contenido
    };
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') {
            closeModal(); // Cierra si se hace clic fuera de la caja de contenido
        }
    });


    // 3. FUNCIÓN PARA ABRIR Y CARGAR CONTENIDO COMPLETO (Overlay)
    const loadFullPost = async (filename) => {
        modalOverlay.style.display = 'flex';
        modalContent.innerHTML = '<h2>Cargando...</h2>';

        const filePath = `posts/${filename}`;
        
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Error 404: No se encontró el archivo ${filename}`);
            }
            const markdownText = await response.text();
            
            // Lógica para extraer metadata y contenido (similar a la versión anterior)
            let metadata = {};
            let markdownContent = '';
            let inMetadata = false;
            
            const lines = markdownText.split('\n');
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

            // Renderizar el contenido completo en el modal
            const htmlContent = marked.parse(markdownContent);
            modalContent.innerHTML = `
                <h1 class="post-title">${metadata.titulo || filename}</h1>
                <p class="post-meta">Publicado el ${metadata.fecha} por ${metadata.autor}</p>
                <div class="post-body">${htmlContent}</div>
            `;

        } catch (error) {
            modalContent.innerHTML = `<h2>Error al cargar el post.</h2><p>${error.message}</p>`;
            console.error(error);
        }
    };


    // 4. FUNCIÓN PRINCIPAL DE CARGA Y RENDERIZADO
    const loadPostsManifest = async () => {
        postsListContainer.innerHTML = '<p>Cargando lista de posts...</p>';
        try {
            const manifestResponse = await fetch(POSTS_MANIFEST);
            if (!manifestResponse.ok) {
                throw new Error("No se pudo cargar el manifiesto de posts. Revisa GitHub Actions.");
            }
            const fileList = await manifestResponse.json();

            postsListContainer.innerHTML = ''; // Limpiamos el cargador

            fileList.forEach(filename => {
                const postElement = document.createElement('article');
                postElement.classList.add('post-summary');
                
                // Aquí podrías cargar solo la metadata si la necesitaras, 
                // pero por simplicidad, hacemos un link directo.
                
                const postTitle = filename.replace('.md', '').replace(/\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' ');

                postElement.innerHTML = `
                    <h3>${postTitle}</h3>
                    <p>Haga clic para leer en la ventana emergente.</p>
                    <a href="#" data-filename="${filename}">Leer Post Completo</a>
                `;

                // Añadimos el evento para cargar el post en el modal
                postElement.querySelector('a').addEventListener('click', (e) => {
                    e.preventDefault();
                    loadFullPost(filename);
                });

                postsListContainer.appendChild(postElement);
            });

        } catch (error) {
            console.error("Error al cargar el manifiesto:", error);
            postsListContainer.innerHTML = `<p>Error crítico: ${error.message}</p>`;
        }
    };

    loadPostsManifest();
});