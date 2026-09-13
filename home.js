(() => {
  'use strict';

  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-button');
  const themeColor = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    root.dataset.theme = theme;
    themeButton.setAttribute('aria-label', theme === 'dark' ? '밝은 화면으로 전환' : '어두운 화면으로 전환');
    themeButton.title = themeButton.getAttribute('aria-label');
    themeColor.content = theme === 'dark' ? '#192c2e' : '#f5f3eb';
  }

  applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
  themeButton.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('homeTheme', next); } catch (error) {}
  });

  // These are illustrative examples; they never read or modify app data.
  const collections = {
    food: {
      title: '우리 집 냉장고',
      one: ['우유', '1팩 · 냉장', '2일 남음'],
      two: ['토마토', '5개 · 채소', '4일 남음'],
      tip: '기한이 가까운 것부터, 잊지 않도록.',
      number: 'Nº 01'
    },
    daily: {
      title: '우리 집 생활 서랍',
      one: ['선크림', '1개 · 화장대', '30일 남음'],
      two: ['주방 세제', '2개 · 주방', '수량 확인'],
      tip: '잘 쓰고, 필요해지면 장보기 목록으로.',
      number: 'Nº 02'
    }
  };
  const collectionButtons = [...document.querySelectorAll('[data-collection]')];
  const cabinet = document.querySelector('.cabinet');

  collectionButtons.forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.collection;
      if (cabinet.dataset.cabinet === key) return;
      const collection = collections[key];
      cabinet.dataset.cabinet = key;
      collectionButtons.forEach(candidate => candidate.setAttribute('aria-pressed', String(candidate === button)));
      document.querySelector('.shelf-food').hidden = key !== 'food';
      document.querySelector('.shelf-daily').hidden = key !== 'daily';
      document.querySelector('.collection-number').textContent = collection.number;
      document.getElementById('inventory-title').textContent = collection.title;
      ['one', 'two'].forEach(row => {
        ['name', 'detail', 'date'].forEach((field, index) => {
          document.getElementById(`inventory-${field}-${row}`).textContent = collection[row][index];
        });
      });
      document.getElementById('inventory-tip').textContent = collection.tip;
    });
  });

  const tabs = [...document.querySelectorAll('.flow-tab')];
  const panels = [...document.querySelectorAll('.flow-panel')];
  const tabList = document.querySelector('.flow-tabs');
  const mobileLayout = window.matchMedia('(max-width: 800px)');

  function activateTab(tab, moveFocus = false) {
    tabs.forEach(candidate => {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', String(selected));
      candidate.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    if (moveFocus) tab.focus({ preventScroll: true });
  }

  function syncTabOrientation() {
    tabList.setAttribute('aria-orientation', mobileLayout.matches ? 'horizontal' : 'vertical');
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      const previous = mobileLayout.matches ? 'ArrowLeft' : 'ArrowUp';
      const next = mobileLayout.matches ? 'ArrowRight' : 'ArrowDown';
      let destination;
      if (event.key === previous) destination = (index + tabs.length - 1) % tabs.length;
      else if (event.key === next) destination = (index + 1) % tabs.length;
      else if (event.key === 'Home') destination = 0;
      else if (event.key === 'End') destination = tabs.length - 1;
      else return;
      event.preventDefault();
      activateTab(tabs[destination], true);
    });
  });
  syncTabOrientation();
  mobileLayout.addEventListener('change', syncTabOrientation);

  const palettes = { forest: '차분한 숲', ocean: '깊은 바다', clay: '따뜻한 흙' };
  const paletteButtons = [...document.querySelectorAll('button[data-palette]')];
  const colorSample = document.querySelector('.color-sample');
  paletteButtons.forEach(button => {
    button.addEventListener('click', () => {
      colorSample.dataset.palette = button.dataset.palette;
      document.getElementById('palette-name').textContent = palettes[button.dataset.palette];
      paletteButtons.forEach(candidate => candidate.setAttribute('aria-pressed', String(candidate === button)));
    });
  });

  root.classList.add('enhanced');
  document.getElementById('cabinet-hint').textContent = '보관함을 눌러 살펴보세요.';
  document.querySelectorAll('[data-enhanced]').forEach(element => { element.hidden = false; });
})();
