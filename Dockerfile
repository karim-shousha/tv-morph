FROM nginx:stable-alpine
RUN apk add --no-cache python3
COPY community/server.py community/plus.py community/start.sh /opt/morph-community/
RUN chmod 755 /opt/morph-community/start.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY launcher-guide.html launcher-help.js index.html landing.css landing.js gallery.js web-tv.html catalog.json tvmorph.png SHA256SUMS.txt /usr/share/nginx/html/
COPY Morph-TV-*.apk /usr/share/nginx/html/
COPY lg-install.html lg-preview-validation.json release-notes-0.8.81.json release-notes-0.8.82.json release-notes-0.8.83.json release-notes-0.8.84.json release-notes-0.8.85.json release-notes-0.8.92.json release-notes-0.8.93.json release-notes-0.8.94.json release-notes-0.8.95.json release-notes-0.8.96.json release-notes-0.8.97.json release-notes-0.8.98.json release-notes-0.8.99.json release-notes-0.8.100.json release-notes-0.8.101.json release-notes-0.8.102.json release-notes-0.8.103.json release-notes-0.8.104.json release-notes-0.8.105.json release-notes-0.8.106.json release-notes-0.8.107.json release-notes-0.8.108.json release-notes-0.8.109.json release-notes-0.8.110.json release-notes-0.8.111.json release-notes-0.8.112.json release-notes-0.8.113.json release-notes-0.8.114.json release-notes-0.8.170.json support-links.json Morph-TV-LG-0.8.170.ipk /usr/share/nginx/html/
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

COPY install.html Morph-TV-Samsung-Computer-0.8.170.zip Morph-TV-Install-Kit-0.8.170.zip /usr/share/nginx/html/

COPY fitness-music /usr/share/nginx/html/fitness-music/

COPY Morph-TV-Samsung-Tizen4-Computer-0.8.170.zip /usr/share/nginx/html/

COPY install-helper.html install-helper.js install-helper.css release-notes-0.8.127.json /usr/share/nginx/html/

COPY plus-offer.css plus-offer.js /usr/share/nginx/html/

COPY release-notes-0.8.170.json /usr/share/nginx/html/

COPY install.html Morph-TV-Samsung-Computer-0.8.170.zip Morph-TV-Install-Kit-0.8.170.zip /usr/share/nginx/html/

COPY Morph-TV-Samsung-Tizen4-Computer-0.8.170.zip /usr/share/nginx/html/

# Isolated manual test downloads; production routes/manifests unchanged.
COPY test-releases/20261028-opencode-6adfc59b33b9/ /usr/share/nginx/html/test-releases/20261028-opencode-6adfc59b33b9/

COPY test-releases/20261028-mobile-0.8.172/ /usr/share/nginx/html/test-releases/20261028-mobile-0.8.172/

COPY test-releases/20261028-mobile-tv-0.8.173/ /usr/share/nginx/html/test-releases/20261028-mobile-tv-0.8.173/

COPY test-releases/20261028-mobile-0.8.174/ /usr/share/nginx/html/test-releases/20261028-mobile-0.8.174/
COPY test-releases/mobile-latest.json /usr/share/nginx/html/test-releases/mobile-latest.json

COPY test-releases/20261028-mobile-tv-0.8.175/ /usr/share/nginx/html/test-releases/20261028-mobile-tv-0.8.175/

COPY test-releases/20261028-mobile-tv-0.8.176/ /usr/share/nginx/html/test-releases/20261028-mobile-tv-0.8.176/

COPY test-releases/20261028-mobile-tv-0.8.177/ /usr/share/nginx/html/test-releases/20261028-mobile-tv-0.8.177/

COPY test-releases/20261028-mobile-tv-0.8.178/ /usr/share/nginx/html/test-releases/20261028-mobile-tv-0.8.178/

COPY test-releases/20261028-mobile-tv-0.8.179/ /usr/share/nginx/html/test-releases/20261028-mobile-tv-0.8.179/

COPY test-releases/20261028-mobile-tv-0.8.180/ /usr/share/nginx/html/test-releases/20261028-mobile-tv-0.8.180/

COPY test-releases/20261028-mobile-tv-0.8.181/ /usr/share/nginx/html/test-releases/20261028-mobile-tv-0.8.181/

COPY test-releases/20261028-mobile-tv-0.8.182/ /usr/share/nginx/html/test-releases/20261028-mobile-tv-0.8.182/

COPY test-releases/20261028-mobile-tv-0.8.183/ /usr/share/nginx/html/test-releases/20261028-mobile-tv-0.8.183/

COPY test-releases/20261028-mobile-tv-0.8.184/ /usr/share/nginx/html/test-releases/20261028-mobile-tv-0.8.184/

COPY test-releases/20261028-mobile-tv-0.8.185/ /usr/share/nginx/html/test-releases/20261028-mobile-tv-0.8.185/

COPY test-releases/20261028-mobile-tv-0.8.186/ /usr/share/nginx/html/test-releases/20261028-mobile-tv-0.8.186/

