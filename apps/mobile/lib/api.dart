import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'demo_data.dart';

class Api {
  Api({String? serverUrl})
      : serverUrl = serverUrl ?? const String.fromEnvironment('API_URL');
  String serverUrl;
  final storage = const FlutterSecureStorage();
  bool get isDemo => serverUrl.isEmpty;

  Future<void> initialize() async {
    try {
      serverUrl = await storage.read(key: 'server_url') ?? serverUrl;
    } catch (_) {
      /* First launch may have no platform storage. Demo remains usable. */
    }
  }

  Future<void> configure(String value) async {
    final address = value.trim().replaceFirst(RegExp(r'/+$'), '');
    if (address.isNotEmpty) {
      final uri = Uri.tryParse(address);
      if (uri == null ||
          uri.host.isEmpty ||
          uri.userInfo.isNotEmpty ||
          uri.hasQuery ||
          uri.hasFragment ||
          (uri.scheme != 'https' && !(kDebugMode && uri.scheme == 'http'))) {
        throw const FormatException(
            'Geçerli bir HTTPS API adresi girin. Örnek: https://sunucunuz.com/api/v1');
      }
      // A typo must not silently replace the working server.
      final response = await http
          .get(Uri.parse('$address/health'))
          .timeout(const Duration(seconds: 15));
      if (response.statusCode != 200 ||
          jsonDecode(response.body)['status'] != 'ok') {
        throw const FormatException(
            'CERAMICA sunucusu doğrulanamadı. Adresi kontrol edin.');
      }
    }
    await storage.write(key: 'server_url', value: address);
    await storage.delete(key: 'session');
    serverUrl = address;
  }

  Future<dynamic> call(String path, {Map<String, dynamic>? body}) async {
    if (isDemo) {
      final uri = Uri.parse(path);
      if (uri.path == 'products') {
        final q = (uri.queryParameters['q'] ?? '').toLowerCase();
        final items = demoProducts
            .where((p) => '${p['name']} ${p['sku']} ${p['brand']['name']}'
                .toLowerCase()
                .contains(q))
            .toList();
        return {'items': items, 'total': items.length, 'page': 1};
      }
      if (uri.path == 'calculator' && body != null) {
        final product =
            demoProducts.firstWhere((p) => p['id'] == body['productId']);
        return calculateDemo(product, body['area'], body['waste']);
      }
      throw const FormatException(
          'Bu işlem gerçek sunucu bağlantısı gerektirir. Ayarlar bölümünden sunucu ekleyin.');
    }
    final token = await storage.read(key: 'session');
    final headers = {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token'
    };
    final uri = Uri.parse('$serverUrl/$path');
    final response = body == null
        ? await http
            .get(uri, headers: headers)
            .timeout(const Duration(seconds: 20))
        : await http
            .post(uri, headers: headers, body: jsonEncode(body))
            .timeout(const Duration(seconds: 20));
    final data = jsonDecode(response.body);
    if (response.statusCode >= 400) throw Exception(data['message'].toString());
    return data;
  }
}
