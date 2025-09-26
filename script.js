document.addEventListener('DOMContentLoaded', () => {
    // URL del API Proxy para convertir el Feed RSS de Medium de @voltax a JSON.
    const RSS_PROXY_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@voltax';

    const postsSection = document.querySelector('.posts-section .post-list-container');
    postsSection.innerHTML = '<p>Cargando tus posts de Medium...</p>';

    fetch(RSS_PROXY_URL)
        .then(response => {
            if (!response.ok) {
                 // Si falla aquí, la API proxy tuvo un problema
                throw new Error(`No se pudo conectar al servicio de Feed. Estado: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            postsSection.innerHTML = ''; // Limpiamos el mensaje de carga

            if (data.status !== 'ok' || !data.items || data.items.length === 0) {
                postsSection.innerHTML = '<p>No se encontraron posts o el feed de Medium no está disponible.</p>';
                return;
            }

            // data.items contiene la lista de tus posts. Mostramos los últimos 5.
            data.items.slice(0, 5).forEach(post => { 
                const postElement = document.createElement('article');
                postElement.classList.add('post');
                
                // Medium devuelve el contenido con HTML. Lo limpiamos y limitamos a 200 caracteres para el resumen.
                const summary = post.content.substring(0, 200).replace(/<[^>]*>?/gm, '') + '...';

                postElement.innerHTML = `
                    <h3><a href="${post.link}" target="_blank">${post.title}</a></h3>
                    <p class="post-meta">
                        <span class="post-date">${new Date(post.pubDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        <span class="post-author">por ${post.author}</span>
                    </p>
                    <div class="post-body">
                        <p>${summary}</p>
                        <a href="${post.link}" target="_blank">Leer historia completa en Medium &rarr;</a>
                    </div>
                `;
                postsSection.appendChild(postElement);
            });
        })
        .catch(error => {
            console.error("Error al cargar el feed RSS:", error);
            postsSection.innerHTML = `<p>Error crítico al cargar los posts: ${error.message}. Verifica tu conexión o el nombre de usuario de Medium.</p>`;
        });
});