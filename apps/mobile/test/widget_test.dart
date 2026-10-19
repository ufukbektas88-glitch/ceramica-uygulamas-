import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ceramica/main.dart';

void main() {
  testWidgets('showroom marka ve ürün araması görünür', (tester) async {
    await tester.pumpWidget(const Ceramica());
    await tester.pumpAndSettle();
    expect(find.text('CERAMICA'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
    expect(find.textContaining('SUNUCUSUZ DEMO'), findsOneWidget);
  });
  testWidgets('ürün detayından tam koli ve vergi hesabı yapılır',
      (tester) async {
    await tester.pumpWidget(const Ceramica());
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.byType(ProductCard).first, 200,
        scrollable: find.byType(Scrollable).last);
    await tester.tap(find.byType(ProductCard).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Tam koli ve fiyatı hesapla'));
    await tester.pumpAndSettle();
    expect(find.text('Tam koli: 36'), findsOneWidget);
    expect(find.text('Toplam: 31104.00 TL'), findsOneWidget);
    await tester.enterText(find.byType(TextField).at(0), '4,32');
    await tester.enterText(find.byType(TextField).at(1), '0');
    await tester.tap(find.text('Tam koli ve fiyatı hesapla'));
    await tester.pumpAndSettle();
    expect(find.text('Tam koli: 3'), findsOneWidget);
  });
}
