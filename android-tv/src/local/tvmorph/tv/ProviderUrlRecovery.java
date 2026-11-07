package local.tvmorph.tv;
/** Only retry a provider-supplied original candidate once; never synthesize URL variants. */
final class ProviderUrlRecovery{
 static boolean shouldTry(boolean live,int index,int count,int status){return !live&&index==0&&count==2&&(status==403||status==404||status==410);}
}
