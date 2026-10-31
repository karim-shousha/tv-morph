FROM nginx:stable-alpine
RUN apk add --no-cache python3
COPY community/server.py community/plus.py community/start.sh /opt/morph-community/
RUN chmod 755 /opt/morph-community/start.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY SHA256SUMS.txt catalog.json community-admin.html community-admin.js community.js gallery.js google7e2785317cb0458c.html index.html install-helper.css install-helper.html install-helper.js install.html landing.css landing.js launcher-guide.html launcher-help.js lg-install.html lg-preview-validation.json plus-admin.css plus-admin.html plus-offer.css plus-offer.js plus-purchase.js plus.html robots.txt samsung-computer.html samsung-pc-guide.js samsung-phone-install.html sitemap.xml support-links.json tvmorph.png web-tv.html Morph-TV-Phone-0.8.247.apk Morph-TV-Android-TV-0.8.247.apk Morph-TV-LG-0.8.247.ipk Morph-TV-Samsung-Tizen5-0.8.247.wgt Morph-TV-Samsung-Tizen4-0.8.247.wgt Morph-TV-Legacy-0.1.2.apk /usr/share/nginx/html/
COPY fitness-music/ /usr/share/nginx/html/fitness-music/
COPY site-assets/ /usr/share/nginx/html/site-assets/
COPY theme-packs/ /usr/share/nginx/html/theme-packs/
COPY theme-previews/ /usr/share/nginx/html/theme-previews/
COPY test-releases/20261031-tizen2-lite-0.8.219/Morph-TV-Tizen2-Lite-0.8.219-candidate.wgt /usr/share/nginx/html/test-releases/20261031-tizen2-lite-0.8.219/Morph-TV-Tizen2-Lite-0.8.219-candidate.wgt
COPY test-releases/20261031-tizen3-lite-0.8.190/Morph-TV-Tizen3-Lite-0.8.190-candidate.wgt /usr/share/nginx/html/test-releases/20261031-tizen3-lite-0.8.190/Morph-TV-Tizen3-Lite-0.8.190-candidate.wgt
COPY test-releases/20261031-tizen2-lite-0.8.219/README.md test-releases/20261031-tizen2-lite-0.8.219/Install-Tizen2.ps1 /usr/share/nginx/html/test-releases/20261031-tizen2-lite-0.8.219/
COPY test-releases/20261031-tizen3-lite-0.8.190/README.md test-releases/20261031-tizen3-lite-0.8.190/Install-Tizen3.ps1 test-releases/20261031-tizen3-lite-0.8.190/Morph-TV-Tizen3-Lite-0.8.190-candidate.zip /usr/share/nginx/html/test-releases/20261031-tizen3-lite-0.8.190/
COPY test-releases/mobile-latest.json /usr/share/nginx/html/test-releases/mobile-latest.json
COPY releases/0.8.247/ /usr/share/nginx/html/releases/0.8.247/
RUN nginx -t
VOLUME /data
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1/api/community/health', timeout=3).read()" || exit 1
EXPOSE 80
CMD ["/opt/morph-community/start.sh"]
