FROM nginx:stable-alpine
RUN apk add --no-cache python3
COPY community/server.py community/plus.py community/qr_link.py community/start.sh /opt/morph-community/
RUN chmod 755 /opt/morph-community/start.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY SHA256SUMS.txt catalog.json remote-latest.json community-admin.html community-admin.js community.js gallery.js google7e2785317cb0458c.html index.html install-helper.css install-helper.html install-helper.js install.html landing.css landing.js launcher-guide.html launcher-help.js lg-install.html lg-preview-validation.json plus-admin.css plus-admin.html plus-offer.css plus-offer.js plus-purchase.js plus.html robots.txt samsung-computer.html samsung-pc-guide.js samsung-phone-install.html sitemap.xml support-links.json tvmorph.png web-tv.html device-compatibility.json release-notes-0.8.293.json site-theme.js site-style.css site-light.css site-navigation.css site-identity.css site-i18n.js site-review-form.js site-reviews.js site-remote.js site-app.js site-release-links.js site-stats.js site-navigation.js site-themes.css site-studio.css /usr/share/nginx/html/
COPY fitness-music/ /usr/share/nginx/html/fitness-music/
COPY site-assets/ /usr/share/nginx/html/site-assets/
COPY theme-packs/ /usr/share/nginx/html/theme-packs/
COPY theme-previews/ /usr/share/nginx/html/theme-previews/
COPY landing-assets/ /usr/share/nginx/html/landing-assets/
COPY q/ /usr/share/nginx/html/q/
COPY Morph-TV-Phone-0.8.297.apk Morph-TV-Legacy-0.1.7.apk Morph-TV-Android-TV-0.8.293.apk Morph-TV-LG-0.8.293.ipk Morph-TV-Samsung-Tizen2-0.8.293.wgt Morph-TV-Samsung-Tizen3-0.8.293.wgt Morph-TV-Samsung-Tizen4-0.8.293.wgt Morph-TV-Samsung-Tizen5-0.8.293.wgt Morph-IPTV-LG-0.1.3.ipk Morph-IPTV-tizen4-0.1.3.wgt Morph-IPTV-tizen5-0.1.3.wgt Morph-IPTV-tizen2-0.1.3.wgt Morph-IPTV-tizen3-0.1.3.wgt Morph-IPTV-Android-TV-0.1.3.apk Morph-Remote-1.1.1.apk Morph-IPTV-Legacy-0.1.0.apk Morph-TV-Install-Kit-0.8.293.zip /usr/share/nginx/html/
COPY releases/0.8.293/ /usr/share/nginx/html/releases/0.8.293/
RUN nginx -t
VOLUME /data
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1/api/community/health', timeout=3).read()" || exit 1
EXPOSE 80
CMD ["/opt/morph-community/start.sh"]
