// Explicit sample data. Never a representation of manufacturer stock or prices.
final demoProducts = List<Map<String, dynamic>>.generate(
    6,
    (i) => {
          'id':
              '00000000-0000-4000-8000-${(i + 1).toString().padLeft(12, '0')}',
          'sku': 'DEMO-${i + 1}',
          'name': '${[
            'Traverten Bej',
            'Mermer Beyaz',
            'Beton Antrasit'
          ][i % 3]} • Demo',
          'brand': {'name': i < 3 ? 'Graniser' : 'Duratiles'},
          'size': ['60×120', '60×60', '120×120'][i % 3],
          'color': ['Bej', 'Beyaz', 'Antrasit'][i % 3],
          'surface': i % 3 == 1 ? 'Parlak' : 'Mat',
          'boxArea': '1.44',
          'price': ['500', '650', '800'][i % 3],
          'vatRate': '20',
          'demo': true,
          'availableBoxes': 200,
        });

int scaled(dynamic value, int places) {
  final text = value.toString();
  if (!RegExp(r'^\d+(\.\d+)?$').hasMatch(text)) {
    throw const FormatException('Pozitif bir sayı girin.');
  }
  final parts = text.split('.');
  final fraction = parts.length == 2 ? parts[1] : '';
  if (fraction.length > places) {
    throw FormatException('En fazla $places ondalık basamak girin.');
  }
  return int.parse(parts[0] + fraction.padRight(places, '0'));
}

String fixed(int value, int places) {
  final text = value.toString().padLeft(places + 1, '0');
  return '${text.substring(0, text.length - places)}.${text.substring(text.length - places)}';
}

Map<String, dynamic> calculateDemo(
    Map<String, dynamic> product, dynamic area, dynamic waste) {
  final a = scaled(area, 4), w = scaled(waste, 2);
  final box = scaled(product['boxArea'], 4);
  if (a <= 0 || a > 10000000000 || w > 10000 || box <= 0) {
    throw const FormatException(
        'Alan 0–1.000.000 m², fire %0–100 arasında olmalı.');
  }
  final numerator = a * (10000 + w);
  final denominator = box * 10000;
  final boxes = (numerator + denominator - 1) ~/ denominator;
  final actual = boxes * box;
  final net = (actual * scaled(product['price'], 2) + 5000) ~/ 10000;
  final tax = (net * scaled(product['vatRate'], 2) + 5000) ~/ 10000;
  return {
    'required': fixed((numerator + 5000) ~/ 10000, 4),
    'boxes': boxes,
    'area': fixed(actual, 4),
    'subtotal': fixed(net, 2),
    'tax': fixed(tax, 2),
    'total': fixed(net + tax, 2),
  };
}
