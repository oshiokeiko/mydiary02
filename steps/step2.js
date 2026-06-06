// ============================================================
// STEP2：ローカル保存を足す
//
// この段階で学ぶこと：
//   ・localStorage … ブラウザの中に情報を保存しておける場所。
//                     リロードしても・ブラウザを閉じても消えない。
//   ・JSON        … 配列やオブジェクトを「文字」に変えて保存し、
//                     読み込むときに元に戻すための変換のしくみ。
//
// STEP1との違い：
//   ・diaries を最初に「保存場所から読み込む」ようにした
//   ・日記を足したら「保存場所に書き込む」ようにした
// ============================================================


// 保存場所につける名前（ラベル）。この名前で出し入れする。
const STORAGE_KEY = 'diary_entries';


// 【保存場所から読み込む】
// localStorage は「文字」しか保存できないので、
// 読み込んだ文字を JSON.parse で配列に戻す。
function loadDiaries() {
  const saved = localStorage.getItem(STORAGE_KEY); // 保存された文字を取り出す
  if (!saved) return [];                            // まだ何もなければ空の配列
  return JSON.parse(saved);                         // 文字 → 配列 に戻す
}

// 【保存場所に書き込む】
// 配列は文字に変えないと保存できないので、JSON.stringify で文字にする。
function saveDiaries(diaries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries)); // 配列 → 文字 にして保存
}


// ============================================================
// 一覧を画面に表示する関数（STEP1とほぼ同じ）
// ============================================================
function showList() {
  // 表示するたびに、保存場所から最新の配列を読み込む
  const diaries = loadDiaries();

  $('#diary-list').empty();

  $.each(diaries, function (index, diary) {
    const cardHtml = `
      <div class="diary-card bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 class="text-lg font-bold mb-2">${escapeHtml(diary.title)}</h3>
        <p class="text-slate-300 text-sm whitespace-pre-wrap">${escapeHtml(diary.body)}</p>
      </div>
    `;
    $('#diary-list').append(cardHtml);
  });
}


// ============================================================
// ページが読み込まれたら動かす処理
// ============================================================
$(function () {

  // 最初に一覧を表示（保存ずみの日記があればここで出る）
  showList();

  $('#add-btn').on('click', function () {
    const title = $('#input-title').val().trim();
    const body  = $('#input-body').val().trim();

    if (!title || !body) {
      alert('タイトルと本文を入力してください。');
      return;
    }

    // いまの保存ずみ日記を読み込む
    const diaries = loadDiaries();

    // 新しい日記（オブジェクト）を作って配列の最後に足す
    const newDiary = {
      title: title,
      body: body
    };
    diaries.push(newDiary);

    // ★足したあとの配列を保存場所に書き込む（ここがSTEP1との違い）
    saveDiaries(diaries);

    // 入力欄を空にする
    $('#input-title').val('');
    $('#input-body').val('');

    // 一覧を表示し直す
    showList();
  });

});


// 入力された文字を安全に表示するための小さな関数（STEP1と同じ）
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
