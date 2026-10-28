FROM nginx:stable-alpine
RUN apk add --no-cache python3
COPY community/server.py community/plus.py community/start.sh /opt/morph-community/
RUN chmod 755 /opt/morph-community/start.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY launcher-guide.html launcher-help.js index.html landing.css landing.js gallery.js web-tv.html catalog.json tvmorph.png SHA256SUMS.txt /usr/share/nginx/html/
COPY Morph-TV-*.apk /usr/share/nginx/html/
COPY lg-install.html lg-preview-validation.json release-notes-0.8.81.json release-notes-0.8.82.json release-notes-0.8.83.json release-notes-0.8.84.json release-notes-0.8.85.json release-notes-0.8.92.json release-notes-0.8.93.json release-notes-0.8.94.json release-notes-0.8.95.json release-notes-0.8.96.json release-notes-0.8.97.json release-notes-0.8.98.json release-notes-0.8.99.json release-notes-0.8.100.json release-notes-0.8.101.json release-notes-0.8.102.json release-notes-0.8.103.json release-notes-0.8.104.json release-notes-0.8.105.json release-notes-0.8.106.json release-notes-0.8.107.json release-notes-0.8.108.json release-notes-0.8.109.json release-notes-0.8.110.json release-notes-0.8.111.json release-notes-0.8.112.json release-notes-0.8.113.json release-notes-0.8.114.json release-notes-0.8.165.json support-links.json Morph-TV-LG-0.8.165.ipk /usr/share/nginx/html/
COPY site-assets /usr/share/nginx/html/site-assets/
COPY theme-packs /usr/share/nginx/html/theme-packs/
COPY theme-previews /usr/share/nginx/html/theme-previews/
COPY plus.html plus-purchase.js community.js community-admin.html community-admin.js /usr/share/nginx/html/
COPY robots.txt sitemap.xml plus-admin.html plus-admin.js plus-admin.css /usr/share/nginx/html/
RUN nginx -t
VOLUME /data
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1/api/community/health', timeout=3).read()" || exit 1
EXPOSE 80
CMD ["/opt/morph-community/start.sh"]

COPY google7e2785317cb0458c.html /usr/share/nginx/html/

COPY install.html Morph-TV-Samsung-Computer-0.8.165.zip Morph-TV-Install-Kit-0.8.165.zip /usr/share/nginx/html/

COPY fitness-music /usr/share/nginx/html/fitness-music/

COPY Morph-TV-Samsung-Tizen4-Computer-0.8.165.zip /usr/share/nginx/html/

COPY install-helper.html install-helper.js install-helper.css release-notes-0.8.127.json /usr/share/nginx/html/

COPY plus-offer.css plus-offer.js /usr/share/nginx/html/

COPY release-notes-0.8.165.json /usr/share/nginx/html/
