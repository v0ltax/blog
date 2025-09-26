document.addEventListener('DOMContentLoaded', () => {
    // 1. SELECTORES Y RUTAS
    const POSTS_MANIFEST = 'posts/posts.json';
    const postsListContainer = document.getElementById('posts-list');
    
    // Selectores del Modal (Overlay)
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    // Selectores del botón "Ir Arriba"
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');

    // 2. FUNCIÓN PARA LEER METADATA Y RESUMEN
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
                    metadata[key.trim()] = value.join(':').trim().replace(/^['"]|['"]$/g, '');
                }
            } else if (metadataEndFound) {
                if (readingSummary) {
                    if (line.trim() !== '' && !line.trim().startsWith('#')) {
                        summaryLines.push(line);
                    } else if (summaryLines.length > 0) {
                        readingSummary = false; 
                    }
                }
                content += line + '\n';
            }
        }
        
        const summary = summaryLines.join(' ').substring(0, 180).trim() + '...';

        return { metadata, content, summary };
    };


    // 3. FUNCIÓN PARA CERRAR MODAL (con fade out)
    const closeModal = () => {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            modalOverlay.style.display = 'none'; 
            modalContent.innerHTML = ''; 
        }, 300); 
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
        
        setTimeout(() => {
            modalOverlay.classList.add('active');
        }, 10);
        
        modalContent.innerHTML = '<h2>Cargando...</h2>';

        const filePath = `posts/${filename}`;
        
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se encontró el archivo ${filename}`);
            }
            const markdownText = await response.text();
            
            const { metadata, content } = parsePostData(markdownText);
            
            const htmlContent = marked.parse(content);
            modalContent.innerHTML = `
                <p class="post-meta-modal">${metadata.autor || 'Voltax'} | ${metadata.fecha || 'Sin fecha'}</p>
                <h1 class="post-title-modal">${metadata.titulo || filename}</h1>
                <div class="post-body-modal">${htmlContent}</div>
            `;
            
            modalOverlay.scrollTop = 0;

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

            const fetchPromises = fileList.map(filename => 
                fetch(`posts/${filename}`).then(res => res.text())
            );

            const allMarkdownTexts = await Promise.all(fetchPromises);
            postsListContainer.innerHTML = ''; 

            allMarkdownTexts.forEach((markdownText, index) => {
                const filename = fileList[index];
                const { metadata, summary } = parsePostData(markdownText);

                const postElement = document.createElement('article');
                postElement.classList.add('post-summary');
                
                postElement.innerHTML = `
                    <h3 class="post-title-link" data-filename="${filename}">${metadata.titulo || filename}</h3>
                    <p class="post-meta">
                        ${metadata.autor || 'Voltax'} &bull; ${metadata.fecha || 'Sin fecha'}
                    </p>
                    <p class="post-resumen">${summary}</p>
                    <a href="#" data-filename="${filename}" class="read-more-link">Leer Post Completo</a>
                `;
                
                // Listener para el click en el Título (h3)
                postElement.querySelector('.post-title-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    loadFullPost(filename);
                });

                // Listener para el enlace "Leer Post Completo"
                postElement.querySelector('.read-more-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    loadFullPost(filename);
                });

                postsListContainer.appendChild(postElement);
            });

        } catch (error) {
            console.error("Error al cargar y procesar los posts:", error);
            postsListContainer.innerHTML = `<p>Error crítico al cargar los posts: ${error.message}. Verifica el archivo .nojekyll.</p>`;
        }
    };

    loadPostsManifest();

    // ===========================================
    // LÓGICA DE SCROLL SUAVE (Botones de menú y Logo)
    // ===========================================

    // Función genérica para manejar el scroll suave con ajuste de offset
    const smoothScroll = (e) => {
        const targetId = e.currentTarget.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            e.preventDefault();
            // Ajuste de offset de 70px para compensar el header fijo
            const offset = 70; 
            const targetPosition = targetElement.offsetTop - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        } else if (targetId === 'top') {
             e.preventDefault();
             window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    // Aplicar scroll suave al logo (href="#top") y al enlace Posts (href="#posts-section")
    const navLinks = document.querySelectorAll('.nav-list a[href^="#"], .logo[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', smoothScroll);
    });
    
    // ===========================================
    // LÓGICA DEL BOTÓN "IR ARRIBA"
    // ===========================================

    // 1. Mostrar/Ocultar el botón
    window.addEventListener('scroll', () => {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    });

    // 2. Funcionalidad de scroll suave
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' 
        });
    });
    // ===========================================
});