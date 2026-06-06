// ============================================================
// STEP3：削除を足す
//
// この段階で学ぶこと：
//   ・id      … 日記1件ずつに付ける「見分けるための番号」
//   ・filter  … 配列から「条件に合うものだけ」を残して新しい配列を作る命令
//                （＝削除したい1件だけを取り除くのに使う）
//
// STEP2との違い：
//   ・新しい日記に id（番号）を付けるようにした
//   ・カードに「削除」ボタンを足した
//   ・削除する deleteDiary 関数を足した
// ============================================================


const STORAGE_KEY = 'diary_entries';

function loadDiaries() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  return JSON.parse(saved);
}

function saveDiaries(diaries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
}


// ============================================================
// 一覧を画面に表示する関数
// ============================================================
function showList() {
  const diaries = loadDiaries();
  $('#diary-list').empty();

  $.each(diaries, function (index, diary) {
    // カードのHTML（削除ボタンを追加した）
    const cardHtml = `
      <div class="diary-card bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 class="text-lg font-bold mb-2">${escapeHtml(diary.title)}</h3>
        <p class="text-slate-300 text-sm whitespace-pre-wrap mb-3">${escapeHtml(diary.body)}</p>
        <button class="delete-btn text-xs bg-red-900 hover:bg-red-700 px-3 py-1 rounded transition-colors">削除</button>
      </div>
    `;

    // ★ポイント：カードを「jQueryのまとまり」として作る（$( ) で囲う）。
    //   こうすると、このカードの中の削除ボタンに直接、動きをつけられる。
    const $card = $(cardHtml);

    // このカードの削除ボタンが押されたら、この日記（diary.id）を削除する。
    // ※ループの中で1枚ずつボタンに動きをつけるので、分かりやすい。
    $card.find('.delete-btn').on('click', function () {
      deleteDiary(diary.id);
    });

    // 出来上がったカードを一覧に追加
    $('#diary-list').append($card);
  });
}


// ============================================================
// 日記を1件削除する関数
// ============================================================
function deleteDiary(id) {
  // 「本当に消す？」の確認。OKを押さなければ何もしない。
  if (!confirm('この日記を削除しますか？')) {
    return;
  }

  const diaries = loadDiaries();

  // 【filter】「id が一致しない日記だけ」を残す＝消したい1件だけが取り除かれる。
  const remaining = diaries.filter(function (diary) {
    return diary.id !== id;
  });

  saveDiaries(remaining); // 取り除いたあとの配列を保存
  showList();             // 一覧を表示し直す
}


// ============================================================
// ページが読み込まれたら動かす処理
// ============================================================
$(function () {

  showList();

  $('#add-btn').on('click', function () {
    const title = $('#input-title').val().trim();
    const body  = $('#input-body').val().trim();

    if (!title || !body) {
      alert('タイトルと本文を入力してください。');
      return;
    }

    const diaries = loadDiaries();

    // 新しい日記。id（番号）を足した。
    // Date.now() は「今の時刻を数字にしたもの」。作るたびに違う数字になるので、
    // 日記を見分ける番号としてちょうどよい。
    const newDiary = {
      id: Date.now(),
      title: title,
      body: body
    };
    // unshift で配列の先頭に足す → 新しい日記が一覧の一番上に出る
    diaries.unshift(newDiary);

    saveDiaries(diaries);

    $('#input-title').val('');
    $('#input-body').val('');

    showList();
  });

});


function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
