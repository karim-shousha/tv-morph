FROM nginx:stable-alpine
RUN apk add --no-cache python3
COPY community/server.py community/plus.py community/qr_link.py community/matches_free.py community/start.sh /opt/morph-community/
RUN chmod 755 /opt/morph-community/start.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY downloader-codes.json SHA256SUMS.txt catalog.json remote-latest.json community-admin.html community-admin.js community.js gallery.js google7e2785317cb0458c.html index.html install-helper.css install-helper.html install-helper.js install.html landing.css landing.js launcher-guide.html launcher-help.js lg-install.html lg-preview-validation.json plus-admin.css plus-admin.html plus-admin.js plus-offer.css plus-offer.js plus-purchase.js plus.html robots.txt samsung-computer.html samsung-pc-guide.js samsung-phone-install.html sitemap.xml support-links.json tvmorph.png web-tv.html device-compatibility.json release-notes-1.1.307.json release-notes-1.1.306.json site-theme.js site-style.css site-light.css site-navigation.css site-identity.css site-i18n.js site-review-form.js site-reviews.js site-remote.js site-app.js site-release-links.js site-stats.js site-navigation.js site-themes.css site-studio.css /usr/share/nginx/html/
COPY desktop-release.json /usr/share/nginx/html/
COPY site-desktop-downloads.js site-desktop-downloads.css /usr/share/nginx/html/
COPY fitness-music/ /usr/share/nginx/html/fitness-music/
COPY site-assets/ /usr/share/nginx/html/site-assets/
COPY theme-packs/ /usr/share/nginx/html/theme-packs/
COPY theme-previews/ /usr/share/nginx/html/theme-previews/
COPY landing-assets/ /usr/share/nginx/html/landing-assets/
COPY q/ /usr/share/nginx/html/q/
COPY Morph-TV-Adhan-Voices-v1.zip Morph-TV-Legacy-1.1.305.apk Morph-TV-Android-TV-1.1.307.apk Morph-TV-LG-1.1.307.ipk Morph-TV-Samsung-Tizen2-1.1.307.wgt Morph-TV-Samsung-Tizen3-1.1.307.wgt Morph-TV-Samsung-Tizen4-1.1.307.wgt Morph-TV-Samsung-Tizen5-1.1.307.wgt Morph-IPTV-LG-1.1.307.ipk Morph-IPTV-tizen4-1.1.307.wgt Morph-IPTV-tizen5-1.1.307.wgt Morph-IPTV-tizen2-1.1.307.wgt Morph-IPTV-tizen3-1.1.307.wgt Morph-IPTV-Android-TV-1.1.307.apk Morph-Remote-1.1.305.apk Morph-IPTV-Legacy-1.1.305.apk Morph-TV-Install-Kit-1.1.307.zip /usr/share/nginx/html/
COPY releases/1.1.307/ /usr/share/nginx/html/releases/1.1.307/
COPY Morph-TV-Android-TV-1.1.308.apk Morph-TV-LG-1.1.308.ipk Morph-TV-Samsung-Tizen2-1.1.308.wgt Morph-TV-Samsung-Tizen3-1.1.308.wgt Morph-TV-Samsung-Tizen4-1.1.308.wgt Morph-TV-Samsung-Tizen5-1.1.308.wgt Morph-IPTV-LG-1.1.308.ipk Morph-IPTV-tizen4-1.1.308.wgt Morph-IPTV-tizen5-1.1.308.wgt Morph-IPTV-tizen2-1.1.308.wgt Morph-IPTV-tizen3-1.1.308.wgt Morph-IPTV-Android-TV-1.1.308.apk Morph-TV-Install-Kit-1.1.308.zip /usr/share/nginx/html/
COPY release-notes-1.1.308.json /usr/share/nginx/html/
COPY releases/1.1.308/ /usr/share/nginx/html/releases/1.1.308/
COPY plus-manual-payments.js release-notes-phone-1.1.309.json /usr/share/nginx/html/
COPY Morph-TV-Android-TV-1.1.310.apk Morph-TV-LG-1.1.310.ipk Morph-TV-Samsung-Tizen2-1.1.310.wgt Morph-TV-Samsung-Tizen3-1.1.310.wgt Morph-TV-Samsung-Tizen4-1.1.310.wgt Morph-TV-Samsung-Tizen5-1.1.310.wgt Morph-IPTV-LG-1.1.310.ipk Morph-IPTV-tizen2-1.1.310.wgt Morph-IPTV-tizen3-1.1.310.wgt Morph-IPTV-tizen4-1.1.310.wgt Morph-IPTV-tizen5-1.1.310.wgt Morph-IPTV-Android-TV-1.1.310.apk Morph-TV-Install-Kit-1.1.310.zip /usr/share/nginx/html/
COPY release-notes-1.1.310.json /usr/share/nginx/html/
COPY releases/1.1.310/ /usr/share/nginx/html/releases/1.1.310/
COPY Morph-IPTV-Android-TV-1.1.312.apk Morph-IPTV-LG-1.1.312.ipk Morph-IPTV-tizen2-1.1.312.wgt Morph-IPTV-tizen3-1.1.312.wgt Morph-IPTV-tizen4-1.1.312.wgt Morph-IPTV-tizen5-1.1.312.wgt Morph-TV-Android-TV-1.1.312.apk Morph-TV-Install-Kit-1.1.312.zip Morph-TV-LG-1.1.312.ipk Morph-TV-Samsung-Tizen2-1.1.312.wgt Morph-TV-Samsung-Tizen3-1.1.312.wgt Morph-TV-Samsung-Tizen4-1.1.312.wgt Morph-TV-Samsung-Tizen5-1.1.312.wgt /usr/share/nginx/html/
COPY release-notes-1.1.312.json /usr/share/nginx/html/
COPY releases/1.1.312/ /usr/share/nginx/html/releases/1.1.312/
COPY artifact-parts/ /tmp/morph-phone-parts/
RUN cat /tmp/morph-phone-parts/Morph-TV-Phone-1.1.307.apk.part-* > /usr/share/nginx/html/Morph-TV-Phone-1.1.307.apk && echo "2362792bd0f433b28c4aba067495be1d4f82a3fefd39ac818d7ac8d04ad5d836  /usr/share/nginx/html/Morph-TV-Phone-1.1.307.apk" | sha256sum -c - && cat /tmp/morph-phone-parts/Morph-TV-Phone-1.1.308.apk.part-* > /usr/share/nginx/html/Morph-TV-Phone-1.1.308.apk && echo "146f1e131dec243b155386473268ccbb19e114642ac49933fc7e69a41308a826  /usr/share/nginx/html/Morph-TV-Phone-1.1.308.apk" | sha256sum -c - && cat /tmp/morph-phone-parts/Morph-TV-Phone-1.1.309.apk.part-* > /usr/share/nginx/html/Morph-TV-Phone-1.1.309.apk && echo "255793c1fba4b5f4cf74a4689c6be7841449908d8335448e6de4c46b5fe9888a  /usr/share/nginx/html/Morph-TV-Phone-1.1.309.apk" | sha256sum -c - && cat /tmp/morph-phone-parts/Morph-TV-Phone-1.1.310.apk.part-* > /usr/share/nginx/html/Morph-TV-Phone-1.1.310.apk && echo "53aae26172c3af5d89e5671f7cc30c0e17cd28d67f3b08254f66e57b39552cad  /usr/share/nginx/html/Morph-TV-Phone-1.1.310.apk" | sha256sum -c - && cat /tmp/morph-phone-parts/Morph-TV-Phone-1.1.312.apk.part-* > /usr/share/nginx/html/Morph-TV-Phone-1.1.312.apk && echo "1de5bc2190592f36b9046d53c98e9cee7fe6484cee86d5860eedf304987e2126  /usr/share/nginx/html/Morph-TV-Phone-1.1.312.apk" | sha256sum -c - && rm -rf /tmp/morph-phone-parts
RUN nginx -t
VOLUME /data
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1/api/community/health', timeout=3).read()" || exit 1
EXPOSE 80
CMD ["/opt/morph-community/start.sh"]

