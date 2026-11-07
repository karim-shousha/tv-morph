"""Compose desktop transport with the canonical shared HTML5 player."""
from pathlib import Path

def compose_player(root: Path, media: str) -> str:
    playback = (root / 'webos-app/player.js').read_text(encoding='utf-8')
    playback = playback.replace("video.removeAttribute('src');video.load();", "MorphDesktopMedia.detach(video);video.removeAttribute('src');video.load();")
    old = "toggle.focus();beginStream(url);return {sent:true};"
    assert old in playback
    playback = playback.replace(old, "toggle.focus();MorphDesktopMedia.attach(video,url,item,function(message){status.textContent=message;showControls();});MorphDesktopMedia.controls(overlay,video,showControls);return {sent:true};")
    start = media.index(' function play(')
    # The shared HTML5 player includes its presentation helpers ahead of play().
    helpers = media.rfind('/* ===== MORPH PLAYER 2.0', 0, start)
    if helpers >= 0:
        start = helpers
    end = media.index(' function action(', start)
    result=media[:start] + playback + '\n' + media[end:]
    # Preserve desktop provider transport while sharing explicit protocol repair.
    result=result.replace('function connect(value){if(value.accountId)', 'function connect(value){var useHttp=value.useHttp===true;if(value.accountId)')
    result=result.replace("if(value.type==='m3u'&&!value.publicMode&&!value._m3uOnly)", "if(useHttp&&value.type==='xtream'&&/^https:\\/\\//i.test(value.server))value=Object.assign({},value,{server:value.server.replace(/^https:/i,'http:')});if(value.type==='m3u'&&!value.publicMode&&!value._m3uOnly)")
    shared=(root/'mobile-app/samsung-media.js').read_text(encoding='utf-8')
    policy=shared[shared.index(' function enforceAccountLimit('):shared.index(' function connect(',shared.index(' function enforceAccountLimit('))]
    result=result.replace(' function connect(value){',policy+' function connect(value){',1)
    result=result.replace('var useHttp=value.useHttp===true;','var useHttp=value.useHttp===true,editingAccount=!!value.accountId||!!value.restorePersonal;')
    result=result.replace('delete next._m3uOnly;return M3uSource.load','delete next._m3uOnly;enforceAccountLimit(next,editingAccount);return M3uSource.load')
    result=result.replace("p.server=u.href.replace(/\\/+$/,'');return request(p)","p.server=u.href.replace(/\\/+$/,'');enforceAccountLimit(p,editingAccount);return request(p)")
    helper=shared[shared.index(' function playLocal('):shared.index(' function play(item,resolvedUrl)')]
    result=result.replace(' function play(item,resolvedUrl)',helper+' function play(item,resolvedUrl)',1)
    result=result.replace('window.SamsungMedia={','window.SamsungMedia={playLocal:playLocal,',1)
    result=result.replace("if(!playingItem||playingItem.kind==='live')return;","if(!playingItem||playingItem.localMedia||playingItem.kind==='live')return;",1)
    return result.replace('exit:exit,radioStatus:', 'exit:exit,parentalStop:stop,radioStatus:')
