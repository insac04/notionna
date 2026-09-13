(function () {
  'use strict';

  var root = document.documentElement;
  var searchInput = document.getElementById('manual-search');
  var searchStatus = document.getElementById('search-status');
  var results = document.getElementById('search-results');
  var sections = Array.from(document.querySelectorAll('#guide > section'));
  var themeToggle = document.getElementById('theme-toggle');
  var tocPanel = document.getElementById('toc-panel');
  var compactLayout = window.matchMedia('(max-width: 1020px)');
  var topics = [];
  var searchTimer;

  function normalize(value) {
    return value.normalize('NFKC').toLocaleLowerCase('ko').replace(/\s+/g, ' ').trim();
  }

  sections.forEach(function (section) {
    var sectionTitle = section.querySelector('h2').textContent;
    section.querySelectorAll('h3').forEach(function (heading) {
      var parts = [];
      var node = heading.nextElementSibling;
      while (node && node.tagName !== 'H3') {
        parts.push(node.textContent);
        node = node.nextElementSibling;
      }
      var body = parts.join(' ').replace(/\s+/g, ' ').trim();
      topics.push({
        id: heading.id,
        sectionId: section.id,
        sectionTitle: sectionTitle,
        title: heading.textContent,
        body: body,
        searchable: normalize(sectionTitle + ' ' + heading.textContent + ' ' + body)
      });
    });
  });

  function applyTheme(theme) {
    var dark = theme === 'dark';
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    themeToggle.checked = dark;
    document.getElementById('theme-light-label').classList.toggle('active', !dark);
    document.getElementById('theme-dark-label').classList.toggle('active', dark);
  }

  applyTheme(root.getAttribute('data-theme'));
  themeToggle.addEventListener('change', function () {
    var theme = themeToggle.checked ? 'dark' : 'light';
    applyTheme(theme);
    try { localStorage.setItem('manualTheme', theme); } catch (error) {}
  });

  function setTocLayout() {
    tocPanel.open = !compactLayout.matches;
  }
  setTocLayout();
  if (compactLayout.addEventListener) {
    compactLayout.addEventListener('change', setTocLayout);
  } else {
    compactLayout.addListener(setTocLayout);
  }

  function snippet(topic, tokens) {
    var lower = normalize(topic.body);
    var positions = tokens.map(function (token) { return lower.indexOf(token); })
      .filter(function (position) { return position >= 0; });
    var start = positions.length ? Math.max(0, Math.min.apply(null, positions) - 25) : 0;
    return (start ? '…' : '') + topic.body.slice(start, start + 125) +
      (topic.body.length > start + 125 ? '…' : '');
  }

  function runSearch() {
    clearTimeout(searchTimer);
    var query = normalize(searchInput.value);
    results.replaceChildren();
    if (!query) {
      sections.forEach(function (section) { section.hidden = false; });
      results.hidden = true;
      searchStatus.textContent = '검색어를 입력하면 관련 설명을 찾을 수 있습니다.';
      return;
    }

    var tokens = query.split(' ');
    var matches = topics.filter(function (topic) {
      return tokens.every(function (token) { return topic.searchable.includes(token); });
    });
    var matchingSections = new Set(matches.map(function (topic) { return topic.sectionId; }));
    sections.forEach(function (section) { section.hidden = !matchingSections.has(section.id); });
    results.hidden = false;

    var heading = document.createElement('h2');
    heading.textContent = matches.length ? '관련 설명 ' + matches.length + '개' : '검색 결과가 없습니다';
    results.appendChild(heading);
    searchStatus.textContent = matches.length
      ? matches.length + '개 설명 · ' + matchingSections.size + '개 장에서 찾았습니다. 결과를 누르면 해당 설명으로 이동합니다.'
      : '다른 단어로 검색하거나 초기화해 전체 매뉴얼을 확인하세요.';

    if (!matches.length) {
      var empty = document.createElement('p');
      empty.textContent = '짧은 기능 이름으로 검색해 보세요. 예: 이미지, 자동저장, 구매일, 백업';
      results.appendChild(empty);
      results.scrollIntoView({ block: 'start', behavior: 'instant' });
      return;
    }
    var list = document.createElement('ol');
    matches.forEach(function (topic) {
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = '#' + topic.id;
      link.textContent = topic.title;
      var description = document.createElement('small');
      description.textContent = topic.sectionTitle + ' · ' + snippet(topic, tokens);
      item.append(link, description);
      list.appendChild(item);
    });
    results.appendChild(list);
    results.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  function clearSearch() {
    searchInput.value = '';
    runSearch();
  }

  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 120);
  });
  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      clearSearch();
      searchInput.focus();
    }
  });
  document.getElementById('manual-search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    runSearch();
    searchInput.blur();
    if (!results.hidden) results.scrollIntoView({ block: 'start' });
  });
  document.getElementById('search-clear').addEventListener('click', function () {
    clearSearch();
    searchInput.focus();
  });
  document.getElementById('print-manual').addEventListener('click', function () { window.print(); });

  function revealTarget(hash) {
    var id;
    try { id = decodeURIComponent(hash.slice(1)); } catch (error) { return; }
    var target = document.getElementById(id);
    if (!target) return;
    var section = target.closest('#guide > section');
    if (section && section.hidden) {
      clearSearch();
      target.scrollIntoView({ block: 'start' });
    }
    document.querySelectorAll('.toc a').forEach(function (link) {
      if (section && link.getAttribute('href') === '#' + section.id) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  document.addEventListener('click', function (event) {
    if (!(event.target instanceof Element)) return;
    var link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    var hash = link.getAttribute('href');
    if (link.closest('.toc, .quick-links') || hash === '#top') clearSearch();
    revealTarget(hash);
    if (compactLayout.matches && link.closest('.toc')) tocPanel.open = false;
  });
  window.addEventListener('hashchange', function () {
    revealTarget(location.hash);
  });
  revealTarget(location.hash);
  document.querySelectorAll('[data-enhanced]').forEach(function (element) { element.hidden = false; });
})();
