package local.tvmorph.tv;

final class PlayerChoice {
  final String label; final boolean selected; final Runnable apply;
  PlayerChoice(String label,boolean selected,Runnable apply){this.label=label;this.selected=selected;this.apply=apply;}
}
