/*
  app.js — 日記アプリのすべてのロジック
  jQuery を使って書いています。
  $ から始まる変数や関数が jQuery の機能です。
*/

// ============================================================
// 【グローバル変数】ファイル全体で使いまわす変数を最初にまとめて定義
// ============================================================

// 編集中の日記IDを保持する変数。
// null のとき → 新規作成モード
// 数字が入っているとき → その ID の日記を編集中
// ★重要：モーダルを閉じるたびに必ず null に戻す（リセット忘れ防止）
let editingId = null;

// 選択中の絵文字を保持する変数。初期値は 😊
let selectedMood = '😊';

// ローカルストレージに保存するときのキー名（固定）
const STORAGE_KEY = 'diary_entries';


// ============================================================
// 【ローカルストレージ 操作】データを保存・読み込みする関数
// ============================================================

/**
 * ローカルストレージから日記データをすべて読み込む。
 * ローカルストレージ＝ブラウザの中に情報を保存しておける場所。
 * ページをリロードしても消えない。
 * データは文字列でしか保存できないので、JSON.parse で配列に変換して返す。
 */
function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  // localStorage.getItem：指定したキーのデータを取り出す
  // データがなければ null が返ってくるので、そのときは空の配列を返す
  if (!raw) return [];
  return JSON.parse(raw);
  // JSON.parse：文字列 → JavaScript の配列・オブジェクトに変換する
}

/**
 * 日記データの配列をローカルストレージに保存する。
 * @param {Array} entries — 保存したい日記の配列
 */
function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  // JSON.stringify：JavaScript の配列・オブジェクト → 文字列に変換する
  // localStorage.setItem：指定したキーで文字列を保存する
}


// ============================================================
// 【日付フォーマット】ISO形式の日付を「YYYY/MM/DD」に変換する
// ============================================================

/**
 * "2025-05-25T10:00:00.000Z" のような形式を "2025/05/25" に変換する。
 * @param {string} isoString — ISO形式の日付文字列
 * @returns {string} YYYY/MM/DD 形式の文字列
 */
function formatDate(isoString) {
  const date = new Date(isoString);
  // new Date(文字列)：日付文字列を Date オブジェクト（日付を扱えるもの）に変換
  const y = date.getFullYear();        // 年（例：2025）
  const m = String(date.getMonth() + 1).padStart(2, '0'); // 月（0始まりなので+1。2桁に0埋め）
  const d = String(date.getDate()).padStart(2, '0');       // 日（2桁に0埋め）
  return `${y}/${m}/${d}`;
  // テンプレートリテラル：バッククォートで囲み ${変数} で埋め込む。文字列を組み立てる便利な書き方。
}


// ============================================================
// 【一覧描画】日記カードを画面に表示する
// ============================================================

/**
 * 日記データの配列を受け取り、カードとして画面に描画する。
 * 呼ぶたびに一覧を全部作り直す方式（シンプルで確実）。
 */
function renderCards() {
  const entries = loadEntries();

  // 日記をクリアしてから描き直す
  $('#diary-list').empty();
  // jQuery の empty()：指定した要素の中身をすべて消す

  // 日記が0件のとき「まだ日記がありません」メッセージを表示
  if (entries.length === 0) {
    $('#empty-message').removeClass('hidden');
    return; // 以降の処理をスキップ
  }
  $('#empty-message').addClass('hidden');

  // 新しい順に並べる（createdAt が大きい＝新しい順）
  // sort()：配列を並べ替えるJavaScriptの機能
  // b.createdAt - a.createdAt にすると大きい方が前に来る（降順）
  const sorted = [...entries].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
    // [...entries]：元の配列を壊さないようにコピーしてから並べ替える
  });

  // 並べ替えた配列を1件ずつカードにして追加する
  sorted.forEach(function(entry) {
    // forEach：配列の要素を1つずつ順番に処理する繰り返し

    // 本文の冒頭80文字だけ表示（超える場合は「...」を付ける）
    const preview = entry.body.length > 80
      ? entry.body.slice(0, 80) + '...'
      : entry.body;
    // 三項演算子：「条件 ? 真のとき : 偽のとき」という書き方
    // slice(0, 80)：文字列の0文字目から80文字目を切り出す

    // カードのHTMLを文字列で組み立てる
    // data-id に日記のIDを埋め込んで、編集・削除ボタンを押したとき使えるようにする
    const cardHtml = `
      <div class="diary-card bg-slate-800 rounded-xl p-5 border border-slate-700 flex flex-col gap-3">

        <!-- 絵文字とタイトル -->
        <div class="flex items-start gap-3">
          <span class="text-3xl">${entry.mood}</span>
          <h3 class="text-lg font-bold text-white leading-tight pt-1">${escapeHtml(entry.title)}</h3>
        </div>

        <!-- 本文プレビュー -->
        <p class="text-slate-300 text-sm leading-relaxed flex-1">${escapeHtml(preview)}</p>

        <!-- 日付と操作ボタン -->
        <div class="flex items-center justify-between pt-1 border-t border-slate-700">
          <span class="text-xs text-slate-400">${formatDate(entry.createdAt)}</span>
          <div class="flex gap-2">
            <button
              class="edit-btn text-xs bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded transition-colors"
              data-id="${entry.id}"
            >編集</button>
            <button
              class="delete-btn text-xs bg-red-900 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
              data-id="${entry.id}"
            >削除</button>
          </div>
        </div>

      </div>
    `;

    $('#diary-list').append(cardHtml);
    // jQuery の append()：指定した要素の末尾に内容を追加する
  });
}

