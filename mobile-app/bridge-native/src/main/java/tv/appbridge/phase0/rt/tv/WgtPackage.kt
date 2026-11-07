package tv.appbridge.phase0.rt.tv

import java.io.File
import java.io.InputStream
import java.util.zip.ZipFile
import javax.xml.parsers.DocumentBuilderFactory

data class WgtPackage(val name: String, val appId: String, val packageId: String,
    val version: String, val minimumTizen: String, val hasSignatures: Boolean) {
    companion object {
        const val MAX_BYTES = 64 * 1024 * 1024
        fun copyBounded(input: InputStream, target: File) {
            try {
                input.use { source -> target.outputStream().use { out ->
                    val buffer = ByteArray(65536); var total = 0
                    while (true) {
                        val n = source.read(buffer); if (n < 0) break
                        total += n; require(total <= MAX_BYTES) { "حجم ملف WGT أكبر من 64 MB" }
                        out.write(buffer, 0, n)
                    }
                } }
            } catch (e: Exception) { target.delete(); throw e }
        }
        fun inspect(file: File): WgtPackage {
            require(file.length() in 1024..MAX_BYTES.toLong()) { "حجم ملف WGT غير صالح (الحد 64 MB)" }
            return ZipFile(file).use { zip ->
                val entries = zip.entries().asSequence().toList()
                require(entries.size <= 10000) { "ملف WGT يحتوي ملفات أكثر من المسموح" }
                require(entries.sumOf { it.size.coerceAtLeast(0) } <= 256L * 1024 * 1024) { "ملف WGT مضغوط بحجم غير آمن للتلفزيون" }
                require(entries.count { it.name == "config.xml" } == 1) { "ملف WGT لازم يحتوي config.xml واحد في الجذر" }
                val entry = zip.getEntry("config.xml")
                val manifest = zip.getInputStream(entry).use { source ->
                    val out = java.io.ByteArrayOutputStream(); val buffer = ByteArray(4096)
                    while (true) {
                        val n = source.read(buffer); if (n < 0) break
                        require(out.size() + n <= 65536) { "ملف تعريف التطبيق أكبر من المسموح" }
                        out.write(buffer, 0, n)
                    }
                    out.toByteArray()
                }
                require(!manifest.contains(0.toByte())) { "config.xml لازم يكون UTF-8" }
                val xml = manifest.toString(Charsets.UTF_8)
                require(!xml.contains("<!DOCTYPE", true) && !xml.contains("<!ENTITY", true)) { "ملف التعريف يحتوي XML غير مسموح" }
                val factory = DocumentBuilderFactory.newInstance().apply {
                    isNamespaceAware = true; isExpandEntityReferences = false
                    // Android's parser does not support every desktop SAX feature.
                    // The bounded UTF-8 preflight above forbids DTD/entity declarations.
                    try { setFeature("http://apache.org/xml/features/disallow-doctype-decl", true) } catch (_: Exception) { }
                    try { setFeature("http://xml.org/sax/features/external-general-entities", false) } catch (_: Exception) { }
                    try { setFeature("http://xml.org/sax/features/external-parameter-entities", false) } catch (_: Exception) { }
                }
                val doc = factory.newDocumentBuilder().parse(manifest.inputStream())
                val widget = doc.documentElement
                require(widget.localName == "widget") { "الملف مش حزمة Tizen Web صالحة" }
                val app = doc.getElementsByTagNameNS("http://tizen.org/ns/widgets", "application").item(0)
                    as? org.w3c.dom.Element ?: error("بيانات تطبيق Tizen غير موجودة في config.xml")
                val pkg = app.getAttribute("package")
                val id = app.getAttribute("id")
                require(pkg.matches(Regex("[A-Za-z0-9]{10}"))) { "معرّف حزمة Tizen لازم يكون 10 حروف أو أرقام" }
                require(id.startsWith("$pkg.") && id.matches(Regex("[A-Za-z0-9._-]{12,128}"))) { "معرّف تطبيق Tizen غير صالح" }
                val names = doc.getElementsByTagNameNS("http://www.w3.org/ns/widgets", "name")
                val name = names.item(0)?.textContent?.trim()?.take(100)?.ifEmpty { null } ?: id
                WgtPackage(name, id, pkg, widget.getAttribute("version").take(40),
                    app.getAttribute("required_version").take(40), zip.getEntry("author-signature.xml") != null && zip.getEntry("signature1.xml") != null)
            }
        }
    }
}
