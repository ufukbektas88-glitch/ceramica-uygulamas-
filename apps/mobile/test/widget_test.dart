import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ceramica/main.dart';
void main(){testWidgets('showroom marka ve ürün araması görünür',(tester)async{await tester.pumpWidget(const Ceramica());expect(find.text('CERAMICA'),findsOneWidget);expect(find.byType(TextField),findsOneWidget);expect(find.textContaining('DEMO KATALOG'),findsOneWidget);});}
