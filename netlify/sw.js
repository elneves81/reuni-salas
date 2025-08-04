// ==================== SERVICE WORKER PWA ====================

const CACHE_NAME = 'sala-livre-v1.0.3';
const STATIC_CACHE = 'sala-livre-static-v1.0.3';
const DYNAMIC_CACHE = 'sala-livre-dynamic-v1.0.3';

// Arquivos para cache estático
const STATIC_FILES = [
    '/dashboard.html',
    '/index.html',
    '/css/dashboard.css',
    '/css/login.css',
    '/js/dashboard.js',
    '/js/notifications.js',
    '/js/theme-manager.js',
    '/js/export-manager.js',
    '/js/global-search.js',
    '/js/login-netlify.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/6.1.8/index.global.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://accounts.google.com/gsi/client'
];

// Padrões de URL para cache dinâmico
const DYNAMIC_PATTERNS = [
    /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    /\.(?:js|css|html)$/,
    /^https:\/\/fonts\./,
    /^https:\/\/cdnjs\./,
    /^https:\/\/cdn\./
];

// Instalar Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache static files', error);
            })
    );
});

// Ativar Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Só processar requisições GET
    if (request.method !== 'GET') {
        return;
    }
    
    // Estratégia de cache baseada no tipo de recurso
    if (isStaticFile(request.url)) {
        // Cache First para arquivos estáticos
        event.respondWith(cacheFirst(request));
    } else if (isAPIRequest(url)) {
        // Network First para APIs
        event.respondWith(networkFirst(request));
    } else if (isDynamicAsset(request.url)) {
        // Stale While Revalidate para assets dinâmicos
        event.respondWith(staleWhileRevalidate(request));
    } else {
        // Network Only para outras requisições
        event.respondWith(fetch(request));
    }
});

// Estratégia Cache First
async function cacheFirst(request) {
    try {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        
        const response = await fetch(request);
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        console.error('Cache First failed:', error);
        return caches.match('/offline.html') || new Response('Offline');
    }
}

// Estratégia Network First
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        return new Response(JSON.stringify({ error: 'Network unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Estratégia Stale While Revalidate
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
        cache.put(request, response.clone());
        return response;
    }).catch(() => cached);
    
    return cached || fetchPromise;
}

// Verificar se é arquivo estático
function isStaticFile(url) {
    return STATIC_FILES.some(file => url.includes(file)) || 
           url.includes('/css/') || 
           url.includes('/js/') || 
           url.includes('/images/');
}

// Verificar se é requisição de API
function isAPIRequest(url) {
    return url.pathname.includes('/api/') || 
           url.pathname.includes('/.netlify/functions/') ||
           url.hostname.includes('api.');
}

// Verificar se é asset dinâmico
function isDynamicAsset(url) {
    return DYNAMIC_PATTERNS.some(pattern => pattern.test(url));
}

// Sincronização em Background
self.addEventListener('sync', event => {
    console.log('Service Worker: Background Sync', event.tag);
    
    switch (event.tag) {
        case 'background-sync-bookings':
            event.waitUntil(syncBookings());
            break;
        case 'background-sync-notifications':
            event.waitUntil(syncNotifications());
            break;
    }
});

// Notificações Push
self.addEventListener('push', event => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'Nova notificação do Sala Livre',
        icon: '/images/icon-192x192.png',
        badge: '/images/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver detalhes',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Fechar',
                icon: '/images/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Sala Livre', options)
    );
});

// Clique em notificação
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification click received');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/dashboard.html')
        );
    }
});

// Sincronizar reservas
async function syncBookings() {
    try {
        console.log('Service Worker: Syncing bookings...');
        
        // Recuperar dados offline do IndexedDB
        const offlineData = await getOfflineBookings();
        
        if (offlineData.length > 0) {
            // Enviar dados para servidor
            const response = await fetch('/.netlify/functions/sync-bookings', {
                method: 'POST',
                body: JSON.stringify(offlineData),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                // Limpar dados offline
                await clearOfflineBookings();
                console.log('Service Worker: Bookings synced successfully');
            }
        }
    } catch (error) {
        console.error('Service Worker: Failed to sync bookings', error);
    }
}

// Sincronizar notificações
async function syncNotifications() {
    try {
        console.log('Service Worker: Syncing notifications...');
        
        const response = await fetch('/.netlify/functions/get-notifications');
        const notifications = await response.json();
        
        // Mostrar notificações não lidas
        notifications.forEach(notification => {
            if (!notification.read) {
                self.registration.showNotification(notification.title, {
                    body: notification.message,
                    icon: '/images/icon-192x192.png',
                    tag: notification.id
                });
            }
        });
        
    } catch (error) {
        console.error('Service Worker: Failed to sync notifications', error);
    }
}

// Funções para IndexedDB (simuladas)
async function getOfflineBookings() {
    // Implementar acesso ao IndexedDB
    return [];
}

async function clearOfflineBookings() {
    // Implementar limpeza do IndexedDB
    return true;
}

// Mensagens do cliente
self.addEventListener('message', event => {
    console.log('Service Worker: Message received', event.data);
    
    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'CACHE_UPDATE':
            updateCache();
            break;
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;
    }
});

// Atualizar cache
async function updateCache() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(STATIC_FILES);
        console.log('Service Worker: Cache updated');
    } catch (error) {
        console.error('Service Worker: Failed to update cache', error);
    }
}

// Log de status
console.log('Service Worker: Script loaded successfully');
