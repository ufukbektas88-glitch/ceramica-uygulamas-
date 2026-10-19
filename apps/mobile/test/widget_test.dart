import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ceramica/main.dart';
import 'package:ceramica/screens.dart';
import 'package:ceramica/catalog.dart';

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));
  testWidgets('açılışta CERAMICA showroom ve gerçek görseller vardır',
      (tester) async {
    final store = CatalogStore();
    await tester.runAsync(store.load);
    await tester.pumpWidget(Ceramica(store: store));
    await tester.pumpAndSettle();
    expect(find.text('CERAMICA'), findsOneWidget);
    expect(find.text('Doğal dokular.\nZamansız mekânlar.'), findsOneWidget);
    expect(find.byType(Photo), findsWidgets);
    expect(find.text('Siparişler'), findsNothing);
    expect(find.text('Oturum aç'), findsNothing);
  });
  testWidgets('favori depolama arızasında hata ekranı yerine katalog açılır',
      (tester) async {
    final store = CatalogStore(openPreferences: () async {
      throw PlatformException(code: 'channel-error');
    });
    await tester.runAsync(store.load);
    await tester.pumpWidget(Ceramica(store: store));
    await tester.pumpAndSettle();
    expect(find.text('CERAMICA'), findsOneWidget);
    expect(find.text('Katalog açılamadı.'), findsNothing);
    await tester.tap(find.byIcon(Icons.grid_view_outlined));
    await tester.pumpAndSettle();
    expect(find.byType(CollectionCard), findsWidgets);
    await tester.tap(find.byTooltip('Favorilere ekle').first);
    await tester.pumpAndSettle();
    expect(find.text('Favori cihazınıza kaydedilemedi. Lütfen tekrar deneyin.'),
        findsOneWidget);
    expect(find.byType(CollectionCard), findsWidgets);
  });
  testWidgets('katalog araması ve yerel favori akışı çalışır', (tester) async {
    final store = CatalogStore();
    await tester.runAsync(store.load);
    await tester.pumpWidget(Ceramica(store: store));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.grid_view_outlined));
    await tester.pumpAndSettle();
    expect(find.byType(TextField), findsOneWidget);
    final name = store.products.first.name;
    await tester.enterText(find.byType(TextField), name);
    await tester.pumpAndSettle();
    expect(find.byType(CollectionCard), findsWidgets);
    await tester.tap(find.byTooltip('Favorilere ekle').first);
    await tester.pumpAndSettle();
    expect(store.favorites, isNotEmpty);
    await tester.tap(find.byIcon(Icons.favorite_border).last);
    await tester.pumpAndSettle();
    expect(find.text('Favorileriniz.'), findsOneWidget);
    await tester.tap(find.byType(CollectionCard).first);
    await tester.pumpAndSettle();
    expect(find.byType(CollectionDetail), findsOneWidget);
    expect(find.byTooltip('Favorilerden kaldır'), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();
  });
  testWidgets('ziyaret ekranında iletişim ve üç site bağlantısı vardır',
      (tester) async {
    final store = CatalogStore();
    await tester.runAsync(store.load);
    await tester.pumpWidget(Ceramica(store: store));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.location_on_outlined));
    await tester.pumpAndSettle();
    expect(find.text('Birlikte keşfedelim.'), findsOneWidget);
    expect(find.text('CERAMICA Küçükçekmece'), findsOneWidget);
  });
}
