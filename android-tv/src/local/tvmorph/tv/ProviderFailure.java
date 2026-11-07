package local.tvmorph.tv;
/** User-facing transport errors never expose provider URLs, credentials or raw TLS internals. */
final class ProviderFailure {
 static boolean tlsProtocol(Throwable error){for(int i=0;error!=null&&i<10;i++,error=error.getCause()){String text=String.valueOf(error.getMessage()).toLowerCase(java.util.Locale.ROOT);if(text.contains("tls packet header")||text.contains("unrecognized ssl message")||text.contains("plaintext connection")||text.contains("wrong version number")||text.contains("not an ssl/tls record"))return true;}return false;}
 static String message(Throwable error){if(tlsProtocol(error))return "TLS_PROTOCOL_MISMATCH: السيرفر أو المنفذ لا يدعم HTTPS بهذا العنوان. راجع بروتوكول رابط المزوّد.";String text=error==null?null:error.getMessage();return text==null||text.trim().isEmpty()?"تعذّر الاتصال بالمزوّد.":text;}
}
