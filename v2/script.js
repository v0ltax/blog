document.addEventListener('DOMContentLoaded', () => {
    // 💥 RUTA DEFINITIVA DEL FEED DE MEDIUM para @voltax 💥
    const MEDIUM_USERNAME = "@voltax";
    const RSS_PROXY_URL = `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/${MEDIUM_USERNAME}`;

    const postsListContainer = document.getElementById('posts-list');
    postsListContainer.innerHTML = '<p>Cargando posts desde Medium...</p>';

    fetch(RSS_PROXY_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se pudo conectar al Feed de Medium.`);
            }
            return response.json();
        })
        .then(data => {
            postsListContainer.innerHTML = ''; 

            if (data.status !== 'ok' || !data.items || data.items.length === 0) {
                postsListContainer.innerHTML = '<p>No se encontraron posts en la cuenta de Medium.</p>';
                return;
            }

            // data.items contiene la lista de tus posts
            data.items.slice(0, 5).forEach(post => { // Mostramos solo los últimos 5
                const postElement = document.createElement('article');
                postElement.classList.add('post-summary');
                
                // Limpiamos el HTML del snippet de Medium para el resumen
                const summary = post.content.substring(0, 200).replace(/<[^>]*>?/gm, '') + '...';

                postElement.innerHTML = `
                    <h3><a href="${post.link}" target="_blank">${post.title}</a></h3>
                    <p class="post-meta">
                        <span class="post-date">${new Date(post.pubDate).toLocaleDateString('es-AR')}</span>
                        <span class="post-author">por ${post.author}</span>
                    </p>
                    <div class="post-body">
                        <p>${summary}</p>
                    </div>
                    <a href="${post.link}" target="_blank" class="read-more-link">Continuar lectura &rarr;</a>
                `;
                postsListContainer.appendChild(postElement);
            });
        })
        .catch(error => {
            console.error("Error al cargar el feed RSS:", error);
            postsListContainer.innerHTML = `<p>Error crítico al cargar los posts: ${error.message}</p>`;
        });
});