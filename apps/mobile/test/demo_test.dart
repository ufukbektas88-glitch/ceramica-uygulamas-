import 'package:flutter_test/flutter_test.dart';
import 'package:ceramica/api.dart';
import 'package:ceramica/demo_data.dart';

void main() {
  test('sunucusuz katalog açıkça demo olarak gelir', () async {
    final api = Api(serverUrl: '');
    final data = await api.call('products?q=Traverten');
    expect(data['items'].length, 2);
    expect(data['items'].every((p) => p['demo'] == true), isTrue);
  });
  test('47 m² %10 fire = 36 koli 51.84 m²', () {
    final r = calculateDemo(demoProducts.first, 47, 10);
    expect(r['boxes'], 36);
    expect(r['area'], '51.8400');
    expect(r['total'], '31104.00');
  });
  test('tam koli sınırı ve ondalık fiyat', () {
    expect(calculateDemo(demoProducts.first, '4.32', 0)['boxes'], 3);
    final p = {...demoProducts.first, 'price': '19.99', 'boxArea': '1'};
    expect(calculateDemo(p, 1, 0)['total'], '23.99');
  });
  test('geçersiz alan ve fire reddedilir', () {
    expect(
        () => calculateDemo(demoProducts.first, 0, 10), throwsFormatException);
    expect(
        () => calculateDemo(demoProducts.first, 1, 101), throwsFormatException);
  });
  test('demo modunda gerçek sipariş veya oturum üretmez', () async {
    await expectLater(Api(serverUrl: '').call('orders'), throwsFormatException);
  });
}
