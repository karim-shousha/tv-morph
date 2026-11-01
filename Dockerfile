FROM nginx:stable-alpine
RUN apk add --no-cache python3
COPY community/server.py community/plus.py community/qr_link.py community/start.sh /opt/morph-community/
RUN chmod 755 /opt/morph-community/start.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY SHA256SUMS.txt catalog.json community-admin.html community-admin.js community.js gallery.js google7e2785317cb0458c.html index.html install-helper.css install-helper.html install-helper.js install.html landing.css landing.js launcher-guide.html launcher-help.js lg-install.html lg-preview-validation.json plus-admin.css plus-admin.html plus-offer.css plus-offer.js plus-purchase.js plus.html robots.txt samsung-computer.html samsung-pc-guide.js samsung-phone-install.html sitemap.xml support-links.json tvmorph.png web-tv.html /usr/share/nginx/html/
COPY fitness-music/ /usr/share/nginx/html/fitness-music/
COPY site-assets/ /usr/share/nginx/html/site-assets/
COPY theme-packs/ /usr/share/nginx/html/theme-packs/
COPY theme-previews/ /usr/share/nginx/html/theme-previews/
COPY test-releases/mobile-latest.json /usr/share/nginx/html/test-releases/mobile-latest.json

COPY q/ /usr/share/nginx/html/q/

COPY Morph-TV-Android-TV-0.8.271.apk Morph-TV-LG-0.8.271.ipk Morph-TV-Samsung-Tizen4-0.8.271.wgt Morph-TV-Legacy-0.1.6.apk Morph-TV-Samsung-Tizen5-0.8.271.wgt Morph-TV-Samsung-Computer-0.8.272.zip Morph-TV-Samsung-Tizen4-Computer-0.8.272.zip /usr/share/nginx/html/
COPY test-releases/20261101-tizen2-lite-0.8.271/Morph-TV-Tizen2-Lite-0.8.271-candidate.wgt /usr/share/nginx/html/test-releases/20261101-tizen2-lite-0.8.271/Morph-TV-Tizen2-Lite-0.8.271-candidate.wgt
COPY test-releases/20261101-tizen2-lite-0.8.271/README.md /usr/share/nginx/html/test-releases/20261101-tizen2-lite-0.8.271/README.md
COPY test-releases/20261101-tizen2-lite-0.8.271/Install-Tizen2.ps1 /usr/share/nginx/html/test-releases/20261101-tizen2-lite-0.8.271/Install-Tizen2.ps1
COPY test-releases/20261101-tizen3-lite-0.8.271/Morph-TV-Tizen3-Lite-0.8.271-candidate.wgt /usr/share/nginx/html/test-releases/20261101-tizen3-lite-0.8.271/Morph-TV-Tizen3-Lite-0.8.271-candidate.wgt
COPY test-releases/20261101-tizen3-lite-0.8.271/README.md /usr/share/nginx/html/test-releases/20261101-tizen3-lite-0.8.271/README.md
COPY test-releases/20261101-tizen3-lite-0.8.271/Install-Tizen3.ps1 /usr/share/nginx/html/test-releases/20261101-tizen3-lite-0.8.271/Install-Tizen3.ps1
COPY test-releases/20261101-tizen3-lite-0.8.271/Morph-TV-Tizen3-Lite-0.8.271-candidate.zip /usr/share/nginx/html/test-releases/20261101-tizen3-lite-0.8.271/Morph-TV-Tizen3-Lite-0.8.271-candidate.zip
COPY release-notes-0.8.271.json /usr/share/nginx/html/

COPY Morph-TV-Phone-0.8.272.apk Morph-Remote-1.0.9.apk Morph-TV-Install-Kit-0.8.272.zip remote-latest.json site-app.js site-remote.js site-i18n.js site-stats.js site-reviews.js site-review-form.js site-release-links.js site-style.css /usr/share/nginx/html/
COPY landing-assets/ /usr/share/nginx/html/landing-assets/
COPY releases/0.8.272/ /usr/share/nginx/html/releases/0.8.272/
COPY device-compatibility.json /usr/share/nginx/html/
COPY release-notes-0.8.272.json /usr/share/nginx/html/
RUN nginx -t
VOLUME /data
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1/api/community/health', timeout=3).read()" || exit 1
EXPOSE 80
CMD ["/opt/morph-community/start.sh"]
