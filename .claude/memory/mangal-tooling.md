---
name: mangal-tooling
description: Как проверять мангал — smoke в Node, подписи размеров, снимки headless-браузером, обход обновлений Edge
metadata:
  type: reference
---

Скрипты — `mangal/tools/`. Запуск из `mangal/`: `node tools/smoke.js` (0 строк без « ok» = всё хорошо).
- `smoke.js` склеивает js/params, parts, model, dims, cut, dxf, ui в vm с пустышкой вместо THREE/DOM и гоняет 3 режима × наборы флагов. Ловит ReferenceError. Запускать после каждой правки.
- `labels.js` — все подписи размеров текстом: `node tools/labels.js grill mm`.
- `snap.py out.png "cx,cy,cz,tx,ty,tz" "dims" 'flags-json' [sel]`, `snapq.py out.png "?view=…"` — headless-снимок (сами добавляют `&shot=1`); `dxf_side.js`.
- Headless-окно Chrome не уже ~500 px — телефон проверять страницей с iframe 375 px.
- Edge иногда ставит обновление (рядом `new_msedge.exe`) — headless молча не стартует; тогда Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`) с уникальным `--user-data-dir`. Зависшие процессы гасить только свои (по профилю в командной строке), браузер Виталия не трогать.
- Проверка интерфейса или DXF: дописать в копию страницы `<script>` с проверкой и читать результат через `--dump-dom` (атрибут data-out).

Связано: [[mangal-project-state]].
