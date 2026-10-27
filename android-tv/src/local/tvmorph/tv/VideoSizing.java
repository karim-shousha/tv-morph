package local.tvmorph.tv;
public final class VideoSizing{
 public static int[] measure(String mode,int availableW,int availableH,int sourceW,int sourceH){availableW=Math.max(1,availableW);availableH=Math.max(1,availableH);sourceW=Math.max(1,sourceW);sourceH=Math.max(1,sourceH);if(mode.equals("stretch"))return new int[]{availableW,availableH};double factor=mode.equals("fill")?Math.max((double)availableW/sourceW,(double)availableH/sourceH):Math.min((double)availableW/sourceW,(double)availableH/sourceH);return new int[]{Math.max(1,(int)(sourceW*factor)),Math.max(1,(int)(sourceH*factor))};}
}
