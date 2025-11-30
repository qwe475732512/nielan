// 全局存储数据
let customSkillData = { "f-skill": [], "v-skill": [] };
let customGachaData = { bg: {}, xp: {} };
let customIdCounter = { bg: 1, xp: 1 };

// 核心：奖品图片映射表（必须与实际文件名一致！）
const prizeImgMap = {
  "hero": {
    "李寻欢": "lixunhuan", "万钧": "wanjun", "蓝梦": "lanmeng", "希拉": "xila",
    "张起灵": "zhangqiling", "刘炼": "liulian", "魏轻": "weiqing", "哈迪": "hadi",
    "玉玲珑": "yulinglong", "季莹莹": "jiyingying", "胡为": "huwei", "沈妙": "shenmiao",
    "殷紫萍": "yinziping", "武田忠信": "wutianzhongxin", "顾清寒": "guqinghan", "无尘": "wuchen",
    "季沧海": "jicanghai", "迦南": "jianan", "宁红夜": "ninghongye", "特木尔": "temuer",
    "土御门胡桃": "tuyumenhuta", "天海": "tianhai", "妖刀姬": "yaodaoji", "崔三娘": "cuisanniang", "岳山": "yueshan"
  },
  "weapon": {
    "飞刀": "feidao", "拳刃": "quanren", "双戟": "shuangji", "双刀": "shuangdao",
    "双节棍": "shuangjiegun", "枪": "qiang", "扇": "shan", "匕首": "bishou",
    "横刀": "hengdao", "太刀": "taidao", "阔刀": "kuodao", "斩马刀": "zhanmadao",
    "长剑": "changjian", "链剑": "lianjian"
  },
  "remote": {
    "弓箭": "gongjian", "火炮": "huopao", "连弩": "liannu", "鸟铳": "niaochong", "五眼铳": "wuyanchong"
  }
};

// Netlify站点域名（替换为你的实际域名！）
const NETLIFY_DOMAIN = "https://buhuoinielan.netlify.app";

// 页面DOM加载完成后立即执行（优化执行顺序）
document.addEventListener('DOMContentLoaded', function() {
  // 优先执行核心功能
  bindMainTabSwitch();
  bindSubTabSwitch();
  bindMainGachaEvent();
  
  // 非核心功能延迟执行，避免首屏卡顿
  setTimeout(() => {
    bindSkillSaveEvent();
    bindSkillGachaEvent();
    bindAddCustomEvent('bg');
    bindCustomConfigEvent('bg', 1);
    bindCustomGachaEvent('bg', 1);
    bindAddCustomEvent('xp');
    bindCustomConfigEvent('xp', 1);
    bindCustomGachaEvent('xp', 1);
    initImgErrorHandler();
  }, 100);
});

/**
 * 1. 一级标签切换逻辑（薄荷奶绿/小泡芙）- 防抖优化
 */
function bindMainTabSwitch() {
  const mainTabBtns = document.querySelectorAll('.main-tab-btn');
  const mainTabContainers = document.querySelectorAll('.main-tab-container');
  let isSwitching = false; // 防抖标记

  mainTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isSwitching) return;
      isSwitching = true;

      mainTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetId = btn.getAttribute('data-target');
      mainTabContainers.forEach(container => {
        container.classList.remove('active');
        if (container.id === targetId) {
          container.classList.add('active');
        }
      });

      setTimeout(() => {
        isSwitching = false;
      }, 100);
    });
  });
}

/**
 * 2. 二级标签切换逻辑（武器/远程/英雄/自定义）- 防抖优化
 */
function bindSubTabSwitch() {
  const subTabBtns = document.querySelectorAll('.sub-tab-btn');
  const gachaContainers = document.querySelectorAll('.gacha-container');
  let isSwitching = false; // 防抖标记

  subTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isSwitching) return;
      isSwitching = true;

      subTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetId = btn.getAttribute('data-target');
      gachaContainers.forEach(container => {
        container.classList.remove('active');
        if (container.id === targetId) {
          container.classList.add('active');
        }
      });

      setTimeout(() => {
        isSwitching = false;
      }, 100);
    });
  });
}

