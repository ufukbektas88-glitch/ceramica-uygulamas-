import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

String normalize(String value) => value
    .replaceAll('İ', 'i')
    .replaceAll('I', 'ı')
    .toLowerCase()
    .replaceAll('ı', 'i')
    .replaceAll('ş', 's')
    .replaceAll('ç', 'c')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ö', 'o');

class CollectionItem {
  CollectionItem.fromJson(Map<String, dynamic> data)
      : id = data['id'],
        name = data['name'],
        brand = data['brand'],
        category = data['category'],
        description = data['description'] ?? '',
        sourceUrl = data['sourceUrl'],
        images =
            (data['images'] as List).map((i) => i['path'] as String).toList(),
        variants = (data['variants'] as List? ?? [])
            .map((i) => Map<String, dynamic>.from(i))
            .toList(),
        facts = (data['facts'] as List? ?? [])
            .map((i) => (i as List).map((s) => s.toString()).toList())
            .where((i) => i.length >= 2 && i[1].trim().isNotEmpty)
            .toList();
  final String id, name, brand, category, description, sourceUrl;
  final List<String> images;
  final List<List<String>> facts;
  final List<Map<String, dynamic>> variants;
  String get size =>
      facts
          .where((f) => normalize(f[0]).contains('ebat'))
          .map((f) => f[1])
          .firstOrNull ??
      category;
  bool matches(String query) => normalize(
          '$name $brand $category ${facts.map((f) => f.join(' ')).join(' ')}')
      .contains(normalize(query.trim()));
}

class CatalogStore extends ChangeNotifier {
  CatalogStore({Future<SharedPreferences> Function()? openPreferences})
      : _openPreferences = openPreferences ?? SharedPreferences.getInstance;
  final Future<SharedPreferences> Function() _openPreferences;
  static const favoritesKey = 'ceramica_showroom_favorites_v1';
  late Map<String, dynamic> data;
  late List<CollectionItem> products;
  SharedPreferences? _preferences;
  bool get favoritesAvailable => _preferences != null;
  Set<String> favorites = {};
  bool _loaded = false;
  Future<void> load() async {
    if (_loaded) return;
    data = jsonDecode(await rootBundle.loadString('assets/catalog.json'))
        as Map<String, dynamic>;
    products = (data['products'] as List)
        .map((i) => CollectionItem.fromJson(Map<String, dynamic>.from(i)))
        .toList();
    // Device storage is optional: its failure must never hide bundled products.
    try {
      final preferences = await _openPreferences();
      _preferences = preferences;
      final valid = products.map((p) => p.id).toSet();
      try {
        favorites = (preferences.getStringList(favoritesKey) ?? [])
            .where(valid.contains)
            .toSet();
      } catch (error, stack) {
        // A wrong-typed value from a previous installation is not a catalog error.
        debugPrint('CERAMICA favorites value: $error\n$stack');
        favorites = {};
      }
    } catch (error, stack) {
      debugPrint('CERAMICA favorites storage: $error\n$stack');
    }
    _loaded = true;
    notifyListeners();
  }

  Future<void> toggle(String id) async {
    if (!products.any((p) => p.id == id)) {
      throw ArgumentError('Koleksiyon bulunamadı');
    }
    // Retry storage if it was temporarily unavailable during startup.
    final preferences = _preferences ??= await _openPreferences();
    final previous = {...favorites};
    if (!favorites.add(id)) favorites.remove(id);
    notifyListeners();
    try {
      if (!await preferences.setStringList(favoritesKey, favorites.toList())) {
        throw StateError('Favori kaydedilemedi');
      }
    } catch (_) {
      favorites = previous;
      notifyListeners();
      rethrow;
    }
  }

  List<CollectionItem> filter(
          {String query = '',
          String brand = '',
          String category = '',
          bool favoritesOnly = false}) =>
      products
          .where((p) =>
              p.matches(query) &&
              (brand.isEmpty || p.brand == brand) &&
              (category.isEmpty || p.category == category) &&
              (!favoritesOnly || favorites.contains(p.id)))
          .toList();
}
