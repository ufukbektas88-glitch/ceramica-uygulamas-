import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'catalog.dart';
import 'screens.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  LicenseRegistry.addLicense(() async* {
    for (final name in ['CormorantGaramond', 'Manrope']) {
      yield LicenseEntryWithLineBreaks(
          [name], await rootBundle.loadString('assets/fonts/$name-OFL.txt'));
    }
  });
  runApp(const Ceramica());
}

const ink = Color(0xff272e28),
    paper = Color(0xfff6f4ef),
    sage = Color(0xff63705b),
    line = Color(0xffe5e5dc);

class Ceramica extends StatelessWidget {
  const Ceramica({super.key, this.store});
  final CatalogStore? store;
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'CERAMICA',
        theme: ThemeData(
          useMaterial3: true,
          fontFamily: 'Manrope',
          scaffoldBackgroundColor: paper,
          colorScheme: ColorScheme.fromSeed(seedColor: sage, surface: paper),
          appBarTheme: const AppBarTheme(
              backgroundColor: paper,
              surfaceTintColor: Colors.transparent,
              foregroundColor: ink),
          textTheme: const TextTheme(
              bodyMedium: TextStyle(color: ink, height: 1.65),
              bodySmall: TextStyle(color: Color(0xff7f8578), height: 1.6)),
          navigationBarTheme: NavigationBarThemeData(
              backgroundColor: paper,
              indicatorColor: const Color(0xffe8ecdf),
              labelTextStyle: WidgetStateProperty.all(
                  const TextStyle(fontSize: 10, fontWeight: FontWeight.w600))),
        ),
        home: CatalogLoader(store: store),
      );
}

class CatalogLoader extends StatefulWidget {
  const CatalogLoader({super.key, this.store});
  final CatalogStore? store;
  @override
  State<CatalogLoader> createState() => _CatalogLoaderState();
}

class _CatalogLoaderState extends State<CatalogLoader> {
  late CatalogStore store;
  late Future<void> loading;
  @override
  void initState() {
    super.initState();
    store = widget.store ?? CatalogStore();
    loading = store.load();
  }

  @override
  void dispose() {
    if (widget.store == null) store.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<void>(
      future: loading,
      builder: (context, s) {
        if (s.hasError) {
          debugPrint('CERAMICA bundled catalog: ${s.error}');
          return Scaffold(
              body: SafeArea(
                  child: Center(
                      child: Padding(
                          padding: const EdgeInsets.all(28),
                          child:
                              Column(mainAxisSize: MainAxisSize.min, children: [
                            const Text('Katalog açılamadı.',
                                style: TextStyle(fontSize: 22)),
                            const SizedBox(height: 16),
                            const Text(
                                'Telefondaki katalog dosyası okunamadı. Lütfen uygulamayı güncelleyip yeniden deneyin.'),
                            TextButton(
                                onPressed: () =>
                                    setState(() => loading = store.load()),
                                child: const Text('Tekrar dene'))
                          ])))));
        }
        if (s.connectionState != ConnectionState.done) {
          return const Scaffold(
              body: Center(child: CircularProgressIndicator(color: sage)));
        }
        return Showroom(store: store);
      });
}

Future<void> openReference(BuildContext context, String url) async {
  final uri = Uri.parse(url);
  if (!['https', 'tel', 'mailto'].contains(uri.scheme)) return;
  try {
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw StateError('Adres açılamadı');
    }
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text(
              'Bağlantı açılamadı. İnternet bağlantınızı ve uygun uygulamayı kontrol edin.')));
    }
  }
}

Future<void> favorite(
    BuildContext context, CatalogStore store, String id) async {
  try {
    await store.toggle(id);
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content:
              Text('Favori cihazınıza kaydedilemedi. Lütfen tekrar deneyin.')));
    }
  }
}

class Showroom extends StatefulWidget {
  const Showroom({super.key, required this.store});
  final CatalogStore store;
  @override
  State<Showroom> createState() => _ShowroomState();
}

class _ShowroomState extends State<Showroom> {
  int tab = 0;
  String brand = '';
  void catalog([String selected = '']) {
    setState(() {
      brand = selected;
      tab = 1;
    });
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
      animation: widget.store,
      builder: (context, _) => Scaffold(
            body: SafeArea(
                bottom: false,
                child: switch (tab) {
                  0 => ExploreScreen(store: widget.store, onCatalog: catalog),
                  1 => CollectionsScreen(
                      key: ValueKey(brand),
                      store: widget.store,
                      initialBrand: brand),
                  2 => CollectionsScreen(
                      store: widget.store,
                      favoritesOnly: true,
                      onExplore: () => catalog()),
                  _ => VisitScreen(store: widget.store)
                }),
            bottomNavigationBar: NavigationBar(
                selectedIndex: tab,
                onDestinationSelected: (i) => setState(() {
                      if (i == 1) brand = '';
                      tab = i;
                    }),
                destinations: const [
                  NavigationDestination(
                      icon: Icon(Icons.home_outlined),
                      selectedIcon: Icon(Icons.home),
                      label: 'Keşfet'),
                  NavigationDestination(
                      icon: Icon(Icons.grid_view_outlined),
                      selectedIcon: Icon(Icons.grid_view_rounded),
                      label: 'Koleksiyonlar'),
                  NavigationDestination(
                      icon: Icon(Icons.favorite_border),
                      selectedIcon: Icon(Icons.favorite),
                      label: 'Favoriler'),
                  NavigationDestination(
                      icon: Icon(Icons.location_on_outlined),
                      selectedIcon: Icon(Icons.location_on),
                      label: 'Ziyaret'),
                ]),
          ));
}

Widget eyebrow(String text, {Color color = const Color(0xff858b7c)}) =>
    Text(text,
        style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w600,
            letterSpacing: 2,
            color: color));
Widget heading(String text, {double size = 34, Color color = ink}) => Text(text,
    style: TextStyle(
        fontFamily: 'Cormorant',
        fontSize: size,
        fontWeight: FontWeight.w500,
        height: 1.05,
        color: color));

class Photo extends StatelessWidget {
  const Photo(this.path,
      {super.key, this.fit = BoxFit.cover, this.width, this.height});
  final String path;
  final BoxFit fit;
  final double? width, height;
  @override
  Widget build(BuildContext context) => Image.asset(path,
      width: width,
      height: height,
      fit: fit,
      errorBuilder: (_, error, stack) => Container(
          width: width,
          height: height,
          color: line,
          alignment: Alignment.center,
          child: const Icon(Icons.image_not_supported_outlined, color: sage)));
}
