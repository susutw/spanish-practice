// 「比較」頁的字組：同一個拼法（去掉重音後），重音位置不同、意思也不同。
// 格式同題庫：音節用 - 分開，重音音節全大寫，| 後為中文意思。每組用空行分開。
// 新增後請執行 `node scripts/validate.js`。
(function (root) {
  'use strict';

  const PAIRS = `
    PA-pa|馬鈴薯；教宗
    pa-PÁ|爸爸

    SÁ-ba-na|床單
    sa-BA-na|熱帶草原

    IN-gles|鼠蹊部（複數）
    in-GLÉS|英文；英國人

    SA-bia|有智慧的（陰性）
    sa-BÍ-a|（我／他）以前知道

    se-cre-TA-ria|秘書（女性）
    se-cre-ta-RÍ-a|秘書處

    A-mo|我愛；主人
    a-MÓ|他愛過

    ES-ta|這個（指示詞）
    es-TÁ|他在；他是（estar）

    HA-blo|我說
    ha-BLÓ|他說了

    HA-ble|（希望我／他）說（虛擬式）
    ha-BLÉ|我說了

    COM-pre|（希望我／他）買（虛擬式）
    com-PRÉ|我買了

    CAN-to|我唱；歌聲
    can-TÓ|他唱了

    EN-tre|在…之間（介系詞）
    en-TRÉ|我進去了

    es-TU-dio|我讀書；書房
    es-tu-DIÓ|他讀了

    en-VÍ-o|我寄；寄送
    en-VIÓ|他寄了

    TÉR-mi-no|術語；期限
    ter-MI-no|我結束
    ter-mi-NÓ|他結束了

    PÚ-bli-co|公眾；公開的
    pu-BLI-co|我發表
    pu-bli-CÓ|他發表了

    PRÁC-ti-co|實際的
    prac-TI-co|我練習
    prac-ti-CÓ|他練習了

    con-TI-nuo|連續的
    con-ti-NÚ-o|我繼續
    con-ti-NUÓ|他繼續了

    CÉ-le-bre|有名的
    ce-LE-bre|（希望我／他）慶祝（虛擬式）
    ce-le-BRÉ|我慶祝了

    de-PÓ-si-to|存款；倉庫
    de-po-SI-to|我存放
    de-po-si-TÓ|他存放了

    Á-ni-mo|精神；心情
    a-NI-mo|我鼓勵
    a-ni-MÓ|他鼓勵了

    LÍ-mi-te|界限
    li-MI-te|（希望我／他）限制（虛擬式）
    li-mi-TÉ|我限制了

    TRÁN-si-to|交通
    tran-SI-to|我通行
    tran-si-TÓ|他通行了

    CÁL-cu-lo|計算
    cal-CU-lo|我計算
    cal-cu-LÓ|他計算了

    NÚ-me-ro|號碼；數字
    nu-ME-ro|我編號
    nu-me-RÓ|他編號了

    MÉ-di-co|醫生
    me-DI-co|我給藥
    me-di-CÓ|他給藥了

    CRÍ-ti-co|關鍵的；評論家
    cri-TI-co|我批評
    cri-ti-CÓ|他批評了

    VÁ-li-do|有效的
    va-LI-do|我驗證
    va-li-DÓ|他驗證了
  `;

  const Pairs = { PAIRS };
  if (typeof module !== 'undefined' && module.exports) module.exports = Pairs;
  else root.Pairs = Pairs;
})(typeof window !== 'undefined' ? window : globalThis);
