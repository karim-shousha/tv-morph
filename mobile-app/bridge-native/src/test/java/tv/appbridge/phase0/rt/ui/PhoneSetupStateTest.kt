package tv.appbridge.phase0.rt.ui

import org.junit.Assert.*
import org.junit.Test

class PhoneSetupStateTest {
    @Test fun savedPairingMustNotClaimHelperIsRunning() {
        assertEquals(4, PhoneSetupState.initial(false, true))
        assertEquals(4, PhoneSetupState.initial(false, true, 5))
    }
    @Test fun restoreCannotSkipUnfinishedPairing() {
        assertEquals(1, PhoneSetupState.initial(false, false))
        assertEquals(2, PhoneSetupState.initial(false, false, 2))
        assertEquals(3, PhoneSetupState.initial(false, false, 5))
        assertEquals(1, PhoneSetupState.initial(false, false, -8))
    }
    @Test fun onlyLiveHelperOpensReadyPage() {
        assertEquals(5, PhoneSetupState.initial(true, false))
        assertEquals(5, PhoneSetupState.initial(true, true, 1))
    }
    @Test fun unicodePairingDigitsPreserveTheirValue() {
        assertEquals("123456", PhoneSetupState.normalizeCode(" ١٢٣٤٥٦ "))
        assertEquals("123456", PhoneSetupState.normalizeCode("۱۲۳۴۵۶"))
        assertFalse(PhoneSetupState.normalizeCode("12A456").matches(Regex("[0-9]{6}")))
        assertFalse(PhoneSetupState.normalizeCode("12345").matches(Regex("[0-9]{6}")))
    }
}
