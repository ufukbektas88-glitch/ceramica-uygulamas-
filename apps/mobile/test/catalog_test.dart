import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ceramica/catalog.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));
  test('kaynaklı gerçek katalogda resim ve bağlantılar eksiksizdir', () async {
    final data = jsonDecode(await rootBundle.loadString('assets/catalog.json'));
    final products = data['products'] as List;
    expect(products.length, greaterThan(40));
    final ids = <String>{};
    for (final p in products) {
      expect(ids.add(p['id']), isTrue);
      expect(p['name'], isNotEmpty);
      expect(p.containsKey('price'), isFalse);
      expect(p.containsKey('availableBoxes'), isFalse);
      expect(p['name'].toString().contains('Demo'), isFalse);
      expect(Uri.parse(p['sourceUrl']).scheme, 'https');
      for (final image in p['images']) {
        expect(File(image['path']).existsSync(), isTrue);
      }
      for (final v in p['variants']) {
        expect(File(v['imagePath']).existsSync(), isTrue);
      }
    }
    expect(
        (data['sources'] as List).map((s) => Uri.parse(s['url']).host).toSet(),
        {'ceramicabanyo.com', 'www.graniser.com.tr', 'www.duratiles.com.tr'});
  });
  test(
      'marka arama kategori ve Türkçe karakter filtreleri gerçek kayıtlarda çalışır',
      () async {
    final store = CatalogStore();
    await store.load();
    expect(store.filter(brand: 'Graniser'), isNotEmpty);
    expect(
        store.filter(brand: 'Duratiles').every((p) => p.brand == 'Duratiles'),
        isTrue);
    expect(normalize('IŞIK İNCİ ÖLÇÜ'), 'isik inci olcu');
    final p = store.products.first;
    expect(store.filter(query: p.name).any((i) => i.id == p.id), isTrue);
    expect(store.filter(query: 'varolmayan-koleksiyon-999'), isEmpty);
    expect(
        store
            .filter(category: 'Banyo Dolabı')
            .every((p) => p.category == 'Banyo Dolabı'),
        isTrue);
  });
  test('favoriler cihazda kalır ve yeniden açılışta yüklenir', () async {
    final store = CatalogStore();
    await store.load();
    final id = store.products.first.id;
    await store.toggle(id);
    expect(store.filter(favoritesOnly: true).single.id, id);
    final reopened = CatalogStore();
    await reopened.load();
    expect(reopened.favorites.contains(id), isTrue);
    await reopened.toggle(id);
    expect(reopened.filter(favoritesOnly: true), isEmpty);
    await expectLater(reopened.toggle('olmayan-urun'), throwsArgumentError);
  });
  test('cihaz depolama hatası paketli kataloğun açılışını engellemez', () async {
    var attempts = 0;
    final store = CatalogStore(openPreferences: () async {
      attempts++;
      if (attempts == 1) {
        throw PlatformException(code: 'channel-error', message: 'unavailable');
      }
      return SharedPreferences.getInstance();
    });
    await store.load();
    expect(store.products, hasLength(66));
    expect(store.favoritesAvailable, isFalse);
    final id = store.products.first.id;
    await store.toggle(id);
    expect(store.favoritesAvailable, isTrue);
    expect(store.favorites, contains(id));
    final reopened = CatalogStore();
    await reopened.load();
    expect(reopened.favorites, contains(id));
  });
  test('eski kurulumdan kalan hatalı favori türü kataloğu engellemez', () async {
    SharedPreferences.setMockInitialValues({CatalogStore.favoritesKey: 'bozuk'});
    final store = CatalogStore();
    await store.load();
    expect(store.products, hasLength(66));
    expect(store.favorites, isEmpty);
    final id = store.products.first.id;
    await store.toggle(id);
    final reopened = CatalogStore();
    await reopened.load();
    expect(reopened.favorites, contains(id));
  });
  test('yerel kaynakta sipariş oturum veya API istemcisi yoktur', () {
    final files = Directory('lib')
        .listSync()
        .whereType<File>()
        .where((f) => f.path.endsWith('.dart'));
    final source = files.map((f) => f.readAsStringSync()).join('\n');
    for (final forbidden in [
      'auth/login',
      'api/v1',
      'idempotencyKey',
      'server_url',
      'Siparişlerim',
      'Oturum aç',
      'Demo Katalog'
    ]) {
      expect(source.contains(forbidden), isFalse, reason: forbidden);
    }
  });
}
