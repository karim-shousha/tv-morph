import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/theme/morph_colors.dart';
import '../../core/widgets/morph_widgets.dart';
import '../../providers/tv_models.dart';
import '../../services/app_state.dart';

class DevicesScreen extends StatelessWidget {
  const DevicesScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final t = MorphLocalizations.of(context);
    final app = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(automaticallyImplyLeading: false, title: Text(t.get('devicesTitle'))),
      body: Padding(
        padding: EdgeInsets.all(18),
        child: Column(
          children: [
            Expanded(
              child: app.saved.isEmpty
                  ? Center(
                      child: Text(
                        t.get('noDevices'),
                        textAlign: TextAlign.center,
                      ),
                    )
                  : ListView.separated(
                      itemCount: app.saved.length,
                      separatorBuilder: (_, __) => SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final d = app.saved[i];
                        final active = app.selected?.id == d.id;
                        return GlassCard(
                          glow: active,
                          onTap: () async {
                            await app.selectAndConnect(d);
                            if (context.mounted) {
                              Navigator.of(context).pushNamedAndRemoveUntil(
                                '/remote',
                                (_) => false,
                              );
                            }
                          },
                          child: Row(
                            textDirection: TextDirection.ltr,
                            children: [
                              Icon(
                                Icons.tv,
                                color: active
                                    ? MorphColors.success
                                    : MorphColors.cyan,
                              ),
                              SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      d.displayName,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    Text(
                                      '${brandLabel(d.brand)} • ${d.ip}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: MorphColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (active)
                                Icon(
                                  Icons.check_circle,
                                  color: MorphColors.success,
                                  size: 20,
                                ),
                              PopupMenuButton<String>(
                                onSelected: (v) async {
                                  if (v == 'forget') {
                                    await app.forget(d.id);
                                  } else if (v == 'rename') {
                                    await _rename(context, app, d);
                                  }
                                },
                                itemBuilder: (_) => [
                                  PopupMenuItem(
                                    value: 'rename',
                                    child: Text(t.get('nickname')),
                                  ),
                                  PopupMenuItem(
                                    value: 'forget',
                                    child: Text(t.get('forget')),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
            MorphPrimaryButton(
              label: t.get('findMyTv'),
              icon: Icons.add,
              onPressed: () => Navigator.of(context).pushNamed('/discovery'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _rename(BuildContext context, AppState app, TvDevice d) async {
    final c = TextEditingController(text: d.nickname ?? '');
    final name = await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Nickname'),
        content: TextField(
          controller: c,
          decoration: InputDecoration(hintText: 'Living Room TV'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(minimumSize: Size(90, 42)),
            onPressed: () => Navigator.pop(context, c.text.trim()),
            child: Text('OK'),
          ),
        ],
      ),
    );
    if (name != null) {
      await app.repo.upsert(d.copyWith(nickname: name));
      app.saved = await app.repo.load();
      // ignore: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
      app.notifyListeners();
    }
  }
}
