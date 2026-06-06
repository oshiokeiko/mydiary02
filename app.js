
// ------------------------------------------------------------
// 最初にまとめて用意しておくもの
// ------------------------------------------------------------

// 保存場所につける名前（ラベル）
const STORAGE_KEY = 'diary_entries';

// いま選ばれている気分の絵文字。最初は 😊。
let selectedMood = '😊';


// ------------------------------------------------------------
// 保存場所の出し入れ
// ------------------------------------------------------------

// 保存場所から読み込む（文字 → 配列 に戻す）
function loadDiaries() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  return JSON.parse(saved);
}

// 保存場所に書き込む（配列 → 文字 にして保存）
function saveDiaries(diaries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
}


// ------------------------------------------------------------
// 日付を「2026/06/06」の形にする
// ------------------------------------------------------------
function formatDate(isoString) {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0'); // 月は0始まりなので +1。2桁にそろえる
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}


// ------------------------------------------------------------
// 気分の絵文字を選ぶ
// ------------------------------------------------------------
function selectMood(mood) {
  selectedMood = mood;                                  // 選ばれた絵文字を覚えておく
  $('.mood-btn').removeClass('selected');               // いったん全ボタンの選択を外す
  $(`.mood-btn[data-mood="${mood}"]`).addClass('selected'); // 選んだボタンだけ色をつける
}


// ------------------------------------------------------------
// 一覧を画面に表示する
// ------------------------------------------------------------
function showList() {
  const diaries = loadDiaries();
  $('#diary-list').empty();

  // 0件なら案内メッセージを出して終わり
  if (diaries.length === 0) {
    $('#empty-message').removeClass('hidden');
    return;
  }
  $('#empty-message').addClass('hidden');

  // 1件ずつカードにして並べる
  // ※追加のとき unshift で配列の先頭に足しているので、ここで並べ替えなくても自然と新しい順になる
  $.each(diaries, function (index, diary) {
    const cardHtml = `
      <div class="diary-card bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div class="flex items-start gap-3 mb-2">
          <span class="text-3xl">${diary.mood}</span>
          <h3 class="text-lg font-bold pt-1">${escapeHtml(diary.title)}</h3>
        </div>
        <p class="text-slate-300 text-sm whitespace-pre-wrap mb-3">${escapeHtml(diary.body)}</p>
        <div class="flex items-center justify-between border-t border-slate-700 pt-2">
          <span class="text-xs text-slate-400">${formatDate(diary.createdAt)}</span>
          <button class="delete-btn text-xs bg-red-900 hover:bg-red-700 px-3 py-1 rounded transition-colors">削除</button>
        </div>
      </div>
    `;

    // カードをjQueryのまとまりとして作り、その削除ボタンに動きをつける
    const $card = $(cardHtml);
    $card.find('.delete-btn').on('click', function () {
      deleteDiary(diary.id);
    });
    $('#diary-list').append($card);
  });
}


// ------------------------------------------------------------
// 日記を1件削除する
// ------------------------------------------------------------
function deleteDiary(id) {
  if (!confirm('この日記を削除しますか？')) {
    return;
  }
  const diaries = loadDiaries();
  // id が一致しないものだけ残す＝消したい1件だけ取り除く
  const remaining = diaries.filter(function (diary) {
    return diary.id !== id;
  });
  saveDiaries(remaining);
  showList();
}


// ------------------------------------------------------------
// ページが読み込まれたら動かす処理
// ------------------------------------------------------------
$(function () {

  // 最初に一覧を表示し、気分の初期値（😊）を選んでおく
  showList();
  selectMood('😊');

  // 気分の絵文字ボタンを押したとき
  $('.mood-btn').on('click', function () {
    const mood = $(this).data('mood'); // 押したボタンの data-mood を読み取る
    selectMood(mood);
  });

  // 「追加する」ボタンを押したとき
  $('#add-btn').on('click', function () {
    const title = $('#input-title').val().trim();
    const body  = $('#input-body').val().trim();

    if (!title || !body) {
      alert('タイトルと本文を入力してください。');
      return;
    }

    const diaries = loadDiaries();

    // 新しい日記（オブジェクト）を作る
    const newDiary = {
      id: Date.now(),                    // 見分けるための番号（＝作った時刻）
      title: title,
      mood: selectedMood,                // いま選ばれている気分
      body: body,
      createdAt: new Date().toISOString() // 作った日時（日付表示に使う）
    };
    // unshift で配列の先頭に足す → 新しい日記が一覧の一番上に出る
    diaries.unshift(newDiary);

    saveDiaries(diaries);

    // 入力欄と気分を最初の状態に戻す
    $('#input-title').val('');
    $('#input-body').val('');
    selectMood('😊');

    showList();
  });

});


// ------------------------------------------------------------
// 入力された文字を安全に表示するための小さな関数
// ------------------------------------------------------------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
