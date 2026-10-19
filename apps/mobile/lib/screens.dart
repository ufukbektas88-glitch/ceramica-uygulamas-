import 'package:flutter/material.dart';
import 'catalog.dart';
import 'main.dart';

class ExploreScreen extends StatelessWidget {
  const ExploreScreen(
      {super.key, required this.store, required this.onCatalog});
  final CatalogStore store;
  final ValueChanged<String> onCatalog;
  @override
  Widget build(BuildContext context) {
    final graniser = store.products.firstWhere((p) => p.brand == 'Graniser');
    final duratiles = store.products.firstWhere((p) => p.brand == 'Duratiles');
    return ListView(
        padding: const EdgeInsets.fromLTRB(22, 18, 22, 28),
        children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('CERAMICA',
                style: TextStyle(
                    fontFamily: 'Cormorant',
                    fontWeight: FontWeight.w600,
                    fontSize: 32,
                    letterSpacing: 5,
                    color: ink)),
            IconButton(
                tooltip: 'Katalog hakkında',
                onPressed: () => showCatalogInfo(context, store),
                icon: const Icon(Icons.info_outline, size: 21)),
          ]),
          const SizedBox(height: 8),
          eyebrow('SERAMİK. BANYO. YAŞAM.'),
          const SizedBox(height: 24),
          ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: SizedBox(
                  height: 395,
                  child: Stack(fit: StackFit.expand, children: [
                    Photo(store.data['hero']),
                    const DecoratedBox(
                        decoration: BoxDecoration(
                            gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                          Colors.transparent,
                          Color(0x980d1710)
                        ]))),
                    Positioned(
                        left: 24,
                        right: 20,
                        bottom: 26,
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              eyebrow('MEKÂNLARA KARAKTER KATAN DETAYLAR',
                                  color: const Color(0xffeeeee3)),
                              const SizedBox(height: 14),
                              heading('Doğal dokular.\nZamansız mekânlar.',
                                  size: 43, color: Colors.white),
                              const SizedBox(height: 22),
                              OutlinedButton(
                                  onPressed: () => onCatalog(''),
                                  style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.white,
                                      side: const BorderSide(
                                          color: Color(0xaaffffff)),
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(2)),
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 17, vertical: 13)),
                                  child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text('Koleksiyonları keşfet',
                                            style: TextStyle(fontSize: 11)),
                                        SizedBox(width: 16),
                                        Icon(Icons.arrow_outward, size: 16)
                                      ])),
                            ])),
                  ]))),
          const SizedBox(height: 32),
          eyebrow('CERAMICA SEÇKİSİ'),
          const SizedBox(height: 10),
          heading('Malzemenin karakteri.'),
          const SizedBox(height: 12),
          const Text(
              'Graniser ve Duratiles koleksiyonları, banyo tasarımları ve ilham veren yüzeyler. Yaşam alanınızı yansıtan dokuyu keşfedin.',
              style: TextStyle(
                  fontSize: 12, color: Color(0xff7c8275), height: 1.8)),
          const SizedBox(height: 22),
          SizedBox(
              height: 220,
              child: ListView(scrollDirection: Axis.horizontal, children: [
                BrandTile(
                    name: 'GRANISER',
                    subtitle: 'Seramik koleksiyonları',
                    image: graniser.images.first,
                    onTap: () => onCatalog('Graniser')),
                const SizedBox(width: 14),
                BrandTile(
                    name: 'DURATILES',
                    subtitle: 'Yüzey ve doku',
                    image: duratiles.images.first,
                    onTap: () => onCatalog('Duratiles')),
                const SizedBox(width: 14),
                BrandTile(
                    name: 'CERAMICA',
                    subtitle: 'Banyo seçkisi',
                    image: store.data['inspiration'],
                    onTap: () => onCatalog('CERAMICA Seçkisi')),
              ])),
          const SizedBox(height: 32),
          Row(children: [
            Expanded(child: heading('Yakından keşfedin.', size: 30)),
            TextButton(
                onPressed: () => onCatalog(''),
                child: const Text('Tümü ↗', style: TextStyle(fontSize: 11)))
          ]),
          const SizedBox(height: 16),
          GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: 4,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 14,
                  mainAxisSpacing: 18,
                  childAspectRatio: .67),
              itemBuilder: (context, i) {
                final list = [
                  graniser,
                  duratiles,
                  store.products
                      .where((p) => p.brand == 'Graniser')
                      .elementAt(1),
                  store.products
                      .where((p) => p.brand == 'Duratiles')
                      .elementAt(1)
                ];
                return CollectionCard(item: list[i], store: store);
              }),
          const SizedBox(height: 32),
          ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: Photo(store.data['inspiration'],
                  height: 230, width: double.infinity)),
          const SizedBox(height: 19),
          heading('İyi tasarım,\niyi hissettirir.', size: 37),
          const SizedBox(height: 12),
          const Text(
              'Banyonuzdan yaşam alanlarınıza, her detayda kendinize ait bir hikâye. Seçtiğiniz koleksiyonları favorilerinize ekleyin ve ilhamınızı yanınızda taşıyın.',
              style: TextStyle(fontSize: 12, color: Color(0xff7c8275))),
          const SizedBox(height: 25),
          SourceLinks(store: store),
          const SizedBox(height: 26),
          Center(child: eyebrow('DOĞAL DOKULAR. KALICI İLHAM.')),
        ]);
  }
}

