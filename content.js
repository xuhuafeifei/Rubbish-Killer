// 存储原始搜索词
let originalQuery = '';
let excludes = [];
let enabled = true;

// 从存储加载排除项
chrome.storage.sync.get('excludes', (data) => {
    excludes = data.excludes || ['csdn'];
});

// 生成排除字符串
function getExcludeString() {
    return excludes.map(item => `-${item}`).join(' ');
}

function getInputSelectorName() {
    // 检查是否是Bing
    if (window.location.hostname.includes('bing.com')) {
        return 'input[name="q"]';
    }
    // 检查是否是Google
    else if (window.location.hostname.includes('google.com')) {
        // 从你提供的HTML中可以看到Google的搜索框可能是textarea或input
        // 现代Google搜索使用textarea.gLFyf
        return 'textarea.gLFyf, input[name="q"]';
    }
    // 如果不是上述搜索引擎，返回一个通用的选择器（可选）
    return 'input[name="q"], textarea[name="q"]';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'add') {
        excludes.push(request.newData)

        // 修改输入框内的内容
        const searchInput = document.querySelector(getInputSelectorName());
        const modifyItem = '-' + request.newData
        if (searchInput && ! searchInput.value.includes(modifyItem)) {
            searchInput.value = searchInput.value + ' ' + modifyItem;
        }

    } else if (request.type === 'remove') {
        const index = excludes.indexOf(request.origin);
        if (index !== -1) {
            excludes.splice(index, 1);
        }
        console.log('remove', request.origin, ' excludes = ', excludes.join(','))

        // 移除输入框内的内容
        const searchInput = document.querySelector(getInputSelectorName());
        const removeItem = '-' + request.origin

        if (searchInput && searchInput.value.includes(removeItem)) {
            searchInput.value = searchInput.value.replace(removeItem, '').trim();
        }

    } else if (request.type == 'modify') {
        // 修改输入框内的内容
        const searchInput = document.querySelector(getInputSelectorName());
        const modifyItem = '-' + request.origin
        if (searchInput && searchInput.value.includes(modifyItem)) {
            console.log("modifyItem = ", modifyItem, " newData = ", request.newData)
            searchInput.value = searchInput.value.replace(modifyItem, '-' + request.newData).trim();
        }
        
        const index = excludes.indexOf(request.origin);
        if (index !== -1) {
            excludes[index] = request.newData;
        }
        console.log('modify', request.origin, ' excludes = ', excludes.join(',')) 
    } else if (request.type == 'enableAll') {
        // 修改输入框内的内容
        const searchInput = document.querySelector(getInputSelectorName());
        // 便利excludes数组，将每个元素添加到searchInput.value中
        excludes.forEach(item => {
            modifyItem = '-' + item
            if (!searchInput.value.includes(modifyItem)) {
                searchInput.value = searchInput.value + ' ' + modifyItem;
            }
        })
        enabled = true;
    } else if (request.type == 'disableAll') {
        // 修改输入框内的内容
        const searchInput = document.querySelector(getInputSelectorName());
        // 便利excludes数组，将每个元素添从searchInput.value中移除
        excludes.forEach(item => {
            modifyItem = '-' + item
            if (searchInput.value.includes(modifyItem)) {
                searchInput.value = searchInput.value.replace(modifyItem, '').trim();
            }
        })
        enabled = false;
    } else if (request.type == 'enableOrNot') {
        enabled = request.newData;
    }
});


function modifySearchInput() {
    const searchInput = document.querySelector(getInputSelectorName());
    if (searchInput && !searchInput.dataset.modified) {
        searchInput.dataset.modified = "true";

        const excludeStr = getExcludeString();

        // 聚焦时移除排除项
        searchInput.addEventListener('focus', function () {
            if (!enabled) {
                console.log('disabled! remove noting');
                return;
            }
            excludes.forEach(item => {
                item = '-' + item
                if (this.value.includes(item)) {
                    this.value = this.value.replace(item, '').trim();
                }
            })
        });

        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                if (!enabled) {
                    console.log('disabled! entry trigger and add noting');
                    return;
                }
                console.log(excludes)
                
                excludes.forEach(item => {
                    item = '-' + item
                    if (this.value.includes(item)) {
                        this.value = this.value.replace(item, '').trim();
                    } else {
                        this.value += ` ${item}`;
                    }
                })
            }
        });

        // 失去焦点时加回排除项
        searchInput.addEventListener('blur', function () {
            console.log(enabled)
            if (!enabled) {
                console.log('disabled! focus lost and add noting');
                return;
            }
            excludes.forEach(item => {
                item = '-' + item
                if (!this.value.includes(item)) {
                    this.value += ` ${item}`;
                }
            })
        });

        // 初始处理
        if (searchInput.value && !searchInput.value.includes(excludeStr)) {
            searchInput.value += ` ${excludeStr}`;
        }
    }
}

// 监听存储变化
chrome.storage.onChanged.addListener((changes) => {
    if (changes.excludes) {
        excludes = changes.excludes.newValue || [];
    }
});

// 初始执行
modifySearchInput();

// 监听动态内容加载
new MutationObserver(modifySearchInput).observe(
    document.body,
    { childList: true, subtree: true }
);