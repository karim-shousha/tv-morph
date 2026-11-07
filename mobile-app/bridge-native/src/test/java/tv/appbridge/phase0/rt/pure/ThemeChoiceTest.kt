package tv.appbridge.phase0.rt.pure

import org.junit.Assert.assertEquals
import org.junit.Test

class ThemeChoiceTest {
    @Test fun explicitChoiceDoesNotFollowSystem() {
        assertEquals("light", ThemeChoice.resolve("light", true))
        assertEquals("dark", ThemeChoice.resolve("dark", false))
    }
    @Test fun automaticChoiceFollowsSystem() {
        assertEquals("dark", ThemeChoice.resolve("system", true))
        assertEquals("light", ThemeChoice.resolve("system", false))
        assertEquals("light", ThemeChoice.resolve("invalid", true))
    }
}
