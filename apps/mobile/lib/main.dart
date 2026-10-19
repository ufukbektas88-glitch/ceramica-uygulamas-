import 'package:flutter/material.dart';
import 'api.dart';
import 'settings.dart';

final appApi = Api();
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await appApi.initialize();
  runApp(const Ceramica());
}

class Ceramica extends StatelessWidget {
  const Ceramica({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'CERAMICA Demo',
        theme: ThemeData(
            colorScheme:
                ColorScheme.fromSeed(seedColor: const Color(0xff215a50)),
            useMaterial3: true,
            scaffoldBackgroundColor: const Color(0xfff8f7f3)),
        darkTheme: ThemeData.dark(useMaterial3: true),
        home: Showroom(api: appApi),
      );
}

class Showroom extends StatefulWidget {
  const Showroom({super.key, required this.api});
  final Api api;
  @override
  State<Showroom> createState() => _ShowroomState();
}

class _ShowroomState extends State<Showroom> {
  final search = TextEditingController();
  List<dynamic> products = [];
  String? error;
  bool loading = true;
  Api get api => widget.api;
  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void dispose() {
    search.dispose();
    super.dispose();
  }

  Future<void> load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final data =
          await api.call('products?q=${Uri.encodeComponent(search.text)}');
      if (mounted) setState(() => products = data['items']);
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> settings() async {
    await Navigator.push(context,
        MaterialPageRoute<void>(builder: (_) => ServerSettings(api: api)));
    if (mounted) load();
  }

  void account() {
    if (api.isDemo) {
      settings();
      return;
    }
    Navigator.push(
        context, MaterialPageRoute<void>(builder: (_) => Login(api: api)));
  }

  void orders() {
    if (api.isDemo) {
      settings();
      return;
    }
    Navigator.push(
        context, MaterialPageRoute<void>(builder: (_) => Orders(api: api)));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('CERAMICA',
              style: TextStyle(fontFamily: 'serif', letterSpacing: 4)),
          actions: [
            IconButton(
                tooltip: 'Bağlantı ayarları',
                onPressed: settings,
                icon: const Icon(Icons.settings_outlined)),
            IconButton(
                tooltip: 'Siparişler',
                onPressed: orders,
                icon: const Icon(Icons.receipt_long_outlined)),
            IconButton(
                tooltip: 'Oturum aç',
                onPressed: account,
                icon: const Icon(Icons.person_outline)),
          ],
        ),
        body: RefreshIndicator(
            onRefresh: load,
            child: ListView(
              padding: const EdgeInsets.all(22),
              children: [
                const Text('MALZEMENİN ÖTESİNDE',
                    style: TextStyle(fontSize: 10, letterSpacing: 2)),
                const SizedBox(height: 12),
                const Text('İlham veren\nyaşam alanları.',
                    style: TextStyle(fontFamily: 'serif', fontSize: 38)),
                const SizedBox(height: 12),
                const Text('Graniser ve Duratiles, CERAMICA deneyiminde.'),
                const SizedBox(height: 24),
                TextField(
                    controller: search,
                    onSubmitted: (_) => load(),
                    decoration: InputDecoration(
                      hintText: 'Ürün adı veya SKU',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: IconButton(
                          onPressed: load,
                          icon: const Icon(Icons.arrow_forward)),
                      border: const OutlineInputBorder(),
                    )),
                const SizedBox(height: 18),
                Card(
                    child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(
                          api.isDemo
                              ? 'SUNUCUSUZ DEMO · İnternetsiz katalog ve metraj hesabı. Ürünler, fiyatlar ve stoklar örnektir; sipariş veya ödeme alınmaz.'
                              : 'SUNUCUYA BAĞLI · DEMO etiketli kayıtlar gerçek üretici verisi değildir.',
                          style: const TextStyle(fontSize: 11),
                        ))),
                if (loading)
                  const Center(
                      child: Padding(
                          padding: EdgeInsets.all(30),
                          child: CircularProgressIndicator())),
                if (error != null)
                  Column(children: [
                    Text(error!, style: const TextStyle(color: Colors.red)),
                    TextButton(
                        onPressed: load, child: const Text('Tekrar dene'))
                  ]),
                if (!loading && error == null && products.isEmpty)
                  const Padding(
                      padding: EdgeInsets.all(24),
                      child: Text('Aramanıza uygun ürün bulunamadı.')),
                ...products.map((p) => ProductCard(
                    product: p,
                    onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute<void>(
                            builder: (_) =>
                                ProductDetail(product: p, api: api))))),
              ],
            )),
      );
}

class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.product, required this.onTap});
  final dynamic product;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final p = product;
    return Card(
        margin: const EdgeInsets.only(top: 16),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
            onTap: onTap,
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                height: 125,
                width: double.infinity,
                color: p['color'] == 'Bej'
                    ? const Color(0xffcfc3ac)
                    : p['color'] == 'Beyaz'
                        ? const Color(0xffe5e2d9)
                        : const Color(0xff606861),
                alignment: Alignment.bottomLeft,
                padding: const EdgeInsets.all(16),
                child: Text(p['brand']['name'],
                    style:
                        const TextStyle(letterSpacing: 3, color: Colors.white)),
              ),
              Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(p['name'],
                            style: const TextStyle(
                                fontSize: 20, fontFamily: 'serif')),
                        Text('${p['size']} · ${p['surface']}'),
                        const SizedBox(height: 14),
                        Text('${p['price']} TL/m² + KDV',
                            style:
                                const TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text(
                            '${p['availableBoxes']} koli · ${p['boxArea']} m²/koli'),
                        const SizedBox(height: 10),
                        const Row(children: [
                          Expanded(child: Text('İncele ve metraj hesapla')),
                          Icon(Icons.arrow_forward, size: 18)
                        ]),
                      ])),
            ])));
  }
}

