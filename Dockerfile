FROM python:3.13-alpine AS verified-release

COPY release-artifacts.json catalog.json fetch-release-artifacts.py /

RUN python /fetch-release-artifacts.py



FROM nginx:stable-alpine

RUN apk add --no-cache python3 py3-pillow

COPY community/server.py community/plus.py community/plus_commerce.py community/qr_link.py community/matches_free.py community/start.sh /opt/morph-community/

RUN chmod 755 /opt/morph-community/start.sh

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY downloader-codes.json SHA256SUMS.txt catalog.json remote-latest.json community-admin.html community-admin.js community.js gallery.js google7e2785317cb0458c.html index.html install-helper.css install-helper.html install-helper.js install.html landing.css landing.js launcher-guide.html launcher-help.js lg-install.html lg-preview-validation.json plus-admin.css plus-admin.html plus-admin.js plus-offer.css plus-offer.js plus-purchase.js plus.html robots.txt samsung-computer.html samsung-pc-guide.js samsung-phone-install.html sitemap.xml support-links.json tvmorph.png web-tv.html device-compatibility.json release-notes-1.1.307.json release-notes-1.1.306.json site-theme.js site-style.css site-light.css site-navigation.css site-identity.css site-i18n.js site-review-form.js site-reviews.js site-remote.js site-app.js site-release-links.js site-stats.js site-navigation.js site-themes.css site-studio.css /usr/share/nginx/html/

COPY desktop-release.json desktop-iptv-release.json release416-validation.json /usr/share/nginx/html/

COPY site-desktop-downloads.js site-desktop-downloads.css /usr/share/nginx/html/

COPY fitness-music/ /usr/share/nginx/html/fitness-music/

COPY site-assets/ /usr/share/nginx/html/site-assets/

COPY theme-packs/ /usr/share/nginx/html/theme-packs/

COPY theme-previews/ /usr/share/nginx/html/theme-previews/

COPY landing-assets/ /usr/share/nginx/html/landing-assets/

COPY q/ /usr/share/nginx/html/q/


COPY release-notes-1.1.308.json /usr/share/nginx/html/

COPY plus-manual-payments.js release-notes-phone-1.1.309.json /usr/share/nginx/html/

COPY release-notes-1.1.310.json /usr/share/nginx/html/

COPY release-notes-1.1.312.json /usr/share/nginx/html/


RUN nginx -t

VOLUME /data

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1/api/community/health', timeout=3).read()" || exit 1

EXPOSE 80

CMD ["/opt/morph-community/start.sh"]



COPY release-notes-1.1.313.json /usr/share/nginx/html/




COPY release-notes-1.1.320.json /usr/share/nginx/html/




COPY site-bridge-downloads.js /usr/share/nginx/html/



COPY product-pages.js product-pages.css /usr/share/nginx/html/



COPY Morph-TV-Adhan-Voices-v1.zip Morph-Remote-1.1.305.apk /usr/share/nginx/html/

COPY --from=verified-release /artifacts/ /usr/share/nginx/html/

COPY release-notes-1.1.321.json /usr/share/nginx/html/



COPY release352-validation.json /usr/share/nginx/html/

COPY release366-validation.json /usr/share/nginx/html/

COPY release367-validation.json /usr/share/nginx/html/

COPY trailer/ /usr/share/nginx/html/trailer/