COPY test-releases/20261028-tizen3-lite-0.8.186/ /usr/share/nginx/html/test-releases/20261028-tizen3-lite-0.8.186/

COPY samsung-pc-guide.js /usr/share/nginx/html/

COPY samsung-computer.html Morph-TV-Samsung-Tizen5-0.8.170.wgt Morph-TV-Samsung-Tizen4-0.8.170.wgt /usr/share/nginx/html/

COPY test-releases/20261028-mobile-0.8.187/ /usr/share/nginx/html/test-releases/20261028-mobile-0.8.187/

COPY test-releases/20261029-mobile-tv-0.8.188/ /usr/share/nginx/html/test-releases/20261029-mobile-tv-0.8.188/

COPY test-releases/20261029-mobile-tv-0.8.189/ /usr/share/nginx/html/test-releases/20261029-mobile-tv-0.8.189/

COPY test-releases/20261029-mobile-tv-0.8.190/ /usr/share/nginx/html/test-releases/20261029-mobile-tv-0.8.190/

COPY test-releases/20261029-mobile-tv-0.8.191/ /usr/share/nginx/html/test-releases/20261029-mobile-tv-0.8.191/

COPY test-releases/20261029-mobile-tv-0.8.192/ /usr/share/nginx/html/test-releases/20261029-mobile-tv-0.8.192/

COPY Morph-TV-Samsung-Tizen5-0.8.206.wgt Morph-TV-Samsung-Tizen4-0.8.206.wgt Morph-TV-LG-0.8.206.ipk /usr/share/nginx/html/
COPY releases/ /usr/share/nginx/html/releases/
COPY test-releases/20261029-tizen2-lite-0.8.206/ /usr/share/nginx/html/test-releases/20261029-tizen2-lite-0.8.206/
COPY test-releases/20261029-public-0.8.206/ /usr/share/nginx/html/test-releases/20261029-public-0.8.206/

COPY Morph-TV-Samsung-Tizen5-0.8.207.wgt Morph-TV-Samsung-Tizen4-0.8.207.wgt Morph-TV-LG-0.8.207.ipk /usr/share/nginx/html/
COPY test-releases/20261029-public-0.8.207/ /usr/share/nginx/html/test-releases/20261029-public-0.8.207/

COPY Morph-TV-Samsung-Tizen5-0.8.208.wgt Morph-TV-Samsung-Tizen4-0.8.208.wgt Morph-TV-LG-0.8.208.ipk /usr/share/nginx/html/
COPY test-releases/20261029-public-0.8.208/ /usr/share/nginx/html/test-releases/20261029-public-0.8.208/

COPY Morph-TV-Samsung-Tizen5-0.8.209.wgt Morph-TV-Samsung-Tizen4-0.8.209.wgt Morph-TV-LG-0.8.209.ipk /usr/share/nginx/html/
COPY test-releases/20261029-public-0.8.209/ /usr/share/nginx/html/test-releases/20261029-public-0.8.209/

COPY Morph-TV-Samsung-Tizen5-0.8.210.wgt Morph-TV-Samsung-Tizen4-0.8.210.wgt Morph-TV-LG-0.8.210.ipk /usr/share/nginx/html/
COPY test-releases/20261029-public-0.8.210/ /usr/share/nginx/html/test-releases/20261029-public-0.8.210/

COPY test-releases/20261029-tizen2-lite-0.8.215/ /usr/share/nginx/html/test-releases/20261029-tizen2-lite-0.8.215/

COPY Morph-TV-Samsung-Tizen5-0.8.216.wgt Morph-TV-Samsung-Tizen4-0.8.216.wgt Morph-TV-LG-0.8.216.ipk /usr/share/nginx/html/
COPY test-releases/20261029-public-0.8.216/ /usr/share/nginx/html/test-releases/20261029-public-0.8.216/

COPY Morph-TV-Samsung-Tizen5-0.8.217.wgt Morph-TV-Samsung-Tizen4-0.8.217.wgt Morph-TV-LG-0.8.217.ipk /usr/share/nginx/html/
COPY test-releases/20261029-public-0.8.217/ /usr/share/nginx/html/test-releases/20261029-public-0.8.217/

COPY Morph-TV-Samsung-Tizen5-0.8.218.wgt Morph-TV-Samsung-Tizen4-0.8.218.wgt Morph-TV-LG-0.8.218.ipk /usr/share/nginx/html/
COPY test-releases/20261029-public-0.8.218/ /usr/share/nginx/html/test-releases/20261029-public-0.8.218/

COPY Morph-TV-Samsung-Tizen5-0.8.219.wgt Morph-TV-Samsung-Tizen4-0.8.219.wgt Morph-TV-LG-0.8.219.ipk /usr/share/nginx/html/
COPY test-releases/20261029-public-0.8.219/ /usr/share/nginx/html/test-releases/20261029-public-0.8.219/

COPY test-releases/20261030-stability-0.8.220/ /usr/share/nginx/html/test-releases/20261030-stability-0.8.220/