/**
 * 3. 核心：武器/远程/英雄抽卡逻辑（修改为Netlify绝对路径 + 重试逻辑）
 */
function bindMainGachaEvent() {
  const gachaBtns = document.querySelectorAll('.gacha-btn:not(.skill-gacha-btn):not(.custom-gacha-btn)');

  gachaBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const type = this.getAttribute('data-type');
      const prizes = JSON.parse(this.getAttribute('data-prizes'));
      const container = this.closest('.gacha-container');
      const resultImg = container.querySelector('.result-img');
      const resultName = container.querySelector('.result-name');

      // 重置状态
      resultImg.style.display = 'none';
      resultName.textContent = '抽取中...';
      this.disabled = true;

      // 模拟抽卡延迟
      setTimeout(() => {
        try {
          // 随机抽取奖品
          const randomIndex = Math.floor(Math.random() * prizes.length);
          const selectedPrize = prizes[randomIndex];
          // 获取图片名（映射）
          const imgName = prizeImgMap[type][selectedPrize];
          // 核心修改：使用Netlify绝对路径
          const imgPath = `${NETLIFY_DOMAIN}/images/${type}/${imgName}.webp`;

          // 加载图片（确保加载成功后显示 + 重试逻辑）
          const img = new Image();
          img.onload = function() {
            resultImg.src = imgPath;
            resultImg.alt = selectedPrize;
            resultImg.style.display = 'block'; // 加载成功才显示
            resultName.textContent = selectedPrize;
            // 强制触发重绘，避免渲染延迟
            resultImg.offsetHeight;
          };
          img.onerror = function() {
            // 第一次加载失败，重试一次
            const retryImg = new Image();
            retryImg.onload = function() {
              resultImg.src = imgPath;
              resultImg.style.display = 'block';
              resultName.textContent = selectedPrize;
            };
            retryImg.onerror = function() {
              // 最终失败仅提示文字
              resultName.textContent = `${selectedPrize}（图片缺失）`;
            };
            retryImg.src = imgPath;
          };
          // 强制触发加载
          img.src = imgPath;
        } catch (e) {
          resultName.textContent = '抽取失败，请重试';
          console.error('抽卡出错：', e);
        } finally {
          // 恢复按钮
          this.disabled = false;
        }
      }, 500);
    });
  });
}

/**
 * 4. F/V技能保存逻辑
 */
function bindSkillSaveEvent() {
  const saveBtns = document.querySelectorAll('.skill-save-btn');

  saveBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const skillType = btn.getAttribute('data-skill-type');
      const inputBox = btn.closest('.skill-wheel-card').querySelector('.skill-custom-input');
      const resultArea = btn.closest('.skill-wheel-card').querySelector('.skill-result-name');

      const inputContent = inputBox.value.trim().split('\n').filter(item => item.trim() !== '');
      if (inputContent.length === 0) {
        resultArea.textContent = "⚠️ 请输入至少一个内容！";
        resultArea.style.color = "#ff4444";
        return;
      }

      customSkillData[skillType] = inputContent;
      resultArea.textContent = "✅ 保存成功！";
      resultArea.style.color = "#2ecc71";

      setTimeout(() => {
        if (resultArea.textContent.includes("保存成功")) {
          resultArea.textContent = "未抽取";
          resultArea.style.color = "#333";
        }
      }, 3000);
    });
  });
}

/**
 * 5. F/V技能抽取逻辑
 */
function bindSkillGachaEvent() {
  const skillBtns = document.querySelectorAll('.skill-gacha-btn');

  skillBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      try {
        const skillType = this.getAttribute('data-skill-type');
        const resultArea = this.closest('.skill-wheel-card').querySelector('.skill-result-name');
        const skillList = customSkillData[skillType];

        if (skillList.length === 0) {
          resultArea.textContent = "⚠️ 请先保存内容！";
          resultArea.style.color = "#ff4444";
          return;
        }

        this.disabled = true;
        this.textContent = "抽取中...";
        resultArea.textContent = "抽取中...";

        setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * skillList.length);
          const selectedSkill = skillList[randomIndex];

          resultArea.textContent = `抽到：${selectedSkill}`;
          resultArea.style.color = skillType === 'f-skill' ? '#3399ff' : '#ff4444';

          this.disabled = false;
          this.textContent = skillType === 'f-skill' ? '抽取F技能' : '抽取V技能';
        }, 300);
      } catch (e) {
        const resultArea = this.closest('.skill-wheel-card').querySelector('.skill-result-name');
        resultArea.textContent = "⚠️ 抽取失败，请重试";
        resultArea.style.color = "#ff4444";
        this.disabled = false;
        this.textContent = this.getAttribute('data-skill-type') === 'f-skill' ? '抽取F技能' : '抽取V技能';
        console.error('技能抽取出错：', e);
      }
    });
  });
}

