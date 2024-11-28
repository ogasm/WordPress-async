document.addEventListener('DOMContentLoaded', () => {
  const statusElement = document.getElementById('status');

  // ステータス表示関数を定義
  const updateStatus = (message) => {
    if (statusElement) {
      statusElement.textContent = message;
    }
  };

  // タブの取得を共通化
  const getCurrentTab = async () => {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tabs[0]?.id) {
      throw new Error('タブが見つかりません');
    }
    return tabs[0];
  };

  // メッセージ送信を共通化
  const sendMessage = async (tabId, message) => {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  // コピーボタンの処理
  document.getElementById('copyContent')?.addEventListener('click', async () => {
    try {
      const tab = await getCurrentTab();
      const response = await sendMessage(tab.id, {action: 'getContent'});

      if (response?.success) {
        await chrome.storage.local.set({
          wpContent: response.content,
          wpTitle: response.title
        });
        updateStatus('コピーしました');
      } else {
        updateStatus('エラー: ' + (response?.error || '不明なエラー'));
      }
    } catch (error) {
      updateStatus('エラー: ' + error.message);
    }
  });

  // 貼り付けボタンの処理
  document.getElementById('pasteContent')?.addEventListener('click', async () => {
    try {
      const tab = await getCurrentTab();
      const storage = await chrome.storage.local.get(['wpContent', 'wpTitle']);
      
      if (!storage.wpContent) {
        updateStatus('コピーされたコンテンツがありません');
        return;
      }

      const response = await sendMessage(tab.id, {
        action: 'setContent',
        content: storage.wpContent,
        title: storage.wpTitle
      });

      if (response?.success) {
        updateStatus('貼り付けました');
      } else {
        updateStatus('エラー: ' + (response?.error || '不明なエラー'));
      }
    } catch (error) {
      updateStatus('エラー: ' + error.message);
    }
  });
});