class BrandTile extends StatelessWidget {
  const BrandTile(
      {super.key,
      required this.name,
      required this.subtitle,
      required this.image,
      required this.onTap});
  final String name, subtitle, image;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => SizedBox(
      width: 184,
      child: Material(
          color: line,
          borderRadius: BorderRadius.circular(4),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
              onTap: onTap,
              child: Stack(fit: StackFit.expand, children: [
                Photo(image),
                const DecoratedBox(
                    decoration: BoxDecoration(
                        gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Color(0xc0152016)]))),
                Positioned(
                    left: 17,
                    right: 12,
                    bottom: 17,
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 16,
                                  letterSpacing: 2,
                                  color: Colors.white)),
                          const SizedBox(height: 5),
                          Text(subtitle,
                              style: const TextStyle(
                                  fontSize: 10, color: Color(0xffeeeeea))),
                          const SizedBox(height: 10),
                          const Icon(Icons.arrow_forward,
                              size: 20, color: Colors.white)
                        ]))
              ]))));
}

class CollectionCard extends StatelessWidget {
  const CollectionCard({super.key, required this.item, required this.store});
  final CollectionItem item;
  final CatalogStore store;
  @override
  Widget build(BuildContext context) => Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(4),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                  builder: (_) => CollectionDetail(item: item, store: store))),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
                child: Stack(fit: StackFit.expand, children: [
              Photo(item.images.first),
              Positioned(
                  top: 4,
                  right: 4,
                  child: IconButton.filledTonal(
                      tooltip: store.favorites.contains(item.id)
                          ? 'Favorilerden kaldır'
                          : 'Favorilere ekle',
                      onPressed: () => favorite(context, store, item.id),
                      style: IconButton.styleFrom(
                          backgroundColor: const Color(0xeef8f7f2),
                          foregroundColor: ink),
                      icon: Icon(
                          store.favorites.contains(item.id)
                              ? Icons.favorite
                              : Icons.favorite_border,
                          size: 18)))
            ])),
            Padding(
                padding: const EdgeInsets.fromLTRB(13, 12, 13, 12),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.brand.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 8,
                              color: sage,
                              letterSpacing: 1.2,
                              fontWeight: FontWeight.w600)),
                      const SizedBox(height: 5),
                      Text(item.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontFamily: 'Cormorant',
                              fontSize: 23,
                              color: ink,
                              height: 1.1)),
                      const SizedBox(height: 5),
                      Text(item.size,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 9, color: Color(0xff81887b)))
                    ])),
          ])));
}

class CollectionsScreen extends StatefulWidget {
  const CollectionsScreen(
      {super.key,
      required this.store,
      this.initialBrand = '',
      this.favoritesOnly = false,
      this.onExplore});
  final CatalogStore store;
  final String initialBrand;
  final bool favoritesOnly;
  final VoidCallback? onExplore;
  @override
  State<CollectionsScreen> createState() => _CollectionsScreenState();
}

