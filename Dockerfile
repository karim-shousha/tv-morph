FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY launcher-guide.html launcher-help.js index.html landing.css landing.js gallery.js web-tv.html catalog.json tvmorph.png SHA256SUMS.txt /usr/share/nginx/html/
COPY Morph-TV-*.apk /usr/share/nginx/html/
COPY lg-install.html lg-preview-validation.json release-notes-0.8.81.json release-notes-0.8.82.json release-notes-0.8.83.json support-links.json Morph-TV-LG-Preview-0.1.2.ipk /usr/share/nginx/html/
COPY site-assets /usr/share/nginx/html/site-assets/
COPY theme-packs /usr/share/nginx/html/theme-packs/
EXPOSE 80