/**
 * HTMLインジェクション対策：ユーザーが入力したテキストの特殊文字をエスケープする。
 * 例）<script> などの危険なコードが日記に書かれても、そのまま実行されないようにする。
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


// ============================================================
// 【モーダル操作】開く・閉じる
// ============================================================

/**
 * モーダルを開く。
 * 新規作成のときは空の状態で開き、編集のときは既存データを流し込む。
 * @param {Object|null} entry — 編集するデータ。新規のときは null を渡す。
 */
function openModal(entry) {
  if (entry) {
    // 編集モード：タイトルを「編集」に変えてデータを流し込む
    editingId = entry.id;
    $('#modal-title').text('日記を編集');
    $('#input-title').val(entry.title);
    $('#input-body').val(entry.body);
    selectMood(entry.mood); // 保存済みの絵文字を選択状態にする
  } else {
    // 新規作成モード：フォームを空にする
    editingId = null;
    $('#modal-title').text('日記を書く');
    $('#input-title').val('');
    $('#input-body').val('');
    selectMood('😊'); // 初期値を 😊 にする
  }

  // モーダルを表示する（hidden クラスを外して flex クラスを付ける）
  $('#modal-overlay').removeClass('hidden').addClass('flex');
}

/**
 * モーダルを閉じる。
 * ★必ずここで editingId と selectedMood をリセットする（引き継ぎバグ防止）
 * キャンセルボタン・保存ボタン・×ボタン・背景幕クリック、すべてここを通す。
 */
function closeModal() {
  $('#modal-overlay').removeClass('flex').addClass('hidden');

  // ★忘れずリセット：次に開いたとき前の値を引き継がないように
  editingId = null;
  selectedMood = '😊';

  // 絵文字ボタンの選択状態もリセット
  $('.mood-btn').removeClass('selected');
}

/**
 * 絵文字を選択状態にする。
 * 全ボタンの selected クラスを一度外してから、選んだボタンだけに付ける。
 * @param {string} mood — 選択する絵文字（例："😊"）
 */
function selectMood(mood) {
  selectedMood = mood;
  $('.mood-btn').removeClass('selected');
  // jQuery のセレクター：.クラス名 で該当するすべての要素を一括指定できる
  $(`.mood-btn[data-mood="${mood}"]`).addClass('selected');
  // [data-mood="😊"] のように属性値で絞り込んで、selected クラスを付ける
}


// ============================================================
// 【イベント処理】ボタンが押されたときの動作
// ============================================================