class _CollectionsScreenState extends State<CollectionsScreen> {
  late String brand;
  String query = '', category = '';
  final search = TextEditingController();
  @override
  void initState() {
    super.initState();
    brand = widget.initialBrand;
  }

  @override
  void dispose() {
    search.dispose();
    super.dispose();
  }

  void categories() {
    showModalBottomSheet<void>(
        context: context,
        backgroundColor: paper,
        showDragHandle: true,
        builder: (ctx) => SafeArea(
            child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      heading('Kategori seçin.', size: 30),
                      const SizedBox(height: 20),
                      Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            '',
                            ...widget.store.products
                                .map((p) => p.category)
                                .where((c) => c.isNotEmpty)
                                .toSet()
                          ]
                              .map((c) => ChoiceChip(
                                  label: Text(c.isEmpty ? 'Tümü' : c),
                                  selected: category == c,
                                  onSelected: (_) {
                                    setState(() => category = c);
                                    Navigator.pop(ctx);
                                  }))
                              .toList()),
                      const SizedBox(height: 24)
                    ]))));
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.store.filter(
        query: query,
        brand: brand,
        category: category,
        favoritesOnly: widget.favoritesOnly);
    if (widget.favoritesOnly && widget.store.favorites.isEmpty) {
      return Center(
          child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.favorite_border, size: 42, color: sage),
                const SizedBox(height: 25),
                heading('Size ilham verenler.', size: 36),
                const SizedBox(height: 15),
                const Text(
                    'Beğendiğiniz koleksiyonları kalp simgesine dokunarak burada biriktirin. Favorileriniz yalnızca cihazınızda saklanır.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Color(0xff81887b))),
                const SizedBox(height: 24),
                FilledButton(
                    onPressed: widget.onExplore,
                    child: const Text('Koleksiyonları keşfet'))
              ])));
    }
    return CustomScrollView(slivers: [
      SliverPadding(
          padding: const EdgeInsets.fromLTRB(22, 28, 22, 0),
          sliver: SliverToBoxAdapter(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                eyebrow(widget.favoritesOnly
                    ? 'KİŞİSEL SEÇKİNİZ'
                    : 'MALZEME VE MEKÂN'),
                const SizedBox(height: 12),
                heading(
                    widget.favoritesOnly ? 'Favorileriniz.' : 'Koleksiyonlar.',
                    size: 40),
                const SizedBox(height: 12),
                Text(
                    '${items.length} koleksiyon · Kaynaklardan seçilen güncel seçki',
                    style: const TextStyle(
                        fontSize: 10, color: Color(0xff81887b))),
                const SizedBox(height: 22),
                TextField(
                    controller: search,
                    onChanged: (v) => setState(() => query = v),
                    decoration: InputDecoration(
                        hintText: 'Koleksiyon, marka veya ebat arayın',
                        hintStyle: const TextStyle(fontSize: 11),
                        prefixIcon: const Icon(Icons.search, size: 20),
                        suffixIcon: query.isNotEmpty
                            ? IconButton(
                                tooltip: 'Aramayı temizle',
                                onPressed: () {
                                  search.clear();
                                  setState(() => query = '');
                                },
                                icon: const Icon(Icons.close, size: 18))
                            : null,
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(4),
                            borderSide: const BorderSide(color: line)),
                        enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(4),
                            borderSide: const BorderSide(color: line)))),
                const SizedBox(height: 16),
                SizedBox(
                    height: 44,
                    child: Row(children: [
                      Expanded(
                          child: ListView(
                              scrollDirection: Axis.horizontal,
                              children: [
                                '',
                                'Graniser',
                                'Duratiles',
                                'CERAMICA Seçkisi'
                              ]
                                  .map((b) => Padding(
                                      padding: const EdgeInsets.only(right: 8),
                                      child: ChoiceChip(
                                          label: Text(b.isEmpty ? 'Tümü' : b,
                                              style: const TextStyle(
                                                  fontSize: 10)),
                                          selected: brand == b,
                                          showCheckmark: false,
                                          onSelected: (_) =>
                                              setState(() => brand = b))))
                                  .toList())),
                      IconButton(
                          tooltip: 'Kategori filtresi',
                          onPressed: categories,
                          icon: Badge(
                              isLabelVisible: category.isNotEmpty,
                              child: const Icon(Icons.tune, size: 21)))
                    ])),
                if (category.isNotEmpty)
                  Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: InputChip(
                          label: Text(category),
                          onDeleted: () => setState(() => category = ''))),
                const SizedBox(height: 22)
              ]))),
      if (items.isEmpty)
        SliverFillRemaining(
            hasScrollBody: false,
            child: Center(
                child: Padding(
                    padding: const EdgeInsets.all(25),
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.search_off, color: sage, size: 35),
                      const SizedBox(height: 16),
                      const Text('Aramanıza uygun koleksiyon bulunamadı.',
                          textAlign: TextAlign.center),
                      TextButton(
                          onPressed: () {
                            search.clear();
                            setState(() {
                              query = '';
                              brand = '';
                              category = '';
                            });
                          },
                          child: const Text('Filtreleri temizle'))
                    ]))))
      else
        SliverPadding(
            padding: const EdgeInsets.fromLTRB(22, 0, 22, 28),
            sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                    (context, i) =>
                        CollectionCard(item: items[i], store: widget.store),
                    childCount: items.length),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount:
                        MediaQuery.sizeOf(context).width > 700 ? 3 : 2,
                    crossAxisSpacing: 14,
                    mainAxisSpacing: 18,
                    childAspectRatio: .67))),
    ]);
  }
}

