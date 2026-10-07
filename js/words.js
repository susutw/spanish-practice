// 題庫。格式：音節用 - 分開，重音音節全大寫，| 後為選填備註。
// 例：can-CIÓN、CA-sa、ha-BLÓ|pretérito（他說了）
// 新增字後請執行 `node scripts/validate.js` 確認標註與規則一致。
(function (root) {
  'use strict';

  const CATEGORIES = [
    { key: 'aguda', name: 'Agudas', zh: '重音在最後一音節' },
    { key: 'llana', name: 'Llanas', zh: '重音在倒數第二音節' },
    { key: 'esdrujula', name: 'Esdrújulas', zh: '重音在倒數第三音節以前' },
    { key: 'hiato', name: 'Hiato', zh: '母音相連' },
    { key: 'verbo', name: 'Verbos', zh: '動詞變化' },
    { key: 'plural', name: 'Plurales', zh: '單複數變化' },
  ];

  const WORDS = {
    aguda: `
      can-CIÓN
      ca-FÉ
      so-FÁ
      ma-MÁ
      pa-PÁ
      be-BÉ
      me-NÚ
      ta-BÚ
      co-li-BRÍ
      ra-TÓN
      a-VIÓN
      ja-BÓN
      co-ra-ZÓN
      ca-MIÓN
      lec-CIÓN
      es-ta-CIÓN
      na-CIÓN
      a-de-MÁS
      tam-BIÉN
      a-QUÍ
      a-LLÍ
      a-CÁ
      a-LLÁ
      sa-LÓN
      bal-CÓN
      li-MÓN
      me-LÓN
      a-le-MÁN
      fran-CÉS
      in-GLÉS
      ja-po-NÉS
      por-tu-GUÉS
      a-TRÁS
      qui-ZÁS
      com-PÁS
      au-to-BÚS
      a-NÍS
      ma-NÍ
      ru-BÍ
      al-ma-CÉN
      an-DÉN
      jar-DÍN
      del-FÍN
      bo-TÍN
      ca-pi-TÁN
      sar-TÉN
      ha-BLAR
      co-MER
      vi-VIR
      be-BER
      can-TAR
      sa-LIR
      re-LOJ
      pa-RED
      ciu-DAD
      ver-DAD
      bon-DAD
      li-ber-TAD
      sa-LUD
      ju-ven-TUD
      ac-ti-TUD
      us-TED
      a-ni-MAL
      pa-PEL
      ho-TEL
      es-pa-ÑOL
      ca-ra-COL
      a-ZUL
      co-LOR
      ca-LOR
      a-MOR
      se-ÑOR
      doc-TOR
      pro-fe-SOR
      mo-TOR
      mu-JER
      ta-LLER
      fe-LIZ
      ca-PAZ
      na-RIZ
      a-RROZ
      ve-JEZ
      ni-ÑEZ
      vi-RREY
    `,
    llana: `
      CA-sa
      CA-sas
      ME-sa
      LI-bro
      PE-rro
      GA-to
      MA-dre
      PA-dre
      her-MA-no
      a-MI-go
      es-CUE-la
      ven-TA-na
      za-PA-tos
      LU-nes
      MAR-tes
      JUE-ves
      VIER-nes
      CRI-sis
      TE-sis
      e-XA-men
      vo-LU-men
      i-MA-gen
      JO-ven
      o-RI-gen
      OR-den
      CRI-men
      re-SU-men
      MAR-gen
      TRI-bu
      PLA-ya
      CA-lle
      NO-che
      LE-che
      MU-cho
      GRA-cias
      BUE-no
      A-gua
      fa-MI-lia
      his-TO-ria
      pa-LA-bra
      co-MI-da
      ca-MI-sa
      mon-TA-ña
      ma-ÑA-na
      se-MA-na
      dic-cio-NA-rio
      ar-MA-rio
      LLA-ve
      VER-de
      GA-fas
      com-pu-ta-DO-ra
      ÁR-bol
      LÁ-piz
      FÁ-cil
      di-FÍ-cil
      Ú-til
      Á-gil
      FRÁ-gil
      MÓ-vil
      a-ZÚ-car
      CÉS-ped
      CÁR-cel
      ÁL-bum
      CÓN-sul
      ca-RÁC-ter
      DÓ-lar
      ÁN-gel
      NÉC-tar
      MÁR-mol
      FÚT-bol
      BÉIS-bol
      LÍ-der
      CÓ-mic
      RÉ-cord
      CRÁ-ter
      TÚ-nel
      HUÉS-ped
      FÉ-mur
      CÁN-cer
      ca-DÁ-ver
    `,
    esdrujula: `
      MÚ-si-ca
      te-LÉ-fo-no
      PÁ-ja-ro
      MÉ-di-co
      NÚ-me-ro
      SÁ-ba-do
      MIÉR-co-les
      PÚ-bli-co
      PLÁ-ta-no
      LÁM-pa-ra
      MÁ-qui-na
      CÁ-ma-ra
      BRÚ-ju-la
      PÁ-gi-na
      ma-te-MÁ-ti-cas
      gra-MÁ-ti-ca
      LÁ-gri-ma
      RÁ-pi-do
      SÍ-la-ba
      ÚL-ti-mo
      PRÓ-xi-mo
      Ó-pe-ra
      pe-LÍ-cu-la
      bo-LÍ-gra-fo
      ki-LÓ-me-tro
      es-TÓ-ma-go
      mur-CIÉ-la-go
      HÚ-me-do
      TÍ-mi-do
      SÓ-li-do
      CÉ-le-bre
      LÍ-qui-do
      o-CÉ-a-no
      É-xi-to
      CLÁ-si-co
      PRÁC-ti-co
      TRÁ-fi-co
      mag-NÍ-fi-co
      SÍM-bo-lo
      VÍ-bo-ra
      HÍ-ga-do
      DÉ-ci-mo
      SÍN-to-ma
      MÁ-gi-co
      HÉ-ro-e
      PÉN-du-lo
      e-co-NÓ-mi-co
      po-LÍ-ti-ca
      DÍ-ga-me-lo|sobresdrújula（請您跟我說）
      CÓM-pra-se-lo|sobresdrújula（幫他買）
      ex-PLÍ-ca-me-lo|sobresdrújula（解釋給我聽）
    `,
    hiato: `
      DÍ-a
      pa-ÍS
      ba-ÚL
      RÍ-o
      TÍ-a
      TÍ-o
      MÍ-o
      FRÍ-o
      VÍ-a
      GUÍ-a
      ma-ÍZ
      ra-ÍZ
      la-ÚD
      a-ta-ÚD
      o-ÍR
      re-ÍR
      son-re-ÍR
      le-Í-do
      ca-Í-da
      o-Í-do
      pro-HÍ-be|h 不影響 hiato
      BÚ-ho|h 不影響 hiato
      po-e-SÍ-a
      e-co-no-MÍ-a
      fi-lo-so-FÍ-a
      ge-o-gra-FÍ-a
      bio-lo-GÍ-a
      ca-fe-te-RÍ-a
      pa-na-de-RÍ-a
      li-bre-RÍ-a
      a-le-GRÍ-a
      e-ner-GÍ-a
      com-pa-ÑÍ-a
      ba-te-RÍ-a
      tran-VÍ-a
      e-go-ÍS-ta
      he-ro-ÍS-mo
      te-A-tro
      le-ÓN
      po-E-ta
      co-RRE-o
      i-DE-a
      pe-LE-a
      ma-RE-a
      FE-o
      a-É-re-o
      le-ER
      cre-ER
      ca-ER
      tra-ER
      PIA-no
      CIEN-cia
      a-GEN-cia
      SE-rie
      NIE-ve
      RUI-do
      VIU-da
      PEI-ne
      AI-re
      BAI-le
      DEU-da
      CAU-sa
      AU-la
      re-CIEN-te
      a-CEI-te
      RA-dio
      cui-DA-do
      a-DIÓS
      GUION|2010 年起算單音節，不標
    `,
    verbo: `
      HA-blo|presente, yo（我說）
      ha-BLÓ|pretérito, él（他說了）
      HA-ble|subjuntivo（說）
      ha-BLÉ|pretérito, yo（我說了）
      COM-pre|subjuntivo（買）
      com-PRÉ|pretérito, yo（我買了）
      ES-ta|指示詞（這個），不是動詞
      es-TÁ|estar, él（他在）
      es-TÁS|estar, tú
      es-TÁN|estar, ellos
      es-TOY|estar, yo — 字尾 y 算子音
      tra-BA-jo|presente, yo（我工作）
      tra-ba-JÓ|pretérito, él（他工作了）
      CAN-to|presente, yo（我唱）
      can-TÓ|pretérito, él（他唱了）
      TO-mo|presente, yo（我拿）
      to-MÓ|pretérito, él（他拿了）
      TO-me|subjuntivo（拿）
      to-MÉ|pretérito, yo（我拿了）
      LLE-go|presente, yo（我抵達）
      lle-GÓ|pretérito, él（他抵達了）
      PA-so|presente, yo（我經過）
      pa-SÓ|pretérito, él（發生了）
      es-TU-dio|presente, yo（我讀書）
      es-tu-DIÓ|pretérito, él（他讀了）
      MI-re|subjuntivo（看）
      mi-RÉ|pretérito, yo（我看了）
      EN-tre|介系詞（在…之間）
      en-TRÉ|pretérito, yo（我進去了）
      ter-MI-no|presente, yo（我結束）
      ter-mi-NÓ|pretérito, él（他結束了）
      TÉR-mi-no|名詞（術語、期限）
      pu-BLI-co|presente, yo（我發表）
      pu-bli-CÓ|pretérito, él（他發表了）
      con-TI-nuo|形容詞（連續的）
      con-ti-NÚ-o|presente, yo（我繼續）— hiato
      con-ti-NUÓ|pretérito, él（他繼續了）
      en-VÍ-o|presente, yo（我寄）— hiato
      en-VIÓ|pretérito, él（他寄了）
      co-MÍ|pretérito, yo（我吃了）
      co-MIÓ|pretérito, él（他吃了）
      vi-VÍ|pretérito, yo（我住過）
      vi-VIÓ|pretérito, él（他住過）
      a-pren-DÍ|pretérito, yo（我學了）
      a-pren-DIÓ|pretérito, él（他學了）
      pi-DIÓ|pretérito, él（他要求了）
      dur-MIÓ|pretérito, él（他睡了）
      sa-LIÓ|pretérito, él（他出去了）
      HI-ce|pretérito 不規則, yo（我做了）
      HI-zo|pretérito 不規則, él（他做了）
      TU-ve|pretérito 不規則, yo（我有過）
      TU-vo|pretérito 不規則, él（他有過）
      PU-de|pretérito 不規則, yo（我能夠）
      PU-do|pretérito 不規則, él（他能夠）
      QUI-se|pretérito 不規則, yo（我想要）
      DI-je|pretérito 不規則, yo（我說了）
      DI-jo|pretérito 不規則, él（他說了）
      es-TU-ve|pretérito 不規則, yo（我在過）
      VI-ne|pretérito 不規則, yo（我來了）
      PU-se|pretérito 不規則, yo（我放了）
      SU-pe|pretérito 不規則, yo（我得知）
      FUE|ser / ir, pretérito, él
      FUI|ser / ir, pretérito, yo
      DIO|dar, pretérito, él（他給了）
      VIO|ver, pretérito, él（他看見了）
      SOIS|ser, vosotros
      ha-BLÁ-ba-mos|imperfecto, nosotros
      es-TÁ-ba-mos|imperfecto, nosotros
      É-ra-mos|imperfecto, nosotros
      Í-ba-mos|imperfecto, nosotros
      ha-BLA-ba|imperfecto, yo / él
      es-TA-ba|imperfecto, yo / él
      I-ba|imperfecto, yo / él
      E-ra|imperfecto, yo / él
      co-MÍ-a|imperfecto, yo / él — hiato
      co-MÍ-a-mos|imperfecto, nosotros — hiato
      te-NÍ-a|imperfecto, yo / él — hiato
      vi-VÍ-a|imperfecto, yo / él — hiato
      ha-BÍ-a|imperfecto, yo / él — hiato
      se-RÍ-a|condicional — hiato
      ten-DRÍ-a|condicional — hiato
      gus-ta-RÍ-a|condicional — hiato
      ha-bla-RÉ|futuro, yo
      co-me-RÁS|futuro, tú
      vi-vi-RÁ|futuro, él
      se-RÁ|futuro, él
      ten-DRÁN|futuro, ellos
      ha-bla-RE-mos|futuro, nosotros
      i-RE-mos|futuro, nosotros
      ha-BLÁIS|presente, vosotros
      co-MÉIS|presente, vosotros
      vi-VÍS|presente, vosotros
      CO-mes|presente, tú
      VI-ven|presente, ellos
      ha-BLA-mos|presente, nosotros
      co-ME-mos|presente, nosotros
      DÍ-me-lo|imperativo + 代名詞
      DÁ-me-lo|imperativo + 代名詞
      CÓM-pra-lo|imperativo + 代名詞
      HÁ-bla-me|imperativo + 代名詞
      es-CRÍ-be-me|imperativo + 代名詞
      le-VÁN-ta-te|imperativo + 代名詞
      SIÉN-ta-te|imperativo + 代名詞
      DI-me|imperativo + 代名詞，仍是 llana
      DA-me|imperativo + 代名詞，仍是 llana
      ha-BLÁN-do-le|gerundio + 代名詞
      co-MIÉN-do-lo|gerundio + 代名詞
    `,
    plural: `
      e-XÁ-me-nes|examen → exámenes
      JÓ-ve-nes|joven → jóvenes
      o-RÍ-ge-nes|origen → orígenes
      i-MÁ-ge-nes|imagen → imágenes
      CRÍ-me-nes|crimen → crímenes
      vo-LÚ-me-nes|volumen → volúmenes
      re-SÚ-me-nes|resumen → resúmenes
      MÁR-ge-nes|margen → márgenes
      ÓR-de-nes|orden → órdenes
      re-GÍ-me-nes|régimen → regímenes（重音位置移動）
      RÉ-gi-men|régimen → regímenes（單數）
      can-CIO-nes|canción → canciones
      a-VIO-nes|avión → aviones
      lec-CIO-nes|lección → lecciones
      ra-TO-nes|ratón → ratones
      ja-BO-nes|jabón → jabones
      co-ra-ZO-nes|corazón → corazones
      in-GLE-ses|inglés → ingleses
      fran-CE-ses|francés → franceses
      ja-po-NE-ses|japonés → japoneses
      a-le-MA-nes|alemán → alemanes
      au-to-BU-ses|autobús → autobuses
      pa-Í-ses|país → países
      ra-Í-ces|raíz → raíces
      ba-Ú-les|baúl → baúles
      co-li-BRÍ-es|colibrí → colibríes
      ru-BÍ-es|rubí → rubíes
      ca-FÉS|café → cafés
      so-FÁS|sofá → sofás
      me-NÚS|menú → menús
      be-BÉS|bebé → bebés
      LÁ-pi-ces|lápiz → lápices
      ÁR-bo-les|árbol → árboles
      FÁ-ci-les|fácil → fáciles
      di-FÍ-ci-les|difícil → difíciles
      Ú-ti-les|útil → útiles
      MÓ-vi-les|móvil → móviles
      DÓ-la-res|dólar → dólares
      ÁN-ge-les|ángel → ángeles
      LÍ-de-res|líder → líderes
      CÁR-ce-les|cárcel → cárceles
      TÚ-ne-les|túnel → túneles
      ca-rac-TE-res|carácter → caracteres（重音位置移動）
      re-LO-jes|reloj → relojes
      pa-RE-des|pared → paredes
      ciu-DA-des|ciudad → ciudades
      ho-TE-les|hotel → hoteles
      co-LO-res|color → colores
      se-ÑO-res|señor → señores
      mu-JE-res|mujer → mujeres
      a-ni-MA-les|animal → animales
      VE-ces|vez → veces
      LU-ces|luz → luces
      PE-ces|pez → peces
    `,
  };

  const Words = { CATEGORIES, WORDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = Words;
  else root.Words = Words;
})(typeof window !== 'undefined' ? window : globalThis);
