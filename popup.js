document.addEventListener('DOMContentLoaded', async () => {
        const toggleEnabled = document.getElementById('toggleEnabled');
        const toggleLabelOn = document.getElementById('toggleLabelOn');
        const toggleLabelOff = document.getElementById('toggleLabelOff');
    
        let { enabled = true } = await chrome.storage.sync.get('enabled');
        setMsg('enableOrNot', null, enabled);
        toggleEnabled.checked = enabled;
        updateToggleLabels();
    
        toggleEnabled.addEventListener('change', async () => {
          enabled = toggleEnabled.checked;
          await chrome.storage.sync.set({ enabled });
          updateToggleLabels();
          
          if (enabled) {
            await enableFilter();
          } else {
            await disableFilter();
          }
        });
    
        function updateToggleLabels() {
          if (toggleEnabled.checked) {
            toggleLabelOn.classList.add('active');
            toggleLabelOff.classList.remove('active');
          } else {
            toggleLabelOn.classList.remove('active');
            toggleLabelOff.classList.add('active');
          }
        }

        async function enableFilter() {
          setMsg('enableAll', null, null);
        }
        
        async function disableFilter() {
          console.log('Filter disabled');
          setMsg('disableAll', null, null);
        }

        /*-----------------------------------*/


    const excludeList = document.getElementById('excludeList');
    const newExclude = document.getElementById('newExclude');
    const addBtn = document.getElementById('addBtn');
    const statusMessage = document.getElementById('statusMessage');

    // 从存储加载排除项
    let { excludes = [] } = await chrome.storage.sync.get('excludes');

    // 渲染排除列表
    function renderExcludes() {
        excludeList.innerHTML = '';
        if (excludes.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = 'No exclusion items added yet';
            excludeList.appendChild(emptyMsg);
            return;
        }

        excludes.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'item';

            const input = document.createElement('input');
            input.type = 'text';
            input.value = item;
            input.placeholder = 'Exclusion item';
            input.addEventListener('input', debounce((e) => {
                const origin = excludes[index];
                excludes[index] = e.target.value.trim();
                saveExcludes();
                setMsg('modify', origin, excludes[index]);
            }, 300));

            const btn = document.createElement('button');
            btn.setAttribute('aria-label', 'Remove item');
            btn.addEventListener('click', () => {
                const removedItem = excludes[index];
                excludes.splice(index, 1);
                saveExcludes();
                setMsg('remove', removedItem, null);
                renderExcludes();
                showStatus(`Removed: ${removedItem}`);
            });

            div.appendChild(input);
            div.appendChild(btn);
            excludeList.appendChild(div);
        });
    }

    // 防抖函数
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    function showStatus(message) {
        statusMessage.textContent = message;
        setTimeout(() => statusMessage.textContent = '', 3000);
    }

    function setMsg(typeName, originData, newData) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: typeName,
                origin: originData,
                newData: newData
            });
        });
    }

    function saveExcludes() {
        chrome.storage.sync.set({ excludes });
    }

    addBtn.addEventListener('click', () => {
        const value = newExclude.value.trim();
        if (!value) return;
        
        if (excludes.includes(value)) {
            showStatus('This item already exists');
            return;
        }

        excludes.push(value);
        saveExcludes();
        setMsg('add', null, value);
        renderExcludes();
        newExclude.value = '';
        showStatus(`Added: ${value}`);
    });

    newExclude.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addBtn.click();
        }
    });

    renderExcludes();
});