class CollectionDetail extends StatefulWidget {
  const CollectionDetail({super.key, required this.item, required this.store});
  final CollectionItem item;
  final CatalogStore store;
  @override
  State<CollectionDetail> createState() => _CollectionDetailState();
}

class _CollectionDetailState extends State<CollectionDetail> {
  int page = 0;
  void zoom(String path) {
    showDialog<void>(
        context: context,
        builder: (ctx) => Dialog.fullscreen(
            backgroundColor: const Color(0xff171b17),
            child: SafeArea(
                child: Stack(children: [
              Center(
                  child: InteractiveViewer(
                      minScale: .8,
                      maxScale: 5,
                      child: Photo(path,
                          fit: BoxFit.contain, width: double.infinity))),
              Positioned(
                  top: 12,
                  right: 12,
                  child: IconButton.filled(
                      tooltip: 'Fotoğrafı kapat',
                      onPressed: () => Navigator.pop(ctx),
                      icon: const Icon(Icons.close)))
            ]))));
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    return AnimatedBuilder(
        animation: widget.store,
        builder: (context, _) => Scaffold(
            appBar: AppBar(
                title: const Text('CERAMICA',
                    style: TextStyle(
                        fontFamily: 'Cormorant',
                        letterSpacing: 4,
                        fontSize: 24)),
                actions: [
                  IconButton(
                      tooltip: widget.store.favorites.contains(item.id)
                          ? 'Favorilerden kaldır'
                          : 'Favorilere ekle',
                      onPressed: () => favorite(context, widget.store, item.id),
                      icon: Icon(widget.store.favorites.contains(item.id)
                          ? Icons.favorite
                          : Icons.favorite_border))
                ]),
            body: ListView(children: [
              SizedBox(
                  height: MediaQuery.sizeOf(context)
                      .width
                      .clamp(300, 470)
                      .toDouble(),
                  child: Stack(children: [
                    PageView.builder(
                        itemCount: item.images.length,
                        onPageChanged: (n) => setState(() => page = n),
                        itemBuilder: (context, i) => GestureDetector(
                            onTap: () => zoom(item.images[i]),
                            child:
                                Photo(item.images[i], width: double.infinity))),
                    Positioned(
                        bottom: 15,
                        right: 15,
                        child: DecoratedBox(
                            decoration: BoxDecoration(
                                color: const Color(0xeef8f7f2),
                                borderRadius: BorderRadius.circular(30)),
                            child: Padding(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 8),
                                child: Row(children: [
                                  const Icon(Icons.zoom_in, size: 16),
                                  const SizedBox(width: 7),
                                  Text('${page + 1} / ${item.images.length}',
                                      style: const TextStyle(fontSize: 10))
                                ]))))
                  ])),
              Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        eyebrow(
                            '${item.brand.toUpperCase()} / ${item.category.toUpperCase()}'),
                        const SizedBox(height: 13),
                        heading(item.name, size: 44),
                        if (item.description.trim().isNotEmpty) ...[
                          const SizedBox(height: 18),
                          Text(item.description,
                              style: const TextStyle(
                                  fontSize: 12,
                                  height: 1.9,
                                  color: Color(0xff788071)))
                        ],
                        if (item.facts.isNotEmpty) ...[
                          const SizedBox(height: 29),
                          eyebrow('KOLEKSİYON DETAYLARI'),
                          const SizedBox(height: 14),
                          ...item.facts.map((f) => Container(
                              padding: const EdgeInsets.symmetric(vertical: 13),
                              decoration: const BoxDecoration(
                                  border:
                                      Border(bottom: BorderSide(color: line))),
                              child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                        flex: 2,
                                        child: Text(f[0],
                                            style: const TextStyle(
                                                fontSize: 11,
                                                color: Color(0xff81887b)))),
                                    const SizedBox(width: 10),
                                    Expanded(
                                        flex: 3,
                                        child: Text(f[1],
                                            style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w500)))
                                  ])))
                        ],
                        if (item.variants.isNotEmpty) ...[
                          const SizedBox(height: 27),
                          eyebrow('RENK VE YÜZEY SEÇENEKLERİ'),
                          const SizedBox(height: 16),
                          SizedBox(
                              height: 125,
                              child: ListView.separated(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: item.variants.length,
                                  separatorBuilder: (_, i) =>
                                      const SizedBox(width: 12),
                                  itemBuilder: (context, i) {
                                    final v = item.variants[i];
                                    return SizedBox(
                                        width: 112,
                                        child: InkWell(
                                            onTap: () => zoom(v['imagePath']),
                                            child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  ClipRRect(
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              3),
                                                      child: Photo(
                                                          v['imagePath'],
                                                          height: 82,
                                                          width: 112)),
                                                  const SizedBox(height: 9),
                                                  Text(v['name'],
                                                      maxLines: 2,
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                      style: const TextStyle(
                                                          fontSize: 10))
                                                ])));
                                  }))
                        ],
                        const SizedBox(height: 28),
                        SizedBox(
                            width: double.infinity,
                            child: FilledButton.icon(
                                onPressed: () =>
                                    openReference(context, item.sourceUrl),
                                icon: const Icon(Icons.open_in_new, size: 16),
                                label: const Text('Ürün sayfasını aç'),
                                style: FilledButton.styleFrom(
                                    padding: const EdgeInsets.all(16),
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(3))))),
                        const SizedBox(height: 12),
                        Text(
                            'Kaynak: ${Uri.parse(item.sourceUrl).host}\nBağlantı internet tarayıcınızda açılır.',
                            style: const TextStyle(
                                fontSize: 9,
                                height: 1.7,
                                color: Color(0xff81887b))),
                        const SizedBox(height: 24),
                        const Divider(color: line),
                        const SizedBox(height: 15),
                        eyebrow('DAHA FAZLA İLHAM'),
                        const SizedBox(height: 12),
                        SourceLinks(store: widget.store),
                      ])),
            ])));
  }
}

