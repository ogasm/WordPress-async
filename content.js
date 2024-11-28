// 重複実行チェック
if (window['___already_injected']) {
  throw 'already_injected';
} else {
  window['___already_injected'] = true;
}

// コードエディターへの切り替え関数
async function switchToCodeEditor() {
  try {
    // 全てのメニューボタンを取得し、最後のものを選択
    const menuButtons = document.querySelectorAll('button.components-button.components-dropdown-menu__toggle');
    const moreMenuButton = menuButtons[menuButtons.length - 1];
    
    if (!moreMenuButton) {
      console.log('メニューボタン未検出');
      return false;
    }
    
    moreMenuButton.click();
    // メニューが開くまで待機
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // コードエディターボタンをテキストで特定
    const codeEditorButton = Array.from(document.querySelectorAll('button.components-menu-item__button'))
      .find(button => {
        const span = button.querySelector('.components-menu-item__item');
        return span && span.textContent === 'コードエディター';
      });
    
    if (!codeEditorButton) {
      console.log('コードエディターボタン未検出');
      return false;
    }
    
    codeEditorButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// コードエディターを終了する関数を追加
async function exitCodeEditor() {
  try {
    // より具体的なセレクタでボタンを探す
    const exitButtons = Array.from(document.querySelectorAll('button.components-button.is-tertiary'));
    const exitButton = exitButtons.find(button => button.textContent === 'コードエディターを終了');
    
    if (exitButton) {
      console.log('終了ボタンを発見');
      exitButton.click();
      // 終了処理の完了を待つ
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 終了が成功したか確認
      const codeEditor = document.querySelector('.editor-post-text-editor');
      if (!codeEditor) {
        console.log('コードエディター終了成功');
        return true;
      }
    }
    
    console.log('終了ボタンが見つからないか、終了に失敗');
    return false;
  } catch (error) {
    console.error('exitCodeEditor エラー:', error);
    return false;
  }
}

// コンテンツの取得関数
async function getContent() {
  try {
    const switched = await switchToCodeEditor();
    if (!switched) {
      return { 
        success: false, 
        error: 'コードエディターへの切り替えに失敗' 
      };
    }

    const codeEditor = document.querySelector('.editor-post-text-editor');
    const titleEditor = document.querySelector('.components-textarea-control__input');
    
    if (!codeEditor || !titleEditor) {
      return { 
        success: false, 
        error: 'エディターが見つかりません' 
      };
    }

    const result = { 
      content: codeEditor.value || '',
      title: titleEditor.value || '',
      success: true 
    };

    // コピー完了後にコードエディターを終了
    await exitCodeEditor();
    return result;

  } catch (error) {
    console.error('getContent エラー:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// コンテンツの設定関数
async function setContent(data) {
  try {
    if (!data || !data.content) {
      return { 
        success: false, 
        error: 'コンテンツが指定されていません' 
      };
    }

    const switched = await switchToCodeEditor();
    if (!switched) {
      return { 
        success: false, 
        error: 'コードエディターへの切り替えに失敗' 
      };
    }

    const codeEditor = document.querySelector('.editor-post-text-editor');
    const titleEditor = document.querySelector('.components-textarea-control__input');
    
    if (!codeEditor || !titleEditor) {
      return { 
        success: false, 
        error: 'エディターが見つかりません' 
      };
    }

    titleEditor.value = data.title || '';
    codeEditor.value = data.content;

    [titleEditor, codeEditor].forEach(editor => {
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await exitCodeEditor();
    

    return { success: true };
  } catch (error) {
    console.error('setContent エラー:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// メッセージリスナーの修正
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getContent') {
    (async () => {
      try {
        const result = await getContent();
        sendResponse(result);
      } catch (error) {
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      }
    })();
    return true;
  }

  if (request.action === 'setContent') {
    (async () => {
      try {
        // requestから直接contentとtitleを取得
        const result = await setContent({
          content: request.content,
          title: request.title
        });
        sendResponse(result);
      } catch (error) {
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      }
    })();
    return true;
  }
  return false;
});