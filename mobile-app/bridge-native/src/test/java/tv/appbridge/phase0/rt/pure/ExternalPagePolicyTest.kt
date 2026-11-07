package tv.appbridge.phase0.rt.pure

import org.junit.Assert.assertEquals
import org.junit.Test
import tv.appbridge.phase0.rt.pure.ExternalPagePolicy.Action

class ExternalPagePolicyTest {
    @Test fun appOwnedBrowserTaskStaysOnTvWithoutMovingPhoneBrowser() {
        assertEquals(Action.MOVE_SELECTED_APP, ExternalPagePolicy.decide(7,"app.selected",0,"com.android.chrome","app.selected",true,true))
        assertEquals(Action.NONE, ExternalPagePolicy.decide(7,"app.selected",0,"com.android.chrome","com.android.chrome",true,true))
    }
    @Test fun explicitOptOutAllowsPhoneTaskWhilePreservingExternalPageProtection() {
        assertEquals(Action.NONE, ExternalPagePolicy.decide(7,"app.selected",0,"app.selected","app.selected",true,true,keepOnTv=false))
        assertEquals(Action.CLOSE_EXTERNAL_PAGE, ExternalPagePolicy.decide(7,"app.selected",7,"com.android.chrome","app.selected",true,true,keepOnTv=false))
    }
    @Test fun phoneBrowserIsNeverClosed() {
        assertEquals(Action.NONE, ExternalPagePolicy.decide(7, "app.selected", 0, "com.android.chrome", "com.android.chrome", true, true))
    }
    @Test fun closesBrowserOnlyOnBridgeDisplay() {
        assertEquals(Action.CLOSE_EXTERNAL_PAGE, ExternalPagePolicy.decide(7, "app.selected", 7, "com.android.chrome", "app.selected", true, true))
        assertEquals(Action.NONE, ExternalPagePolicy.decide(7, "app.selected", 8, "com.android.chrome", "app.selected", true, true))
    }
    @Test fun selectedAppCanBeABrowser() {
        assertEquals(Action.NONE, ExternalPagePolicy.decide(7, "com.android.chrome", 7, "com.android.chrome", "com.android.chrome", true, true))
    }
    @Test fun disabledAndHiddenPagesAreLeftAlone() {
        assertEquals(Action.NONE, ExternalPagePolicy.decide(7, "app.selected", 7, "com.android.chrome", "app.selected", true, false))
        assertEquals(Action.NONE, ExternalPagePolicy.decide(7, "app.selected", 7, "com.android.chrome", "app.selected", false, true))
    }
    @Test fun onlySelectedAppCanMoveOffPhone() {
        assertEquals(Action.MOVE_SELECTED_APP, ExternalPagePolicy.decide(7, "app.selected", 0, "app.selected", "app.selected", true, true))
        assertEquals(Action.NONE, ExternalPagePolicy.decide(7, "app.selected", 0, "app.other", "app.other", true, true))
        assertEquals(Action.NONE, ExternalPagePolicy.decide(7, "app.selected", 0, "app.selected", null, true, true))
    }
}