class SourceLinks extends StatelessWidget {
  const SourceLinks({super.key, required this.store});
  final CatalogStore store;
  @override
  Widget build(BuildContext context) => Column(
      children: (store.data['sources'] as List)
          .map((s) => Container(
              decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: line))),
              child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(s['name'],
                      style: const TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w600)),
                  subtitle: Text(Uri.parse(s['url']).host,
                      style: const TextStyle(
                          fontSize: 9, color: Color(0xff81887b))),
                  trailing: const Icon(Icons.arrow_outward, size: 17),
                  onTap: () => openReference(context, s['url']))))
          .toList());
}

class VisitScreen extends StatelessWidget {
  const VisitScreen({super.key, required this.store});
  final CatalogStore store;
  @override
  Widget build(BuildContext context) {
    final contact = store.data['contact'];
    return ListView(
        padding: const EdgeInsets.fromLTRB(22, 28, 22, 30),
        children: [
          eyebrow('CERAMICA SHOWROOM'),
          const SizedBox(height: 12),
          heading('Birlikte keşfedelim.', size: 40),
          const SizedBox(height: 22),
          ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: Photo(store.data['showroom'],
                  height: 220, width: double.infinity)),
          const SizedBox(height: 23),
          heading(contact['name'], size: 29),
          const SizedBox(height: 13),
          Text(contact['address'],
              style: const TextStyle(fontSize: 12, color: Color(0xff7f8778))),
          const SizedBox(height: 22),
          Row(children: [
            Expanded(
                child: FilledButton.icon(
                    onPressed: () =>
                        openReference(context, contact['phoneUrl']),
                    icon: const Icon(Icons.phone_outlined, size: 17),
                    label: const Text('Ara'))),
            const SizedBox(width: 12),
            Expanded(
                child: OutlinedButton.icon(
                    onPressed: () => openReference(context, contact['mapsUrl']),
                    icon: const Icon(Icons.near_me_outlined, size: 17),
                    label: const Text('Yol tarifi')))
          ]),
          const SizedBox(height: 18),
          ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.phone_outlined, size: 19),
              title:
                  Text(contact['phone'], style: const TextStyle(fontSize: 12)),
              onTap: () => openReference(context, contact['phoneUrl'])),
          ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.mail_outline, size: 19),
              title:
                  Text(contact['email'], style: const TextStyle(fontSize: 12)),
              onTap: () =>
                  openReference(context, 'mailto:${contact['email']}')),
          const SizedBox(height: 22),
          eyebrow('KATALOGLAR'),
          const SizedBox(height: 12),
          ...(store.data['catalogs'] as List).map((c) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.menu_book_outlined, color: sage),
              title: Text(c['name'], style: const TextStyle(fontSize: 12)),
              subtitle: const Text('PDF · İnternet bağlantısıyla açılır',
                  style: TextStyle(fontSize: 9)),
              trailing: const Icon(Icons.open_in_new, size: 16),
              onTap: () => openReference(context, c['url']))),
          const SizedBox(height: 25),
          eyebrow('WEB SİTELERİ'),
          const SizedBox(height: 12),
          SourceLinks(store: store),
          const SizedBox(height: 24),
          TextButton(
              onPressed: () => showCatalogInfo(context, store),
              child: const Text('Katalog hakkında',
                  style: TextStyle(fontSize: 11)))
        ]);
  }
}

void showCatalogInfo(BuildContext context, CatalogStore store) {
  showModalBottomSheet<void>(
      context: context,
      backgroundColor: paper,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) => SafeArea(
          child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 30),
              child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    heading('İlham, her an yanınızda.', size: 32),
                    const SizedBox(height: 18),
                    Text(
                        '${store.products.length} seçili koleksiyon ve görselleri uygulamanın içindedir. Kataloğu ve favorilerinizi internet olmadan görüntüleyebilirsiniz.',
                        style: const TextStyle(fontSize: 12)),
                    const SizedBox(height: 12),
                    const Text(
                        'Web siteleri, PDF kataloglar ve harita bağlantıları internet gerektirir. Ürün bilgileri ve görseller ilgili kaynaklara aittir.',
                        style:
                            TextStyle(fontSize: 11, color: Color(0xff81887b))),
                    const SizedBox(height: 14),
                    Text(
                        'Katalog tarihi: ${store.data['updatedAt']}\nKaynaklar: ceramicabanyo.com · graniser.com.tr · duratiles.com.tr',
                        style: const TextStyle(
                            fontSize: 10, color: Color(0xff81887b)))
                  ]))));
}