/**
 * 6. 新增自定义抽卡逻辑
 */
function bindAddCustomEvent(type) {
  const addBtn = type === 'bg' 
    ? document.querySelector('.add-custom-btn.bg-green') 
    : document.querySelector('.add-custom-btn.bg-pink');
  const wrapper = type === 'bg' 
    ? document.querySelector('.custom-container-wrapper.bg-green-wrapper') 
    : document.querySelector('.custom-container-wrapper.bg-pink-wrapper');
  const colorClass = type === 'bg' ? 'bg-green' : 'bg-pink';

  if (!addBtn || !wrapper) return;

  addBtn.addEventListener('click', () => {
    customIdCounter[type]++;
    const newId = customIdCounter[type];
    const dataId = `${type}-${newId}`;

    const newCustomArea = document.createElement('div');
    newCustomArea.className = 'custom-setting-area';
    newCustomArea.setAttribute('data-custom-id', dataId);
    newCustomArea.innerHTML = `
      <div class="custom-setting-card ${colorClass}-card">
        <h3>自定义抽卡配置 #${newId}</h3>
        <div class="setting-item">
          <label>抽卡按钮名称：</label>
          <input type="text" class="custom-btn-name" placeholder="示例：武器品质、甲品质、地图">
        </div>
        <div class="setting-item">
          <label>抽卡内容（每行一个）：</label>
          <textarea class="custom-prize-input" placeholder="请输入要抽取的内容，每行一个&#10;示例：&#10;白甲蓝甲紫甲&#10;白刀蓝刀紫刀&#10;火罗国龙影洞天"></textarea>
        </div>
        <div class="setting-item">
          <label>自定义图片（可选）：</label>
          <div class="custom-img-upload">
            <input type="file" class="custom-img-input" multiple accept="image/png,image/jpg,image/jpeg,image/webp">
            <button class="save-custom-config ${colorClass}-btn">保存所有配置</button>
          </div>
        </div>
      </div>
      <div class="custom-gacha-area">
        <button class="custom-gacha-btn ${colorClass}-btn">请先配置抽卡内容</button>
        <div class="result-box custom-result-box ${colorClass}-box">
          <img class="result-img custom-result-img" src="" alt="自定义抽卡结果">
          <div class="result-name custom-result-name">未配置抽卡内容</div>
        </div>
      </div>
    `;

    wrapper.appendChild(newCustomArea);
    bindCustomConfigEvent(type, newId);
    bindCustomGachaEvent(type, newId);
  });
}

/**
 * 7. 自定义抽卡配置保存逻辑（内存优化）
 */
