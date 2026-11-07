package tv.appbridge.phase0.rt.pure

object ThemeChoice {
    fun resolve(choice: String, systemDark: Boolean): String =
        if (choice == "dark" || (choice == "system" && systemDark)) "dark" else "light"
}