class ProductDetail extends StatefulWidget {
  const ProductDetail({super.key, required this.product, required this.api});
  final dynamic product;
  final Api api;
  @override
  State<ProductDetail> createState() => _ProductDetailState();
}

class _ProductDetailState extends State<ProductDetail> {
  final area = TextEditingController(text: '47');
  final waste = TextEditingController(text: '10');
  dynamic result;
  String? error;
  bool busy = false;
  @override
  void dispose() {
    area.dispose();
    waste.dispose();
    super.dispose();
  }

  Future<void> calculate() async {
    setState(() {
      busy = true;
      error = null;
      result = null;
    });
    try {
      final d = await widget.api.call('calculator', body: {
        'productId': widget.product['id'],
        'area': double.parse(area.text.replaceAll(',', '.')),
        'waste': double.parse(waste.text.replaceAll(',', '.'))
      });
      if (mounted) setState(() => result = d);
    } catch (e) {
      if (mounted) {
        setState(() => error = e is FormatException
            ? 'Lütfen geçerli alan ve fire değerleri girin.'
            : e.toString());
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Metraj hesaplama')),
      body: ListView(padding: const EdgeInsets.all(24), children: [
        Text(widget.product['name'],
            style: const TextStyle(fontSize: 30, fontFamily: 'serif')),
        Text('${widget.product['brand']['name']} · ${widget.product['size']}'),
        const SizedBox(height: 24),
        TextField(
            controller: area,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Net alan (m²)')),
        TextField(
            controller: waste,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Fire payı (%)')),
        const SizedBox(height: 20),
        FilledButton(
            onPressed: busy ? null : calculate,
            child: Text(busy ? 'Hesaplanıyor…' : 'Tam koli ve fiyatı hesapla')),
        if (error != null)
          Text(error!, style: const TextStyle(color: Colors.red)),
        if (result != null)
          Card(
              child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Fireli ihtiyaç: ${result['required']} m²'),
                        Text('Tam koli: ${result['boxes']}'),
                        Text('Gerçek alan: ${result['area']} m²'),
                        Text('KDV hariç: ${result['subtotal']} TL'),
                        Text('KDV: ${result['tax']} TL'),
                        const Divider(),
                        Text('Toplam: ${result['total']} TL',
                            style: const TextStyle(fontSize: 23)),
                        const SizedBox(height: 12),
                        Text(
                            widget.api.isDemo
                                ? 'Demo hesabıdır. Gerçek sipariş veya ödeme alınmaz.'
                                : 'Sipariş işlemleri web panelinden yapılır. DEMO etiketli ürünlerin fiyatları örnektir.',
                            style: const TextStyle(fontSize: 11)),
                      ]))),
      ]));
}

class Login extends StatefulWidget {
  const Login({super.key, required this.api});
  final Api api;
  @override
  State<Login> createState() => _LoginState();
}

class _LoginState extends State<Login> {
  final email = TextEditingController();
  final password = TextEditingController();
  String? error;
  bool busy = false;
  @override
  void dispose() {
    email.dispose();
    password.dispose();
    super.dispose();
  }

  Future<void> login() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final d = await widget.api.call('auth/login',
          body: {'email': email.text, 'password': password.text});
      await widget.api.storage.write(key: 'session', value: d['token']);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Oturum açıldı')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Oturum aç')),
      body: ListView(padding: const EdgeInsets.all(24), children: [
        TextField(
            controller: email,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.username],
            decoration: const InputDecoration(labelText: 'E-posta')),
        TextField(
            controller: password,
            obscureText: true,
            autofillHints: const [AutofillHints.password],
            decoration: const InputDecoration(labelText: 'Parola')),
        const SizedBox(height: 24),
        FilledButton(
            onPressed: busy ? null : login,
            child: Text(busy ? 'Kontrol ediliyor…' : 'Oturum aç')),
        if (error != null)
          Text(error!, style: const TextStyle(color: Colors.red)),
      ]));
}

class Orders extends StatefulWidget {
  const Orders({super.key, required this.api});
  final Api api;
  @override
  State<Orders> createState() => _OrdersState();
}

class _OrdersState extends State<Orders> {
  late Future<dynamic> orders;
  @override
  void initState() {
    super.initState();
    orders = widget.api.call('orders');
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Siparişlerim'), actions: [
        IconButton(
            tooltip: 'Yenile',
            onPressed: () => setState(() => orders = widget.api.call('orders')),
            icon: const Icon(Icons.refresh))
      ]),
      body: FutureBuilder<dynamic>(
          future: orders,
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                      'Siparişler alınamadı. Oturumunuzu kontrol edin.\n${snapshot.error}'));
            }
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }
            final list = snapshot.data as List;
            if (list.isEmpty) {
              return const Center(child: Text('Henüz siparişiniz bulunmuyor.'));
            }
            const labels = {
              'RECEIVED': 'Sipariş alındı',
              'CONFIRMED': 'Onaylandı',
              'PREPARING': 'Hazırlanıyor',
              'SHIPPED': 'Sevk edildi',
              'DELIVERED': 'Teslim edildi',
              'CANCELLED': 'İptal edildi'
            };
            return ListView(
                children: list
                    .map((o) => ListTile(
                        title: Text(o['number']),
                        subtitle: Text(labels[o['status']] ?? o['status']),
                        trailing: Text('${o['total']} TL')))
                    .toList());
          }));
}
