FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY launcher-guide.html launcher-help.js index.html web-tv.html catalog.json tvmorph.png SHA256SUMS.txt /usr/share/nginx/html/
COPY *.apk /usr/share/nginx/html/
COPY vidaa.html vidaa-install.html vidaa-manifest.json TV-Morph-VIDAA-0.1.0-web.zip TV-Morph-VIDAA-0.1.1-web.zip /usr/share/nginx/html/
COPY theme-packs /usr/share/nginx/html/theme-packs/
EXPOSE 80