// $(function() { ... }) は「ページの読み込みが完了してから処理を実行する」という jQuery の書き方。
// HTML が全部読み込まれる前に JavaScript が動くと、要素が見つからずエラーになるのを防ぐ。
$(function () {

  // ページ読み込み直後に一覧を描画する
  renderCards();


  // ----- 「日記を書く」ボタン -----
  $('#open-modal-btn').on('click', function () {
    openModal(null); // null を渡す＝新規作成モード
  });
  // jQuery の on('click', 関数)：クリックされたときに関数を実行する


  // ----- モーダルの × ボタン -----
  $('#modal-close-btn').on('click', function () {
    closeModal();
  });


  // ----- 背景の幕をクリックしてモーダルを閉じる -----
  $('#modal-backdrop').on('click', function () {
    closeModal();
  });


  // ----- キャンセルボタン -----
  $('#cancel-btn').on('click', function () {
    closeModal();
  });


  // ----- 絵文字ボタンのクリック -----
  // .mood-btn は複数あるが、jQuery は全部にまとめてイベントを設定できる
  // HTMLに最初から存在する静的な要素なので、document委譲は不要
  $('.mood-btn').on('click', function () {
    const mood = $(this).data('mood');
    // $(this)：クリックされたその要素自身を指す
    // .data('mood')：data-mood 属性の値を取り出す
    selectMood(mood);
  });


  // ----- 保存ボタン -----
  $('#save-btn').on('click', function () {
    const title = $('#input-title').val().trim();
    const body  = $('#input-body').val().trim();
    // .val()：入力欄の値を取得する jQuery の機能
    // .trim()：前後の空白や改行を取り除く JavaScript の機能

    // 入力チェック：タイトルか本文が空のときはアラートを出して中断
    if (!title || !body) {
      alert('タイトルと本文を入力してください。');
      return; // return で以降の処理をスキップ
    }

    // ローカルストレージから既存データを読み込む
    const entries = loadEntries();

    if (editingId === null) {
      // ★新規作成モード（editingId が null）
      const newEntry = {
        id: Date.now(),
        // Date.now()：現在時刻をミリ秒単位の数字で返す。ユニークなIDとして使う
        title: title,
        mood: selectedMood,
        body: body,
        createdAt: new Date().toISOString()
        // new Date().toISOString()：現在時刻を ISO 形式（"2025-05-25T10:00:00.000Z"）の文字列で返す
      };
      entries.push(newEntry);
      // push()：配列の末尾に要素を追加する JavaScript の機能

    } else {
      // ★編集モード（editingId に数字が入っている）
      // 配列の中から該当IDのインデックス（位置）を探す
      const index = entries.findIndex(function (e) {
        return e.id === editingId;
      });
      // findIndex()：条件に合う要素の位置（番号）を返す。見つからなければ -1

      if (index !== -1) {
        // 見つかった場合だけ上書き（念のため -1 でないことを確認）
        entries[index].title = title;
        entries[index].mood  = selectedMood;
        entries[index].body  = body;
        // createdAt はそのまま変えない（作成日時は保持する）
      }
    }

    // 変更後の配列をローカルストレージに保存
    saveEntries(entries);

    // モーダルを閉じる（内部で editingId もリセットされる）
    closeModal();

    // 一覧を再描画して画面に反映する
    renderCards();
  });


  // ----- 編集ボタン（カード上のボタン）-----
  // カードはページ読み込み後に動的に追加されるので、
  // document に対してイベントを設定して「後から追加された要素」にも対応する。
  // これを「イベント委譲（デリゲーション）」という。
  $(document).on('click', '.edit-btn', function () {
    const id = Number($(this).data('id'));
    // $(this).data('id')：クリックされたボタンの data-id 属性値を取得
    // Number()：文字列を数値に変換（data属性の値は文字列で取れるので）

    const entries = loadEntries();
    const entry = entries.find(function (e) {
      return e.id === id;
    });
    // find()：条件に合う最初の要素を返す。findIndex とちがい、要素そのものが返る

    if (entry) {
      openModal(entry); // 見つかったデータを渡して編集モードで開く
    }
  });


  // ----- 削除ボタン（カード上のボタン）-----
  $(document).on('click', '.delete-btn', function () {
    const id = Number($(this).data('id'));

    // confirm()：「OK / キャンセル」の確認ダイアログを表示する。OK なら true が返る
    if (!confirm('この日記を削除しますか？\n元に戻すことはできません。')) {
      return; // キャンセルを押した場合は何もしない
    }

    let entries = loadEntries();

    // filter()：条件に合う要素だけを残して新しい配列を作る
    // id が一致しない（＝削除対象でない）ものだけ残す
    entries = entries.filter(function (e) {
      return e.id !== id;
    });

    saveEntries(entries); // 削除後の配列を保存
    renderCards();        // 一覧を再描画
  });

}); // $(function() の終わり
