import 'package:flutter/material.dart';
import 'api.dart';

class ServerSettings extends StatefulWidget {
  const ServerSettings({super.key, required this.api});
  final Api api;
  @override
  State<ServerSettings> createState() => _ServerSettingsState();
}

class _ServerSettingsState extends State<ServerSettings> {
  late final TextEditingController address;
  String? error;
  bool busy = false;
  @override
  void initState() {
    super.initState();
    address = TextEditingController(text: widget.api.serverUrl);
  }

  @override
  void dispose() {
    address.dispose();
    super.dispose();
  }

  Future<void> save(String value) async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await widget.api.configure(value);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Bağlantı ayarları')),
      body: ListView(padding: const EdgeInsets.all(24), children: [
        const Icon(Icons.cloud_outlined, size: 48),
        const SizedBox(height: 20),
        Text(
            widget.api.isDemo
                ? 'Şu anda sunucusuz demo modundasınız.'
                : 'CERAMICA sunucusuna bağlısınız.',
            style: const TextStyle(fontSize: 22, fontFamily: 'serif')),
        const SizedBox(height: 16),
        const Text(
            'Demo sürümünde örnek ürünleri inceleyebilir ve metraj hesaplayabilirsiniz. Gerçek stok, hesap ve siparişler için CERAMICA sunucusunun internette yayında olması gerekir.'),
        const SizedBox(height: 24),
        TextField(
            controller: address,
            keyboardType: TextInputType.url,
            autocorrect: false,
            decoration: const InputDecoration(
                labelText: 'Sunucu API adresi',
                hintText: 'https://sunucunuz.com/api/v1',
                border: OutlineInputBorder())),
        const SizedBox(height: 16),
        FilledButton(
            onPressed: busy ? null : () => save(address.text),
            child: Text(busy
                ? 'Sunucu kontrol ediliyor…'
                : 'Sunucuyu doğrula ve bağlan')),
        TextButton(
            onPressed: busy ? null : () => save(''),
            child: const Text('Sunucusuz demo kullan')),
        if (error != null)
          Text(error!, style: const TextStyle(color: Colors.red)),
        const SizedBox(height: 24),
        const Text(
            'Sunucunuz henüz yoksa satın alma veya Apple hesabı gerekmeden demo sürümünü kullanmaya devam edebilirsiniz. Bu ekrana gizli anahtar veya veritabanı parolası yazmayın.',
            style: TextStyle(fontSize: 12))
      ]));
}