# Shared UI release 1.1.313; retain the previous published payloads.
COPY Morph-TV-Android-TV-1.1.313.apk Morph-TV-LG-1.1.313.ipk Morph-TV-Samsung-Tizen2-1.1.313.wgt Morph-TV-Samsung-Tizen3-1.1.313.wgt Morph-TV-Samsung-Tizen4-1.1.313.wgt Morph-TV-Samsung-Tizen5-1.1.313.wgt Morph-IPTV-LG-1.1.313.ipk Morph-IPTV-tizen4-1.1.313.wgt Morph-IPTV-tizen5-1.1.313.wgt Morph-IPTV-tizen2-1.1.313.wgt Morph-IPTV-tizen3-1.1.313.wgt Morph-IPTV-Android-TV-1.1.313.apk Morph-TV-Legacy-1.1.313.apk Morph-IPTV-Legacy-1.1.313.apk Morph-TV-Install-Kit-1.1.313.zip /usr/share/nginx/html/
COPY release-notes-1.1.313.json /usr/share/nginx/html/
COPY releases/1.1.313/ /usr/share/nginx/html/releases/1.1.313/
COPY artifact-parts/Morph-TV-Phone-1.1.313.apk.part-* /tmp/morph313-parts/
RUN cat /tmp/morph313-parts/* > /usr/share/nginx/html/Morph-TV-Phone-1.1.313.apk && echo "a0155f63199e5d61a05b7558aca3b6d524cc83b965f92f8e6dcbcc06394bb94b  /usr/share/nginx/html/Morph-TV-Phone-1.1.313.apk" | sha256sum -c - && rm -rf /tmp/morph313-parts

# Shared UI release 1.1.318; retain the previous published payloads.
COPY Morph-TV-Android-TV-1.1.318.apk Morph-TV-LG-1.1.318.ipk Morph-TV-Samsung-Tizen2-1.1.318.wgt Morph-TV-Samsung-Tizen3-1.1.318.wgt Morph-TV-Samsung-Tizen4-1.1.318.wgt Morph-TV-Samsung-Tizen5-1.1.318.wgt Morph-IPTV-LG-1.1.318.ipk Morph-IPTV-tizen4-1.1.318.wgt Morph-IPTV-tizen5-1.1.318.wgt Morph-IPTV-tizen2-1.1.318.wgt Morph-IPTV-tizen3-1.1.318.wgt Morph-IPTV-Android-TV-1.1.318.apk Morph-TV-Legacy-1.1.318.apk Morph-IPTV-Legacy-1.1.318.apk Morph-Bridge-Android-TV-1.1.318.apk Morph-Bridge-Samsung-1.1.318.wgt Morph-Bridge-LG-1.1.318.ipk Morph-TV-Install-Kit-1.1.318.zip /usr/share/nginx/html/
COPY release-notes-1.1.318.json /usr/share/nginx/html/
COPY releases/1.1.318/ /usr/share/nginx/html/releases/1.1.318/
COPY artifact-parts/Morph-TV-Phone-1.1.318.apk.part-* /tmp/morph318-parts/
RUN cat /tmp/morph318-parts/* > /usr/share/nginx/html/Morph-TV-Phone-1.1.318.apk && echo "c5381dc741e36eb7b9ccf610892debd19138a422be4790b6c810a6fb51fc93c6  /usr/share/nginx/html/Morph-TV-Phone-1.1.318.apk" | sha256sum -c - && rm -rf /tmp/morph318-parts

COPY site-bridge-downloads.js /usr/share/nginx/html/
