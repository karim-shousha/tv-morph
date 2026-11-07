package tv.appbridge.phase0.rt.video

import tv.appbridge.phase0.rt.net.HttpVideoServer

interface RuntimeVideoSource : HttpVideoServer.Source {
    val isRunning: Boolean
    val displayId: Int
    fun stop()
}