function bindCustomConfigEvent(type, customId) {
  const dataId = `${type}-${customId}`;
  const customArea = document.querySelector(`.custom-setting-area[data-custom-id="${dataId}"]`);
  
  if (!customArea) return;

  const saveConfigBtn = customArea.querySelector('.save-custom-config');
  const btnNameInput = customArea.querySelector('.custom-btn-name');
  const prizeInput = customArea.querySelector('.custom-prize-input');
  const imgInput = customArea.querySelector('.custom-img-input');
  const customGachaBtn = customArea.querySelector('.custom-gacha-btn');
  const resultName = customArea.querySelector('.custom-result-name');

  saveConfigBtn.addEventListener('click', () => {
    try {
      const btnName = btnNameInput.value.trim() || "自定义抽取";
      const prizes = prizeInput.value.trim().split('\n').filter(item => item.trim() !== '');
      
      if (prizes.length === 0) {
        resultName.textContent = "⚠️ 请输入至少一个内容！";
        resultName.style.color = "#ff4444";
        return;
      }

      // 释放旧图片URL，避免内存泄漏
      if (customGachaData[type][customId]?.imgMap) {
        Object.values(customGachaData[type][customId].imgMap).forEach(url => {
          URL.revokeObjectURL(url);
        });
      }

      // 处理上传图片
      const files = imgInput.files;
      const imgMap = {};
      if (files.length > 0) {
        prizes.forEach((prize, index) => {
          if (index < files.length) {
            const file = files[index];
            if (file.size > 5 * 1024 * 1024) {
              resultName.textContent = "⚠️ 图片大小不能超过5MB！";
              resultName.style.color = "#ff4444";
              return;
            }
            imgMap[prize] = URL.createObjectURL(file);
          }
        });
      }

      customGachaData[type][customId] = {
        btnName: btnName,
        prizes: prizes,
        imgMap: imgMap
      };

      customGachaBtn.textContent = btnName;
      customGachaBtn.disabled = false;

      resultName.textContent = "✅ 配置保存成功！可开始抽取";
      resultName.style.color = "#2ecc71";

      setTimeout(() => {
        if (resultName.textContent.includes("保存成功")) {
          resultName.textContent = "未抽取";
          resultName.style.color = "#333";
        }
      }, 3000);
    } catch (e) {
      resultName.textContent = "⚠️ 配置保存失败";
      resultName.style.color = "#ff4444";
      console.error('自定义配置出错：', e);
    }
  });
}

/**
 * 8. 自定义抽卡抽取逻辑
 */
function bindCustomGachaEvent(type, customId) {
  const dataId = `${type}-${customId}`;
  const customArea = document.querySelector(`.custom-setting-area[data-custom-id="${dataId}"]`);
  
  if (!customArea) return;

  const customGachaBtn = customArea.querySelector('.custom-gacha-btn');
  const resultImg = customArea.querySelector('.custom-result-img');
  const resultName = customArea.querySelector('.custom-result-name');

  customGachaBtn.addEventListener('click', function() {
    try {
      const config = customGachaData[type][customId];
      if (!config || config.prizes.length === 0) {
        resultName.textContent = "⚠️ 请先配置抽卡内容！";
        resultName.style.color = "#ff4444";
        return;
      }

      const { btnName, prizes, imgMap } = config;

      resultImg.style.display = 'none';
      resultName.textContent = "抽取中...";
      this.disabled = true;
      this.textContent = "抽取中...";

      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * prizes.length);
        const selectedPrize = prizes[randomIndex];
        const imgUrl = imgMap[selectedPrize] || "";

        if (imgUrl) {
          const img = new Image();
          img.onload = function() {
            resultImg.src = imgUrl;
            resultImg.style.display = 'block';
          };
          img.onerror = function() {
            resultImg.style.display = 'none';
            resultName.textContent = `${selectedPrize}（图片加载失败）`;
          };
          img.src = imgUrl;
        }

        resultName.textContent = selectedPrize;
        this.disabled = false;
        this.textContent = btnName;
      }, 300);
    } catch (e) {
      resultName.textContent = "⚠️ 抽取失败，请重试";
      resultName.style.color = "#ff4444";
      this.disabled = false;
      const config = customGachaData[type][customId];
      this.textContent = config?.btnName || "自定义抽取";
      console.error('自定义抽卡出错：', e);
    }
  });
}

/**
 * 初始化图片错误处理
 */
function initImgErrorHandler() {
  document.querySelectorAll('img').forEach(img => {
    img.onerror = function() {
      this.style.display = 'none';
      const resultName = this.closest('.result-box')?.querySelector('.result-name');
      if (resultName && !resultName.textContent.includes("图片")) {
        resultName.textContent = `${resultName.textContent.split('（')[0]}（图片加载失败）`;
      }
    };
    // 图片加载超时兜底
    img.dataset.loadTimeout = setTimeout(() => {
      if (!img.complete) {
        img.onerror();
      }
    }, 5000);
  });
}