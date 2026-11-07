package tv.appbridge.phase0.rt.tv

import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class WgtPackageTest {
    private fun archive(manifest: String): File = File.createTempFile("morph-wgt-", ".wgt").apply {
        deleteOnExit()
        ZipOutputStream(outputStream()).use { z ->
            z.putNextEntry(ZipEntry("config.xml")); z.write(manifest.toByteArray()); z.closeEntry()
            z.putNextEntry(ZipEntry("padding.bin")); z.write(ByteArray(4096).apply { java.util.Random(1).nextBytes(this) }); z.closeEntry()
        }
    }
    private val xml = """<widget xmlns="http://www.w3.org/ns/widgets" xmlns:tizen="http://tizen.org/ns/widgets" version="1.2.3"><name>Example &amp; TV</name><tizen:application id="AppBridge1.Example" package="AppBridge1" required_version="4.0"/></widget>"""
    @Test fun readsActualPackageInsteadOfAssumingBridgeId() {
        val result = WgtPackage.inspect(archive(xml))
        assertEquals("Example & TV", result.name)
        assertEquals("AppBridge1.Example", result.appId)
        assertEquals("1.2.3", result.version)
        assertFalse(result.hasSignatures)
    }
    @Test(expected = IllegalArgumentException::class) fun rejectsShellCharactersInPackageId() {
        WgtPackage.inspect(archive(xml.replace("package=\"AppBridge1\"", "package=\"abc;reboot\"")))
    }
    @Test(expected = IllegalArgumentException::class) fun refusesExternalEntities() {
        WgtPackage.inspect(archive("<!DOCTYPE widget [<!ENTITY secret SYSTEM 'file:///etc/passwd'>]>" + xml.replace("Example &amp; TV", "&secret;")))
    }
}
