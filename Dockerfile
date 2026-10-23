FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html web-tv.html catalog.json tvmorph.png SHA256SUMS.txt /usr/share/nginx/html/
COPY *.apk /usr/share/nginx/html/
EXPOSE 80
