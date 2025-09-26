document.addEventListener('DOMContentLoaded', () => {
    const postFiles = [
        'posts/2025-09-22-mi-primer-post.md',
        'posts/2025-09-21-otro-post-copado.md'
    ];

    const postsSection = document.querySelector('.posts-section .post-list-container');
    const postsData = [];

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
        const fetchPromises = postFiles.map(file => {
            return fetch(file)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error al cargar el archivo: ${response.statusText}`);
                    }
                    return response.text();
                })
                .then(text => {
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

        try {
            const loadedPosts = await Promise.all(fetchPromises);
            postsData.push(...loadedPosts);
            postsData.sort((a, b) => b.date - a.date);
            postsData.forEach(post => {
                const postElement = renderPost(post.markdownContent, post.metadata);
                postsSection.appendChild(postElement);
            });
        } catch (error) {
            console.error("No se pudieron cargar los posts:", error);
            postsSection.innerHTML = "<p>Hubo un problema al cargar los posts. Verificá que los archivos y las rutas sean correctas.</p>";
        }
    };

    loadPosts();
});