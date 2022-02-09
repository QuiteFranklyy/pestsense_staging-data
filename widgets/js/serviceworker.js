// Service worker file for PWA
var CACHE_NAME = 'Sensahub-v5';
var urlsToCache = [
    '/index.html'
];

self.addEventListener('install', function (event) {
    // console.log(JSON.stringify(event));
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                // console.log('Opened cache');
                return cache.addAll(urlsToCache);
            }).catch(_ => {
                // console.log("Failed to install cache");
            })
    );
});

self.addEventListener('fetch', event => {
    // console.log(JSON.stringify(event));
    event.respondWith(
        fetch(event.request).then(response => {
            // console.log("opening cache1");
            cache.put(event.request, response.clone());
            return response;
        }).catch(_ => {
            // console.log("failed to fetch cache");
            return caches.match(event.request);
        })
    )
});