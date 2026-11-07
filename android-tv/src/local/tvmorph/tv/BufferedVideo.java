package local.tvmorph.tv;

import android.content.Context;
import android.app.ActivityManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Handler;
import android.view.SurfaceView;
import android.view.Gravity;
import android.widget.FrameLayout;
import android.widget.VideoView;
import androidx.media3.common.*;
import androidx.media3.common.text.CueGroup;
import androidx.media3.datasource.*;
import androidx.media3.exoplayer.*;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.ui.SubtitleView;
import java.util.*;

/** One view for the existing controls. VOD uses Media3; live keeps its proven path. */
class BufferedVideo extends FrameLayout {
    int width=16,height=9;
    private VideoView system;private MediaPlayer systemEngine;private boolean muted;
    private SurfaceView surface;
    private SubtitleView subtitles;
    private ExoPlayer exo;
    private boolean modern,ready,waiting,seeking,liveMode,rendered;
    private int epoch;
    private String failureInformation="";
    private int responseStatus;
    int responseStatus(){return responseStatus;}
    String failureInformation(){return failureInformation;}
    private MediaPlayer.OnPreparedListener prepared;
    private MediaPlayer.OnInfoListener info;
    private MediaPlayer.OnErrorListener error;
    private MediaPlayer.OnCompletionListener completion;
    private MediaPlayer.OnSeekCompleteListener seekComplete;
    private MediaPlayer.OnVideoSizeChangedListener sizeChanged;
    BufferedVideo(Context context){super(context);setFocusable(true);}
    private String networkRoot;
    void network(String address,boolean live){networkRoot=address;modern=true;liveMode=live;}
    void useBuffered(boolean value){modern=networkRoot!=null||value;liveMode=false;}
    void useLiveBuffered(){modern=true;liveMode=true;}
    boolean buffered(){return modern;}
    void setOnPreparedListener(MediaPlayer.OnPreparedListener listener){prepared=listener;}
    void setOnInfoListener(MediaPlayer.OnInfoListener listener){info=listener;}
    void setOnErrorListener(MediaPlayer.OnErrorListener listener){error=listener;}
    void setOnCompletionListener(MediaPlayer.OnCompletionListener listener){completion=listener;}
    void setOnSeekCompleteListener(MediaPlayer.OnSeekCompleteListener listener){seekComplete=listener;}
    void setOnVideoSizeChangedListener(MediaPlayer.OnVideoSizeChangedListener listener){sizeChanged=listener;}
    void setVideoURI(Uri uri,Map<String,String> headers){
        stopPlayback();rendered=false;width=16;height=9;failureInformation="";responseStatus=0;final int run=epoch;
        if(!modern){
            system=new VideoView(getContext()){@Override protected void onMeasure(int w,int h){setMeasuredDimension(MeasureSpec.getSize(w),MeasureSpec.getSize(h));}};addView(system,new LayoutParams(-1,-1,Gravity.CENTER));
            system.setOnPreparedListener(p->{if(run!=epoch)return;systemEngine=p;p.setVolume(muted?0f:1f,muted?0f:1f);if(prepared!=null)prepared.onPrepared(p);});
            system.setOnInfoListener((p,w,e)->{if(run!=epoch)return false;if(w==MediaPlayer.MEDIA_INFO_VIDEO_RENDERING_START)rendered=true;return info!=null&&info.onInfo(p,w,e);});
            system.setOnErrorListener((p,w,e)->run==epoch&&error!=null&&error.onError(p,w,e));
            system.setOnCompletionListener(p->{if(run==epoch&&completion!=null)completion.onCompletion(p);});
            system.setVideoURI(uri,headers);return;
        }
        surface=new SurfaceView(getContext());addView(surface,new LayoutParams(-1,-1));
        subtitles=new SubtitleView(getContext());subtitles.setUserDefaultStyle();subtitles.setUserDefaultTextSize();subtitleAppearance();addView(subtitles,new LayoutParams(-1,-1));
        ActivityManager manager=(ActivityManager)getContext().getSystemService(Context.ACTIVITY_SERVICE);
        int bytes=liveMode?8*1024*1024:manager!=null&&(manager.isLowRamDevice()||manager.getMemoryClass()<=128)?16*1024*1024:48*1024*1024;
        DefaultLoadControl load=new DefaultLoadControl.Builder().setBufferDurationsMs(liveMode?5000:20000,liveMode?15000:60000,liveMode?1000:1000,liveMode?2500:3000)
            .setTargetBufferBytes(bytes).setPrioritizeTimeOverSizeThresholds(false).setBackBuffer(0,false).build();
        DefaultHttpDataSource.Factory http=new DefaultHttpDataSource.Factory().setUserAgent(headers==null?null:headers.get("User-Agent"))
            .setDefaultRequestProperties(headers==null?java.util.Collections.<String,String>emptyMap():headers)
            .setConnectTimeoutMs(15000).setReadTimeoutMs(20000);
        DataSource.Factory transport=networkRoot==null?http:()->new LanMediaDataSource(getContext(),networkRoot);
        DataSource.Factory data=networkRoot==null?new DefaultDataSource.Factory(getContext(),transport):transport;
        androidx.media3.exoplayer.trackselection.DefaultTrackSelector selector=new androidx.media3.exoplayer.trackselection.DefaultTrackSelector(getContext());selector.setParameters(selector.buildUponParameters().setExceedRendererCapabilitiesIfNecessary(true));
        exo=new ExoPlayer.Builder(getContext(),new DefaultRenderersFactory(getContext()).setEnableDecoderFallback(true)).setTrackSelector(selector)
            .setLoadControl(load).setMediaSourceFactory(new DefaultMediaSourceFactory(data)).build();
        exo.setAudioAttributes(new AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MOVIE).build(),true);
        exo.setVideoSurfaceView(surface);
        exo.addListener(new Player.Listener(){
            @Override public void onPlaybackStateChanged(int state){
                if(run!=epoch)return;
                if(state==Player.STATE_READY){
                    if(!ready){ready=true;if(prepared!=null)prepared.onPrepared(null);}
                    if(waiting){waiting=false;if(info!=null)info.onInfo(null,MediaPlayer.MEDIA_INFO_BUFFERING_END,0);}
                    finishSeek(run);
                }else if(state==Player.STATE_BUFFERING&&ready&&!waiting){waiting=true;if(info!=null)info.onInfo(null,MediaPlayer.MEDIA_INFO_BUFFERING_START,0);}
                else if(state==Player.STATE_ENDED&&completion!=null)completion.onCompletion(null);
            }
            @Override public void onRenderedFirstFrame(){if(run==epoch)rendered=true;}
            @Override public void onVideoSizeChanged(VideoSize size){if(run!=epoch)return;width=Math.max(1,(int)(size.width*size.pixelWidthHeightRatio));height=Math.max(1,size.height);requestLayout();if(sizeChanged!=null)sizeChanged.onVideoSizeChanged(null,width,height);}
            @Override public void onCues(CueGroup cues){if(run==epoch&&subtitles!=null)subtitles.setCues(cues.cues);}
            @Override public void onPlayerError(PlaybackException failure){if(run!=epoch||error==null)return;int code=failure.errorCode;failureInformation="Media3: "+code+" ("+failure.getErrorCodeName()+")";Throwable cause=failure;for(int depth=0;cause!=null&&depth<10;depth++,cause=cause.getCause()){if(cause instanceof HttpDataSource.InvalidResponseCodeException){responseStatus=((HttpDataSource.InvalidResponseCodeException)cause).responseCode;failureInformation+=" · HTTP "+responseStatus;break;}}int extra=code>=2000&&code<3000?-1004:code>=3000&&code<4000?-1007:code>=4000&&code<6000?-1010:0;error.onError(null,1,extra);}
        });
        exo.setVolume(muted?0f:1f);languagePreferences();exo.setMediaItem(MediaItem.fromUri(uri));exo.prepare();
    }
    boolean hasVideoFrame(){return rendered;}
    boolean videoExpected(){if(exo!=null){for(Tracks.Group g:exo.getCurrentTracks().getGroups())if(g.getType()==C.TRACK_TYPE_VIDEO&&g.length>0)return true;return false;}return width>1&&height>1;}
    boolean recoverVideoQuality(){if(exo==null)return false;Format current=exo.getVideoFormat();if(current==null)return false;Tracks.Group chosen=null;int index=-1;long best=-1,currentPixels=(long)Math.max(1,current.width)*Math.max(1,current.height);for(Tracks.Group g:exo.getCurrentTracks().getGroups())if(g.getType()==C.TRACK_TYPE_VIDEO)for(int i=0;i<g.length;i++){Format f=g.getTrackFormat(i);long pixels=(long)Math.max(1,f.width)*Math.max(1,f.height);if(g.isTrackSupported(i)&&!g.isTrackSelected(i)&&pixels<currentPixels&&pixels>best){chosen=g;index=i;best=pixels;}}if(chosen==null)return false;rendered=false;exo.setTrackSelectionParameters(exo.getTrackSelectionParameters().buildUpon().clearOverridesOfType(C.TRACK_TYPE_VIDEO).setOverrideForType(new TrackSelectionOverride(chosen.getMediaTrackGroup(),index)).build());return true;}
    private void finishSeek(int run){if(run==epoch&&seeking&&exo!=null&&exo.getPlaybackState()==Player.STATE_READY){seeking=false;if(seekComplete!=null)seekComplete.onSeekComplete(null);}}
    void setMuted(boolean value){muted=value;if(exo!=null)exo.setVolume(value?0f:1f);if(systemEngine!=null)try{systemEngine.setVolume(value?0f:1f,value?0f:1f);}catch(IllegalStateException ignored){}}
    void start(){if(exo!=null)exo.play();else if(system!=null)system.start();}
    void pause(){if(exo!=null)exo.pause();else if(system!=null)system.pause();}
    boolean isPlaying(){return exo!=null?exo.getPlayWhenReady()&&exo.getPlaybackState()!=Player.STATE_ENDED:system!=null&&system.isPlaying();}
    int getDuration(){return exo!=null?(int)Math.min(Integer.MAX_VALUE,Math.max(0,exo.getDuration())):system!=null?system.getDuration():0;}
    int getCurrentPosition(){return exo!=null?(int)Math.min(Integer.MAX_VALUE,exo.getCurrentPosition()):system!=null?system.getCurrentPosition():0;}
    int getBufferPercentage(){return exo!=null?exo.getBufferedPercentage():system!=null?system.getBufferPercentage():0;}
    long bufferedAhead(){return exo!=null?Math.max(0,exo.getBufferedPosition()-exo.getCurrentPosition()):0;}
    void seekTo(int position){if(exo!=null){seeking=true;exo.seekTo(position);final int run=epoch;new Handler().post(()->finishSeek(run));}else if(system!=null)system.seekTo(position);}
    float rate(float value){if(exo==null)throw new IllegalStateException("Player not ready");exo.setPlaybackSpeed(value);return exo.getPlaybackParameters().speed;}
    private String value(int n,String unit){return n>0?n+unit:"—";}
    String streamInformation(){
        if(exo==null)return "";
        Format v=exo.getVideoFormat(),a=exo.getAudioFormat();
        return "Video codec: "+(v==null||v.sampleMimeType==null?"—":v.sampleMimeType)+"\n"+
            "Declared FPS: "+(v!=null&&v.frameRate>0?String.format(java.util.Locale.US,"%.2f",v.frameRate):"—")+"\n"+
            "Declared video bitrate: "+(v==null?"—":value(v.bitrate," bit/s"))+"\n"+
            "Audio codec: "+(a==null||a.sampleMimeType==null?"—":a.sampleMimeType)+"\n"+
            "Audio channels: "+(a==null?"—":value(a.channelCount,""))+"\n"+
            "Audio sample rate: "+(a==null?"—":value(a.sampleRate," Hz"));
    }
    private String trackLabel(Format f,int index,boolean selected){
        String name=f.label!=null?f.label:f.language!=null?f.language:"Track "+(index+1);
        if(f.sampleMimeType!=null)name+=" · "+f.sampleMimeType.replace("audio/", "").replace("application/", "");
        if(f.channelCount>0)name+=" · "+f.channelCount+" ch";
        return (selected?"✓ ":"")+name;
    }
    void subtitleAppearance(){if(subtitles==null)return;android.content.SharedPreferences p=UiSettings.prefs(getContext());subtitles.setFractionalTextSize(p.getFloat("subtitleSize",.0533f));subtitles.setBottomPaddingFraction(p.getFloat("subtitleBottom",.08f));subtitles.setStyle(new androidx.media3.ui.CaptionStyleCompat(p.getInt("subtitleColor",android.graphics.Color.WHITE),android.graphics.Color.TRANSPARENT,android.graphics.Color.TRANSPARENT,androidx.media3.ui.CaptionStyleCompat.EDGE_TYPE_OUTLINE,android.graphics.Color.BLACK,null));}
    void languagePreferences(){if(exo==null)return;android.content.SharedPreferences p=UiSettings.prefs(getContext());exo.setTrackSelectionParameters(exo.getTrackSelectionParameters().buildUpon().setPreferredAudioLanguage(p.getString("preferredAudio",null)).setPreferredTextLanguage(p.getString("preferredSubtitle",null)).setForceLowestBitrate(p.getBoolean("videoDataSaver",false)).build());}
    String qualityLabel(){Format f=exo==null?null:exo.getVideoFormat();int h=exo!=null?(f!=null?f.height:0):height;return h>1?h+"p":UiSettings.text(getContext(),"الجودة","Quality");}
    java.util.List<PlayerChoice> chromeQualities(Runnable refresh){
      ArrayList<PlayerChoice> choices=new ArrayList<>();if(exo==null)return choices;
      TrackSelectionParameters current=exo.getTrackSelectionParameters();boolean automatic=!current.forceLowestBitrate;for(Tracks.Group group:exo.getCurrentTracks().getGroups())if(group.getType()==C.TRACK_TYPE_VIDEO&&current.overrides.containsKey(group.getMediaTrackGroup()))automatic=false;
      choices.add(new PlayerChoice(UiSettings.text(getContext(),"تلقائي","Auto"),automatic,()->{if(exo==null)return;exo.setTrackSelectionParameters(exo.getTrackSelectionParameters().buildUpon().clearOverridesOfType(C.TRACK_TYPE_VIDEO).setForceLowestBitrate(false).build());UiSettings.prefs(getContext()).edit().putBoolean("videoDataSaver",false).apply();refresh.run();}));
      for(Tracks.Group group:exo.getCurrentTracks().getGroups())if(group.getType()==C.TRACK_TYPE_VIDEO)for(int i=0;i<group.length;i++)if(group.isTrackSupported(i)){final int index=i;Format f=group.getTrackFormat(i);TrackSelectionOverride override=current.overrides.get(group.getMediaTrackGroup());boolean selected=override!=null&&override.trackIndices.contains(i);String label=f.height>0?f.height+"p":UiSettings.text(getContext(),"جودة المصدر","Source quality");if(f.bitrate>0)label+=" · "+String.format(Locale.US,"%.1f Mbps",f.bitrate/1000000f);choices.add(new PlayerChoice(label,selected,()->{if(exo==null)return;exo.setTrackSelectionParameters(exo.getTrackSelectionParameters().buildUpon().clearOverridesOfType(C.TRACK_TYPE_VIDEO).setForceLowestBitrate(false).setOverrideForType(new TrackSelectionOverride(group.getMediaTrackGroup(),index)).build());UiSettings.prefs(getContext()).edit().putBoolean("videoDataSaver",false).apply();refresh.run();}));}
      return choices;
    }
    java.util.List<PlayerChoice> chromeTracks(int mediaType,Runnable external,Runnable refresh){
      ArrayList<PlayerChoice> choices=new ArrayList<>();if(exo==null)return choices;final int type=mediaType==MediaPlayer.TrackInfo.MEDIA_TRACK_TYPE_AUDIO?C.TRACK_TYPE_AUDIO:C.TRACK_TYPE_TEXT;boolean disabled=exo.getTrackSelectionParameters().disabledTrackTypes.contains(type);boolean selectedText=false;for(Tracks.Group g:exo.getCurrentTracks().getGroups())if(g.getType()==type&&g.isSelected())selectedText=true;
      if(type==C.TRACK_TYPE_TEXT)choices.add(new PlayerChoice(UiSettings.text(getContext(),"إيقاف","Off"),disabled||!selectedText,()->{if(exo==null)return;exo.setTrackSelectionParameters(exo.getTrackSelectionParameters().buildUpon().clearOverridesOfType(type).setTrackTypeDisabled(type,true).build());refresh.run();}));
      for(Tracks.Group group:exo.getCurrentTracks().getGroups())if(group.getType()==type)for(int i=0;i<group.length;i++)if(group.isTrackSupported(i)){final int index=i;Format f=group.getTrackFormat(i);String label=f.label!=null?f.label:f.language!=null&&!f.language.equals("und")?new Locale(f.language).getDisplayLanguage():"Track "+(i+1);choices.add(new PlayerChoice(label,!disabled&&group.isTrackSelected(i),()->{if(exo==null)return;exo.setTrackSelectionParameters(exo.getTrackSelectionParameters().buildUpon().clearOverridesOfType(type).setTrackTypeDisabled(type,false).setOverrideForType(new TrackSelectionOverride(group.getMediaTrackGroup(),index)).build());refresh.run();}));}
      if(external!=null)choices.add(new PlayerChoice(UiSettings.text(getContext(),"فتح ملف ترجمة…","Open subtitle file…"),false,external));return choices;
    }
    void qualityMenu(android.app.Activity activity){
      if(exo==null){new android.app.AlertDialog.Builder(activity).setTitle(UiSettings.text(activity,"جودة البث","Stream quality")).setMessage(UiSettings.text(activity,"تغيير الجودة يحتاج مشغّل Media3 وبثًا يوفّر أكثر من جودة. دقة الفيديو الحالية: ","Quality switching requires Media3 and multiple variants. Current video resolution: ")+qualityLabel()).setPositiveButton("OK",null).show();return;}
      final ArrayList<Tracks.Group> groups=new ArrayList<>();final ArrayList<Integer> indices=new ArrayList<>();ArrayList<String> names=new ArrayList<>();final java.util.Set<String> variants=new java.util.HashSet<>();
      for(Tracks.Group g:exo.getCurrentTracks().getGroups())if(g.getType()==C.TRACK_TYPE_VIDEO)for(int i=0;i<g.length;i++)if(g.isTrackSupported(i)){Format f=g.getTrackFormat(i);groups.add(g);indices.add(i);variants.add(f.width+"x"+f.height+":"+f.bitrate);names.add((g.isTrackSelected(i)?"✓ ":"")+value(f.height,"p")+" · "+(f.bitrate>0?String.format(java.util.Locale.US,"%.2f Mbps",f.bitrate/1000000f):UiSettings.text(activity,"معدل البيانات غير متاح","Bitrate unavailable")));}
      names.add(0,UiSettings.text(activity,"توفير الإنترنت · أقل جودة متاحة","Data saver · lowest available quality"));names.add(0,UiSettings.text(activity,"تلقائي","Auto"));
      new android.app.AlertDialog.Builder(activity).setTitle(UiSettings.text(activity,"جودة البث المتاحة","Available stream quality")+" · "+qualityLabel()).setItems(names.toArray(new String[0]),(d,i)->{if(exo==null)return;TrackSelectionParameters.Builder selection=exo.getTrackSelectionParameters().buildUpon().clearOverridesOfType(C.TRACK_TYPE_VIDEO).setForceLowestBitrate(i==1);UiSettings.prefs(getContext()).edit().putBoolean("videoDataSaver",i==1).apply();if(i>=2)selection.setOverrideForType(new TrackSelectionOverride(groups.get(i-2).getMediaTrackGroup(),indices.get(i-2)));exo.setTrackSelectionParameters(selection.build());}).show();
    }
    void trackMenu(android.app.Activity activity,int mediaType,String title,String off,String unavailable,Runnable external,String externalLabel){
        if(exo==null)return;int type=mediaType==MediaPlayer.TrackInfo.MEDIA_TRACK_TYPE_AUDIO?C.TRACK_TYPE_AUDIO:C.TRACK_TYPE_TEXT;
        ArrayList<Tracks.Group> groups=new ArrayList<>();ArrayList<Integer> indices=new ArrayList<>();ArrayList<String> labels=new ArrayList<>();
        if(type==C.TRACK_TYPE_TEXT){groups.add(null);indices.add(-1);labels.add(off);}
        for(Tracks.Group group:exo.getCurrentTracks().getGroups())if(group.getType()==type)for(int index=0;index<group.length;index++)if(group.isTrackSupported(index)){Format format=group.getTrackFormat(index);groups.add(group);indices.add(index);labels.add(trackLabel(format,index,group.isTrackSelected(index)));}
        if(external!=null){groups.add(null);indices.add(-2);labels.add(externalLabel);}
        if(labels.size()<=(type==C.TRACK_TYPE_TEXT?1:0)){android.widget.Toast.makeText(activity,unavailable,1).show();return;}
        new android.app.AlertDialog.Builder(activity).setTitle(title).setItems(labels.toArray(new String[0]),(dialog,index)->{if(exo==null)return;if(indices.get(index)==-2){external.run();return;}TrackSelectionParameters.Builder selection=exo.getTrackSelectionParameters().buildUpon().clearOverridesOfType(type).setTrackTypeDisabled(type,indices.get(index)<0);if(indices.get(index)>=0)selection.setOverrideForType(new TrackSelectionOverride(groups.get(index).getMediaTrackGroup(),indices.get(index)));exo.setTrackSelectionParameters(selection.build());}).setNeutralButton(UiSettings.text(activity,"التفضيلات","Preferences"),(dialog,which)->playbackPreferences(activity)).show();
    }
    private void playbackPreferences(android.app.Activity activity){String[] labels={UiSettings.text(activity,"لغة الصوت المفضلة","Preferred audio language"),UiSettings.text(activity,"لغة الترجمة المفضلة","Preferred subtitle language"),UiSettings.text(activity,"حجم الترجمة","Subtitle size"),UiSettings.text(activity,"لون الترجمة","Subtitle color"),UiSettings.text(activity,"موضع الترجمة","Subtitle position"),UiSettings.text(activity,"جودة البث","Stream quality")};new android.app.AlertDialog.Builder(activity).setTitle(UiSettings.text(activity,"تفضيلات التشغيل","Playback preferences")).setItems(labels,(d,index)->{
      if(index==5){qualityMenu(activity);return;}final android.content.SharedPreferences p=UiSettings.prefs(getContext());String[] choices=index<2?new String[]{"Auto","العربية","English","Français","Español","Deutsch"}:index==2?new String[]{"Small","Normal","Large"}:index==3?new String[]{"White","Yellow","Cyan"}:new String[]{"Bottom","Raised","High"};
      new android.app.AlertDialog.Builder(activity).setTitle(labels[index]).setItems(choices,(dd,choice)->{android.content.SharedPreferences.Editor edit=p.edit();if(index<2){String language=new String[]{null,"ar","en","fr","es","de"}[choice];edit.putString(index==0?"preferredAudio":"preferredSubtitle",language).apply();languagePreferences();}else{if(index==2)edit.putFloat("subtitleSize",new float[]{.04f,.0533f,.07f}[choice]);if(index==3)edit.putInt("subtitleColor",new int[]{android.graphics.Color.WHITE,android.graphics.Color.YELLOW,android.graphics.Color.CYAN}[choice]);if(index==4)edit.putFloat("subtitleBottom",new float[]{.08f,.16f,.25f}[choice]);edit.apply();subtitleAppearance();}}).show();}).show();
    }
    void subtitle(Uri uri,String mime){if(exo==null||exo.getCurrentMediaItem()==null)return;long position=exo.getCurrentPosition();boolean playing=exo.getPlayWhenReady();MediaItem.SubtitleConfiguration subtitle=new MediaItem.SubtitleConfiguration.Builder(uri).setMimeType(mime).setSelectionFlags(C.SELECTION_FLAG_DEFAULT).build();MediaItem item=exo.getCurrentMediaItem().buildUpon().setSubtitleConfigurations(java.util.Collections.singletonList(subtitle)).build();exo.setTrackSelectionParameters(exo.getTrackSelectionParameters().buildUpon().clearOverridesOfType(C.TRACK_TYPE_TEXT).setTrackTypeDisabled(C.TRACK_TYPE_TEXT,false).build());exo.setMediaItem(item,position);exo.prepare();exo.setPlayWhenReady(playing);}
    void stopPlayback(){systemEngine=null;epoch++;ready=waiting=seeking=false;seekComplete=null;sizeChanged=null;if(exo!=null){exo.release();exo=null;}if(system!=null){system.stopPlayback();system=null;}subtitles=null;surface=null;removeAllViews();}
}

