export function getTaxiCarImage(brand?: string | null, model?: string | null): string {
  const b = (brand || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const m = (model || '').toLowerCase();

  if (b.includes('audi')) {
    if (m.includes('a4')) return '/assets/cars/audi-a4.png';
    if (m.includes('a6')) return '/assets/cars/audi-a6.png';
    if (m.includes('q4')) return '/assets/cars/audi-q4.png';
    if (m.includes('q5')) return '/assets/cars/audi-q5.png';
    return '/assets/cars/audi-a3.png';
  }
  if (b.includes('byd')) {
    if (m.includes('atto')) return '/assets/cars/byd-atto-3.png';
    if (m.includes('dolphin')) return '/assets/cars/byd-dolphin.png';
    if (m.includes('han')) return '/assets/cars/byd-han.png';
    if (m.includes('seal u')) return '/assets/cars/byd-seal-u.png';
    if (m.includes('seal')) return '/assets/cars/byd-seal.png';
    return '/assets/cars/byd-seal.png';
  }
  if (b.includes('citroen')) {
    const mNorm = m.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (mNorm.includes('berlingo')) return '/assets/cars/citroen-berlingo.png';
    if (mNorm.includes('spacetourer')) return '/assets/cars/citroen-spacetourer.png';
    if (mNorm.includes('c5 aircross')) return '/assets/cars/citroen-c5-aircross.png';
    if (mNorm.includes('c5 x')) return '/assets/cars/citroen-c5-x.png';
    if (mNorm.includes('c4 x')) return '/assets/cars/citroen-c4-x.png';
    if (mNorm.includes('e-c4')) return '/assets/cars/citroen-e-c4.png';
    if (mNorm.includes('c4')) return '/assets/cars/citroen-c4.png';
    return '/assets/cars/citroen-c3.png';
  }
  if (b.includes('dacia')) {
    if (m.includes('duster')) return '/assets/cars/dacia-duster.png';
    if (m.includes('jogger')) return '/assets/cars/dacia-jogger.png';
    if (m.includes('logan')) return '/assets/cars/dacia-logan.png';
    if (m.includes('spring')) return '/assets/cars/dacia-spring.png';
    return '/assets/cars/dacia-sandero.png';
  }
  if (b.includes('fiat')) {
    if (m.includes('500')) return '/assets/cars/fiat-500e.png';
    if (m.includes('doblo')) return '/assets/cars/fiat-doblo.webp';
    if (m.includes('egea')) return '/assets/cars/fiat-egea.png';
    if (m.includes('panda')) return '/assets/cars/fiat-panda.png';
    if (m.includes('scudo')) return '/assets/cars/fiat-scudo.png';
    if (m.includes('ulyss')) return '/assets/cars/fiat-ulysse.png';
    return '/assets/cars/fiat-tipo.png';
  }
  if (b.includes('ford')) {
    if (m.includes('galaxy')) return '/assets/cars/ford-galaxy.png';
    if (m.includes('kuga')) return '/assets/cars/ford-kuga.png';
    if (m.includes('mondeo')) return '/assets/cars/ford-mondeo.png';
    if (m.includes('mach-e') || m.includes('mustang')) return '/assets/cars/ford-mach-e.png';
    if (m.includes('puma')) return '/assets/cars/ford-puma.png';
    if (m.includes('s-max')) return '/assets/cars/ford-s-max.png';
    if (m.includes('tourneo connect')) return '/assets/cars/ford-tourneo-connect.png';
    if (m.includes('tourneo custom')) return '/assets/cars/ford-tourneo-custom.png';
    return '/assets/cars/ford-focus.png';
  }
  if (b.includes('honda')) {
    if (m.includes('accord')) return '/assets/cars/honda-accord.png';
    if (m.includes('cr-v') || m.includes('crv')) return '/assets/cars/honda-cr-v.png';
    if (m.includes('hr-v') || m.includes('hrv')) return '/assets/cars/honda-hr-v.png';
    if (m.includes('jazz')) return '/assets/cars/honda-jazz.png';
    return '/assets/cars/honda-civic.png';
  }
  if (b.includes('hyundai')) {
    if (m.includes('elantra')) return '/assets/cars/hyundai-elantra.png';
    if (m.includes('i20')) return '/assets/cars/hyundai-i20.png';
    if (m.includes('i30')) return '/assets/cars/hyundai-i30.png';
    if (m.includes('ioniq 5')) return '/assets/cars/hyundai-ioniq-5.png';
    if (m.includes('ioniq 6')) return '/assets/cars/hyundai-ioniq-6.png';
    if (m.includes('ioniq')) return '/assets/cars/hyundai-ioniq.png';
    if (m.includes('kona') || m.includes('kauai')) return '/assets/cars/hyundai-kona.png';
    if (m.includes('santa fe')) return '/assets/cars/hyundai-santa-fe.png';
    if (m.includes('tucson')) return '/assets/cars/hyundai-tucson.png';
    return '/assets/cars/hyundai-i30.png';
  }
  if (b.includes('kia')) {
    if (m.includes('proceed')) return '/assets/cars/kia-proceed.webp';
    if (m.includes('ev6')) return '/assets/cars/kia-ev6.png';
    if (m.includes('niro')) return '/assets/cars/kia-niro.png';
    if (m.includes('optima')) return '/assets/cars/kia-optima.png';
    if (m.includes('sorento')) return '/assets/cars/kia-sorento.png';
    if (m.includes('sportage')) return '/assets/cars/kia-sportage.png';
    if (m.includes('xceed')) return '/assets/cars/kia-xceed.png';
    return '/assets/cars/kia-ceed.png';
  }
  if (b.includes('lexus')) {
    if (m.includes('nx')) return '/assets/cars/lexus-nx.png';
    if (m.includes('rx')) return '/assets/cars/lexus-rx.png';
    if (m.includes('ux')) return '/assets/cars/lexus-ux.png';
    return '/assets/cars/lexus-es.png';
  }
  if (b.includes('mazda')) {
    if (m.includes('cx-30') || m.includes('cx30')) return '/assets/cars/mazda-cx-30.png';
    if (m.includes('cx-5') || m.includes('cx5')) return '/assets/cars/mazda-cx-5.png';
    if (m.includes('cx-60') || m.includes('cx60')) return '/assets/cars/mazda-cx-60.png';
    if (m.includes('6')) return '/assets/cars/mazda-6.webp';
    return '/assets/cars/mazda-3.png';
  }
  if (b.includes('toyota')) {
    if (m.includes('auris')) return '/assets/cars/toyota-auris.png';
    if (m.includes('avensis')) return '/assets/cars/toyota-avensis.png';
    if (m.includes('bz4x')) return '/assets/cars/toyota-bz4x.png';
    if (m.includes('camry')) return '/assets/cars/toyota-camry.png';
    if (m.includes('c-hr') || m.includes('chr')) return '/assets/cars/toyota-c-hr.png';
    if (m.includes('corolla cross')) return '/assets/cars/toyota-corolla-cross.png';
    if (m.includes('highlander')) return '/assets/cars/toyota-highlander.png';
    if (m.includes('prius+') || m.includes('prius +')) return '/assets/cars/toyota-prius-plus.png';
    if (m.includes('prius')) return '/assets/cars/toyota-prius.png';
    if (m.includes('proace city')) return '/assets/cars/toyota-proace-city.png';
    if (m.includes('proace')) return '/assets/cars/toyota-proace.png';
    if (m.includes('rav4') || m.includes('rav 4')) return '/assets/cars/toyota-rav4.png';
    if (m.includes('yaris cross')) return '/assets/cars/toyota-yaris-cross.png';
    if (m.includes('yaris')) return '/assets/cars/toyota-yaris.png';
    return '/assets/cars/toyota-corolla.png';
  }
  if (b.includes('skoda') || b.includes('škoda')) {
    if (m.includes('enyaq')) return '/assets/cars/skoda-enyaq.png';
    if (m.includes('fabia')) return '/assets/cars/skoda-fabia.png';
    if (m.includes('kamiq')) return '/assets/cars/skoda-kamiq.png';
    if (m.includes('karoq')) return '/assets/cars/skoda-karoq.png';
    if (m.includes('kodiaq')) return '/assets/cars/skoda-kodiaq.png';
    if (m.includes('rapid')) return '/assets/cars/skoda-rapid.png';
    if (m.includes('scala')) return '/assets/cars/skoda-scala.png';
    if (m.includes('superb')) return '/assets/cars/skoda-superb.png';
    return '/assets/cars/skoda-octavia.png';
  }
  if (b.includes('mercedes')) {
    if (m.includes('classe a') || m.includes('a-class') || m.includes('a class')) return '/assets/cars/mercedes-classe-a.png';
    if (m.includes('classe b') || m.includes('b-class') || m.includes('b class')) return '/assets/cars/mercedes-classe-b.png';
    if (m.includes('classe c') || m.includes('c-class') || m.includes('c class')) return '/assets/cars/mercedes-classe-c.png';
    if (m.includes('classe s') || m.includes('s-class') || m.includes('s class')) return '/assets/cars/mercedes-classe-s.png';
    if (m.includes('classe v') || m.includes('v-class') || m.includes('v class')) return '/assets/cars/mercedes-classe-v.png';
    if (m.includes('eqa')) return '/assets/cars/mercedes-eqa.png';
    if (m.includes('eqb')) return '/assets/cars/mercedes-eqb.png';
    if (m.includes('eqe')) return '/assets/cars/mercedes-eqe.png';
    if (m.includes('eqs')) return '/assets/cars/mercedes-eqs.png';
    if (m.includes('eqv')) return '/assets/cars/mercedes-eqv.png';
    if (m.includes('sprinter')) return '/assets/cars/mercedes-sprinter.png';
    if (m.includes('vito')) return '/assets/cars/mercedes-vito.png';
    return '/assets/cars/mercedes-e-class.png';
  }
  if (b === 'mg' || b.startsWith('mg ')) {
    if (m.includes('mg5') || m.includes('5')) return '/assets/cars/mg-mg5.png';
    if (m.includes('zs')) return '/assets/cars/mg-zs-ev.png';
    return '/assets/cars/mg-mg4.png';
  }
  if (b.includes('nissan')) {
    if (m.includes('ariya')) return '/assets/cars/nissan-ariya.png';
    if (m.includes('juke')) return '/assets/cars/nissan-juke.png';
    if (m.includes('leaf')) return '/assets/cars/nissan-leaf.png';
    if (m.includes('nv200') || m.includes('nv 200')) return '/assets/cars/nissan-nv200.png';
    if (m.includes('x-trail') || m.includes('xtrail')) return '/assets/cars/nissan-x-trail.png';
    return '/assets/cars/nissan-qashqai.png';
  }
  if (b.includes('opel')) {
    if (m.includes('combo')) return '/assets/cars/opel-combo-life.png';
    if (m.includes('corsa')) return '/assets/cars/opel-corsa.png';
    if (m.includes('crossland')) return '/assets/cars/opel-crossland.png';
    if (m.includes('grandland')) return '/assets/cars/opel-grandland.png';
    if (m.includes('insignia')) return '/assets/cars/opel-insignia.png';
    if (m.includes('mokka')) return '/assets/cars/opel-mokka.png';
    if (m.includes('vivaro')) return '/assets/cars/opel-vivaro.png';
    if (m.includes('zafira')) return '/assets/cars/opel-zafira-life.png';
    return '/assets/cars/opel-astra.png';
  }
  if (b.includes('peugeot')) {
    if (m.includes('e-2008') || m.includes('e2008')) return '/assets/cars/peugeot-e-2008.png';
    if (m.includes('e-308') || m.includes('e308')) return '/assets/cars/peugeot-e-308.png';
    if (m.includes('2008')) return '/assets/cars/peugeot-2008.png';
    if (m.includes('208')) return '/assets/cars/peugeot-208.png';
    if (m.includes('3008')) return '/assets/cars/peugeot-3008.png';
    if (m.includes('308')) return '/assets/cars/peugeot-308.png';
    if (m.includes('408')) return '/assets/cars/peugeot-408.png';
    if (m.includes('5008')) return '/assets/cars/peugeot-5008.png';
    if (m.includes('508')) return '/assets/cars/peugeot-508.png';
    if (m.includes('partner')) return '/assets/cars/peugeot-partner.png';
    if (m.includes('rifter')) return '/assets/cars/peugeot-rifter.png';
    return '/assets/cars/peugeot-traveller.png';
  }
  if (b.includes('renault')) {
    if (m.includes('arkana')) return '/assets/cars/renault-arkana.png';
    if (m.includes('austral')) return '/assets/cars/renault-austral.png';
    if (m.includes('captur')) return '/assets/cars/renault-captur.png';
    if (m.includes('espace')) return '/assets/cars/renault-espace.png';
    if (m.includes('kangoo')) return '/assets/cars/renault-kangoo.png';
    if (m.includes('megane') && (m.includes('e-tech') || m.includes('etech'))) return '/assets/cars/renault-megane-e-tech.png';
    if (m.includes('megane')) return '/assets/cars/renault-megane.png';
    if (m.includes('scenic')) return '/assets/cars/renault-scenic-e-tech.png';
    if (m.includes('talisman')) return '/assets/cars/renault-talisman.png';
    if (m.includes('trafic')) return '/assets/cars/renault-trafic.png';
    if (m.includes('zoe')) return '/assets/cars/renault-zoe.png';
    return '/assets/cars/renault-clio.png';
  }
  if (b.includes('seat')) {
    if (m.includes('alhambra')) return '/assets/cars/seat-alhambra.png';
    if (m.includes('arona')) return '/assets/cars/seat-arona.png';
    if (m.includes('ateca')) return '/assets/cars/seat-ateca.png';
    if (m.includes('leon')) return '/assets/cars/seat-leon.png';
    if (m.includes('tarraco')) return '/assets/cars/seat-tarraco.png';
    if (m.includes('toledo')) return '/assets/cars/seat-toledo.png';
    return '/assets/cars/seat-ibiza.png';
  }
  if (b.includes('suzuki')) {
    if (m.includes('across')) return '/assets/cars/suzuki-across.png';
    if (m.includes('s-cross') || m.includes('scross')) return '/assets/cars/suzuki-s-cross.png';
    if (m.includes('swace')) return '/assets/cars/suzuki-swace.png';
    return '/assets/cars/suzuki-vitara.png';
  }
  if (b.includes('bmw')) {
    const mNorm = m.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (mNorm.includes('serie 2') || mNorm.includes('active tourer')) return '/assets/cars/bmw-serie-2.png';
    if (mNorm.includes('serie 3')) return '/assets/cars/bmw-serie-3.png';
    if (mNorm.includes('i4')) return '/assets/cars/bmw-i4.png';
    if (mNorm.includes('i5')) return '/assets/cars/bmw-i5.png';
    if (mNorm.includes('x1')) return '/assets/cars/bmw-x1.png';
    if (mNorm.includes('x3')) return '/assets/cars/bmw-x3.png';
    return '/assets/cars/bmw-5-series.png';
  }
  if (b.includes('tesla')) {
    if (m.includes('3')) return '/assets/cars/tesla-model-3.png';
    if (m.includes('x')) return '/assets/cars/tesla-model-x.png';
    if (m.includes('y')) return '/assets/cars/tesla-model-y.png';
    return '/assets/cars/tesla-model-s.png';
  }
  if (b.includes('volkswagen') || b === 'vw') {
    if (m.includes('arteon')) return '/assets/cars/vw-arteon.png';
    if (m.includes('caddy')) return '/assets/cars/vw-caddy.png';
    if (m.includes('caravelle')) return '/assets/cars/vw-caravelle.png';
    if (m.includes('id.3') || m.includes('id3') || m.includes('id 3')) return '/assets/cars/vw-id-3.png';
    if (m.includes('id.4') || m.includes('id4') || m.includes('id 4')) return '/assets/cars/vw-id-4.png';
    if (m.includes('id.5') || m.includes('id5') || m.includes('id 5')) return '/assets/cars/vw-id-5.png';
    if (m.includes('id.7') || m.includes('id7') || m.includes('id 7')) return '/assets/cars/vw-id-7.png';
    if (m.includes('buzz')) return '/assets/cars/vw-id-buzz.png';
    if (m.includes('jetta')) return '/assets/cars/vw-jetta.png';
    if (m.includes('passat')) return '/assets/cars/vw-passat.png';
    if (m.includes('sharan')) return '/assets/cars/vw-sharan.png';
    if (m.includes('t-cross') || m.includes('tcross')) return '/assets/cars/vw-t-cross.png';
    if (m.includes('t-roc') || m.includes('troc')) return '/assets/cars/vw-t-roc.png';
    if (m.includes('tiguan')) return '/assets/cars/vw-tiguan.png';
    if (m.includes('touran')) return '/assets/cars/vw-touran.png';
    if (m.includes('transporter')) return '/assets/cars/vw-transporter.png';
    return '/assets/cars/vw-golf.png';
  }
  if (b.includes('volvo')) {
    if (m.includes('ex30')) return '/assets/cars/volvo-ex30.png';
    if (m.includes('ex40')) return '/assets/cars/volvo-ex40.png';
    if (m.includes('s60')) return '/assets/cars/volvo-s60.png';
    if (m.includes('s90')) return '/assets/cars/volvo-s90.png';
    if (m.includes('v60')) return '/assets/cars/volvo-v60.png';
    if (m.includes('v90')) return '/assets/cars/volvo-v90.png';
    if (m.includes('xc40')) return '/assets/cars/volvo-xc40.png';
    if (m.includes('xc90')) return '/assets/cars/volvo-xc90.png';
    return '/assets/cars/volvo-xc60.png';
  }

  return '/assets/cars/toyota-corolla.png';
}
